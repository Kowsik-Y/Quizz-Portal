const db = require("../config/database");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;

/**
 * Generate a unique certificate code
 * Format: CERT-{testId}-{studentId}-{timestamp}-{random}
 */
function generateCertificateCode(testId, studentId) {
	const timestamp = Date.now();
	const random = crypto.randomBytes(4).toString("hex").toUpperCase();
	return `CERT-${testId}-${studentId}-${timestamp}-${random}`;
}

/**
 * Check if a student qualifies for a certificate based on test threshold
 * @param {number} attemptId - The attempt ID
 * @returns {Promise<{qualifies: boolean, percentage: number, test: object, attempt: object}>}
 */
async function checkCertificateEligibility(attemptId) {
	try {
		// Get attempt details
		const attemptResult = await db.query(
			`SELECT ta.*, t.passing_score, t.title as test_title, t.id as test_id
			 FROM test_attempts ta
			 JOIN tests t ON ta.test_id = t.id
			 WHERE ta.id = $1 AND ta.status = 'submitted'`,
			[attemptId],
		);

		if (attemptResult.rows.length === 0) {
			return { qualifies: false, reason: "Attempt not found or not submitted" };
		}

		const attempt = attemptResult.rows[0];
		const percentage =
			attempt.total_points > 0
				? (parseFloat(attempt.score) / attempt.total_points) * 100
				: 0;

		// Check if student already has a certificate for this attempt
		const existingCert = await db.query(
			"SELECT id FROM certificates WHERE attempt_id = $1 AND is_active = true",
			[attemptId],
		);

		if (existingCert.rows.length > 0) {
			return { qualifies: false, reason: "Certificate already issued" };
		}

		// Check if percentage meets passing score threshold
		const passingScore = attempt.passing_score || 60; // Default 60%
		const qualifies = percentage >= passingScore;

		return {
			qualifies,
			percentage: Math.round(percentage),
			test: {
				id: attempt.test_id,
				title: attempt.test_title,
				passing_score: passingScore,
			},
			attempt: {
				id: attempt.id,
				score: parseFloat(attempt.score),
				total_points: attempt.total_points,
				student_id: attempt.student_id,
			},
		};
	} catch (error) {
		console.error("Error checking certificate eligibility:", error);
		throw error;
	}
}

/**
 * Generate certificate data (PDF URL and Badge URL will be generated later)
 * For now, we'll create the certificate record and return URLs that can be generated on-demand
 */
async function generateCertificate(
	attemptId,
	testId,
	studentId,
	certificateType = "both",
) {
	try {
		// Check eligibility
		const eligibility = await checkCertificateEligibility(attemptId);
		if (!eligibility.qualifies) {
			throw new Error(
				eligibility.reason || "Student does not qualify for certificate",
			);
		}

		// Generate certificate code
		const certificateCode = generateCertificateCode(testId, studentId);

		// Get student and test details
		const studentResult = await db.query(
			"SELECT name, email FROM users WHERE id = $1",
			[studentId],
		);
		const student = studentResult.rows[0];

		const testResult = await db.query(
			"SELECT title, description FROM tests WHERE id = $1",
			[testId],
		);
		const test = testResult.rows[0];

		// Generate verification URL
		const baseUrl =
			process.env.FRONTEND_URL ||
			process.env.API_URL ||
			"http://localhost:8081";
		const verificationUrl = `${baseUrl}/verify-certificate?code=${certificateCode}`;

		// For now, we'll not set actual file URLs until PDF/badge are generated on-demand
		const pdfUrl = null;
		const badgeUrl = null;

		// Insert certificate record
		const result = await db.query(
			`INSERT INTO certificates (
				test_id, student_id, attempt_id, certificate_code, 
				certificate_type, pdf_url, badge_url, issued_at, is_active
			) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, true)
			RETURNING *`,
			[
				testId,
				studentId,
				attemptId,
				certificateCode,
				certificateType,
				pdfUrl,
				badgeUrl,
			],
		);

		const certificate = result.rows[0];

		return {
			certificate,
			certificateCode,
			verificationUrl,
			student: {
				name: student.name,
				email: student.email,
			},
			test: {
				title: test.title,
				description: test.description,
			},
			score: eligibility.attempt.score,
			totalPoints: eligibility.attempt.total_points,
			percentage: eligibility.percentage,
		};
	} catch (error) {
		console.error("Error generating certificate:", error);
		throw error;
	}
}

/**
 * Verify a certificate by code (public endpoint)
 */
async function verifyCertificate(certificateCode) {
	try {
		const result = await db.query(
			`SELECT c.*, 
				t.title as test_title, t.description as test_description,
				u.name as student_name, u.email as student_email,
				ta.score, ta.total_points, ta.submitted_at
			 FROM certificates c
			 JOIN tests t ON c.test_id = t.id
			 JOIN users u ON c.student_id = u.id
			 JOIN test_attempts ta ON c.attempt_id = ta.id
			 WHERE c.certificate_code = $1 AND c.is_active = true`,
			[certificateCode],
		);

		if (result.rows.length === 0) {
			return { valid: false, reason: "Certificate not found or inactive" };
		}

		const certificate = result.rows[0];
		const percentage =
			certificate.total_points > 0
				? Math.round(
						(parseFloat(certificate.score) / certificate.total_points) * 100,
					)
				: 0;

		// Update verified_at timestamp
		await db.query(
			"UPDATE certificates SET verified_at = CURRENT_TIMESTAMP WHERE id = $1",
			[certificate.id],
		);

		return {
			valid: true,
			certificate: {
				id: certificate.id,
				certificate_code: certificate.certificate_code,
				test_title: certificate.test_title,
				test_description: certificate.test_description,
				student_name: certificate.student_name,
				student_email: certificate.student_email,
				score: parseFloat(certificate.score),
				total_points: certificate.total_points,
				percentage: percentage,
				issued_at: certificate.issued_at,
				verified_at: certificate.verified_at || new Date(),
			},
		};
	} catch (error) {
		console.error("Error verifying certificate:", error);
		throw error;
	}
}

/**
 * Auto-issue certificate for a submitted attempt if eligible
 */
async function autoIssueCertificate(attemptId) {
	try {
		const eligibility = await checkCertificateEligibility(attemptId);

		if (!eligibility.qualifies) {
			return { issued: false, reason: eligibility.reason };
		}

		const certificate = await generateCertificate(
			attemptId,
			eligibility.test.id,
			eligibility.attempt.student_id,
			"both",
		);

		return { issued: true, certificate };
	} catch (error) {
		console.error("Error auto-issuing certificate:", error);
		return { issued: false, error: error.message };
	}
}

module.exports = {
	generateCertificateCode,
	checkCertificateEligibility,
	generateCertificate,
	verifyCertificate,
	autoIssueCertificate,
};
