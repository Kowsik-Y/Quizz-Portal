const db = require("../config/database");
const certificateService = require("../services/certificateService");
const { authenticate } = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Helper: create a styled PDF for a certificate and return filepath + public URL
async function createPdfForCertificate(cert, filename, req) {
	const PDFDocument = require("pdfkit");
	const fs = require("fs");
	const path = require("path");

	   const uploadsDir = '/tmp/uploads';
	   await fs.promises.mkdir(uploadsDir, { recursive: true });

	const filepath = path.join(uploadsDir, filename);

	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			size: "A4",
			margin: 0,
			bufferPages: true,
		});

		const writeStream = fs.createWriteStream(filepath);
		doc.pipe(writeStream);

		// ===== Enhanced Color Palette =====
		const colors = {
			primary: "#2563eb", // Rich blue
			secondary: "#7c3aed", // Purple
			accent: "#f59e0b", // Gold
			dark: "#111827", // Near black
			textDark: "#000000", // Pure black for all text
			border: "#d1d5db", // Light gray border
			background: "#f9fafb", // Very light background
			white: "#ffffff",
		};

		const pageWidth = doc.page.width;
		const pageHeight = doc.page.height;

		// ===== Background =====
		doc.rect(0, 0, pageWidth, pageHeight).fillColor(colors.background).fill();

		// ===== Decorative Header Band =====
		doc
			.rect(0, 60, pageWidth, 120)
			.fillColor(colors.primary)
			.fillOpacity(0.05)
			.fill();

		doc.fillOpacity(1); // Reset opacity

		// ===== Main Border Frame =====
		// Outer border
		doc
			.rect(30, 30, pageWidth - 60, pageHeight - 60)
			.strokeColor(colors.primary)
			.lineWidth(4)
			.stroke();

		// Inner border
		doc
			.rect(40, 40, pageWidth - 80, pageHeight - 80)
			.strokeColor(colors.accent)
			.lineWidth(2)
			.stroke();

		// Decorative corner elements
		const cornerSize = 30;
		const corners = [
			{ x: 40, y: 40 }, // Top-left
			{ x: pageWidth - 40, y: 40 }, // Top-right
			{ x: 40, y: pageHeight - 40 }, // Bottom-left
			{ x: pageWidth - 40, y: pageHeight - 40 }, // Bottom-right
		];

		corners.forEach((corner) => {
			doc.circle(corner.x, corner.y, 8).fillColor(colors.accent).fill();
			doc.circle(corner.x, corner.y, 4).fillColor(colors.white).fill();
		});

		// ===== Header Section =====
		const headerY = 100;

		// Decorative top element
		doc
			.circle(pageWidth / 2, headerY, 25)
			.fillColor(colors.primary)
			.fill();
		doc
			.circle(pageWidth / 2, headerY, 18)
			.fillColor(colors.accent)
			.fill();
		doc
			.circle(pageWidth / 2, headerY, 12)
			.fillColor(colors.white)
			.fill();

		// "CERTIFICATE" title
		doc
			.fontSize(32)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text("CERTIFICATE", 60, headerY + 35, {
				width: pageWidth - 120,
				align: "center",
			});

		// Subtitle
		doc
			.fontSize(14)
			.font("Helvetica")
			.fillColor(colors.textDark)
			.text("OF ACHIEVEMENT", 60, headerY + 72, {
				width: pageWidth - 120,
				align: "center",
			});

		// Decorative line under header
		const lineY = headerY + 100;
		doc
			.moveTo(pageWidth / 2 - 100, lineY)
			.lineTo(pageWidth / 2 + 100, lineY)
			.strokeColor(colors.accent)
			.lineWidth(3)
			.stroke();

		// ===== "This Certifies That" Section =====
		const certifiesY = lineY + 35;
		doc
			.fontSize(13)
			.font("Helvetica")
			.fillColor(colors.textDark)
			.text("This is to certify that", 60, certifiesY, {
				width: pageWidth - 120,
				align: "center",
			});

		// ===== Student Name Section =====
		const nameY = certifiesY + 35;
		const nameBoxHeight = 60;

		// Name background box
		doc
			.rect(pageWidth / 2 - 200, nameY - 8, 400, nameBoxHeight)
			.fillColor(colors.primary)
			.fillOpacity(0.08)
			.fill();

		doc.fillOpacity(1); // Reset opacity

		// Student name - centered and bold
		doc
			.fontSize(36)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text(cert.student_name || "Student Name", 60, nameY + 8, {
				width: pageWidth - 120,
				align: "center",
			});

		// Decorative underline
		const nameUnderlineY = nameY + nameBoxHeight;
		doc
			.moveTo(pageWidth / 2 - 180, nameUnderlineY)
			.lineTo(pageWidth / 2 + 180, nameUnderlineY)
			.strokeColor(colors.accent)
			.lineWidth(2)
			.stroke();

		// ===== Achievement Text =====
		const achievementY = nameUnderlineY + 30;
		doc
			.fontSize(13)
			.font("Helvetica")
			.fillColor(colors.textDark)
			.text("has successfully completed", 60, achievementY, {
				width: pageWidth - 120,
				align: "center",
			});

		// ===== Test Title Section =====
		const testY = achievementY + 30;
		doc
			.fontSize(24)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text(cert.test_title || "Test Title", 60, testY, {
				width: pageWidth - 120,
				align: "center",
			});

		// Decorative elements around test title
		const starY = testY + 12;
		drawStar(doc, pageWidth / 2 - 150, starY, 8, colors.accent);
		drawStar(doc, pageWidth / 2 + 150, starY, 8, colors.accent);

		// ===== Score and Date Section =====
		const detailsY = testY + 55;

		// Background panel for details
		doc
			.rect(pageWidth / 2 - 220, detailsY - 15, 440, 80)
			.fillColor(colors.white)
			.fill();

		doc
			.rect(pageWidth / 2 - 220, detailsY - 15, 440, 80)
			.strokeColor(colors.border)
			.lineWidth(1)
			.stroke();

		const score =
			typeof cert.score !== "undefined" ? cert.score : (cert.score_raw ?? 0);
		const total =
			typeof cert.total_points !== "undefined"
				? cert.total_points
				: (cert.total_points_raw ?? 0);
		const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

		// Score section - centered
		doc
			.fontSize(11)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text("SCORE ACHIEVED", pageWidth / 2 - 220, detailsY, {
				width: 220,
				align: "center",
			});

		doc
			.fontSize(24)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text(`${score}/${total}`, pageWidth / 2 - 220, detailsY + 20, {
				width: 220,
				align: "center",
			});

		doc
			.fontSize(12)
			.font("Helvetica")
			.fillColor(colors.textDark)
			.text(`${percentage}%`, pageWidth / 2 - 220, detailsY + 48, {
				width: 220,
				align: "center",
			});

		// Date section - centered
		const dateStr = new Date(cert.issued_at || Date.now()).toLocaleDateString(
			"en-US",
			{ year: "numeric", month: "long", day: "numeric" },
		);

		doc
			.fontSize(11)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text("DATE ISSUED", pageWidth / 2, detailsY, {
				width: 220,
				align: "center",
			});

		doc
			.fontSize(13)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text(dateStr, pageWidth / 2, detailsY + 25, {
				width: 220,
				align: "center",
			});

		// ===== Certificate Code =====
		const codeY = detailsY + 95;
		doc
			.fontSize(10)
			.font("Helvetica")
			.fillColor(colors.textDark)
			.text(`Certificate ID: ${cert.certificate_code}`, 60, codeY, {
				width: pageWidth - 120,
				align: "center",
			});

		// ===== Signature Section =====
		const sigY = codeY + 40;
		const sigLineWidth = 150;
		const sigLineY = sigY + 35;

		// Left signature
		const leftSigX = pageWidth / 2 - 200;
		doc
			.moveTo(leftSigX, sigLineY)
			.lineTo(leftSigX + sigLineWidth, sigLineY)
			.strokeColor(colors.textDark)
			.lineWidth(1.5)
			.stroke();

		doc
			.fontSize(11)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text("Director", leftSigX, sigLineY + 10, {
				width: sigLineWidth,
				align: "center",
			});

		// Right signature
		const rightSigX = pageWidth / 2 + 50;
		doc
			.moveTo(rightSigX, sigLineY)
			.lineTo(rightSigX + sigLineWidth, sigLineY)
			.strokeColor(colors.textDark)
			.lineWidth(1.5)
			.stroke();

		doc
			.fontSize(11)
			.font("Helvetica-Bold")
			.fillColor(colors.textDark)
			.text("Instructor", rightSigX, sigLineY + 10, {
				width: sigLineWidth,
				align: "center",
			});

		// ===== Footer Seal =====
		const sealX = pageWidth / 2;
		const sealY = pageHeight - 70;

		// Outer circle
		doc
			.circle(sealX, sealY, 28)
			.strokeColor(colors.primary)
			.lineWidth(3)
			.stroke();

		// Middle circle
		doc
			.circle(sealX, sealY, 22)
			.strokeColor(colors.accent)
			.lineWidth(2)
			.stroke();

		// Inner filled circle
		doc
			.circle(sealX, sealY, 15)
			.fillColor(colors.primary)
			.fillOpacity(0.2)
			.fill();

		doc.fillOpacity(1); // Reset opacity

		// Inner dot
		doc.circle(sealX, sealY, 6).fillColor(colors.accent).fill();

		// ===== Finish PDF =====
		doc.end();

		writeStream.on("finish", () => {
			const baseUrl = `${req.protocol}://${req.get("host")}`;
			const pdfUrl = `${baseUrl.replace(/\/$/, "")}/uploads/certificates/${encodeURIComponent(filename)}`;
			resolve({ filepath, pdfUrl });
		});

		writeStream.on("error", (err) => {
			reject(err);
		});
	});
}

// Helper function to draw a star
function drawStar(doc, x, y, size, color) {
	const points = 5;
	const outerRadius = size;
	const innerRadius = size * 0.4;

	doc.fillColor(color);

	for (let i = 0; i < points * 2; i++) {
		const radius = i % 2 === 0 ? outerRadius : innerRadius;
		const angle = (Math.PI * i) / points - Math.PI / 2;
		const px = x + radius * Math.cos(angle);
		const py = y + radius * Math.sin(angle);

		if (i === 0) {
			doc.moveTo(px, py);
		} else {
			doc.lineTo(px, py);
		}
	}

	doc.closePath().fill();
}

// Helper function to draw radial gradient circle (from original - kept for compatibility)
function drawRadialGradientCircle(doc, x, y, radius, color1, color2, opacity) {
	doc.save();
	doc.fillColor(color1).fillOpacity(opacity);
	doc.circle(x, y, radius).fill();
	doc.fillColor(color2).fillOpacity(opacity * 0.5);
	doc.circle(x, y, radius * 0.6).fill();
	doc.restore();
}

// Helper function to draw radial gradient circle (from original - kept for compatibility)
function drawRadialGradientCircle(doc, x, y, radius, color1, color2, opacity) {
	doc.save();
	doc.fillColor(color1).fillOpacity(opacity);
	doc.circle(x, y, radius).fill();
	doc.fillColor(color2).fillOpacity(opacity * 0.5);
	doc.circle(x, y, radius * 0.6).fill();
	doc.restore();
}

// Create a temporary PDF in uploads/temp and schedule its deletion after TTL (ms)
async function createTempPdfForCertificate(
	cert,
	filename,
	req,
	ttlMs = 1000 * 60 * 5,
) {
	const tempDir = path.join(__dirname, "..", "..", "uploads", "temp");
	await fs.promises.mkdir(tempDir, { recursive: true });

	const filepath = path.join(tempDir, filename);

	// Use a small PDF with same styling as createPdfForCertificate
	const doc = new PDFDocument({ size: "A4", margin: 48 });
	const writeStream = fs.createWriteStream(filepath);
	doc.pipe(writeStream);

	const accent = "#f59e0b";
	const dark = "#000000"; // Pure black
	const lightText = "#1a1a1a"; // Very dark gray

	doc.rect(0, 0, doc.page.width, 120).fill(accent);
	doc
		.fillColor("white")
		.fontSize(26)
		.font("Helvetica-Bold")
		.text("Certificate of Achievement", {
			align: "center",
			valign: "center",
		});

	doc.moveDown(3);
	doc.fillColor(dark).fontSize(14).font("Helvetica-Bold");
	doc.text("This is to certify that", { align: "center" });
	doc.moveDown(0.5);
	doc
		.font("Helvetica-Bold")
		.fontSize(30)
		.fillColor(dark)
		.text(cert.student_name || "Student", { align: "center" });
	doc.moveDown(0.6);
	doc
		.font("Helvetica-Bold")
		.fontSize(16)
		.fillColor(dark)
		.text("has successfully completed", { align: "center" });
	doc.moveDown(0.5);
	doc
		.font("Helvetica-Bold")
		.fontSize(20)
		.fillColor(dark)
		.text(cert.test_title || "Test", { align: "center" });

	doc.moveDown(1.5);
	const score =
		typeof cert.score !== "undefined" ? cert.score : (cert.score_raw ?? 0);
	const total =
		typeof cert.total_points !== "undefined"
			? cert.total_points
			: (cert.total_points_raw ?? 0);
	doc
		.fontSize(14)
		.font("Helvetica-Bold")
		.fillColor(dark)
		.text(`Score: ${score}/${total}`, { align: "center" });
	doc.moveDown(0.5);
	doc
		.fontSize(14)
		.font("Helvetica-Bold")
		.fillColor(dark)
		.text(
			`Issued: ${new Date(cert.issued_at || Date.now()).toLocaleDateString()}`,
			{ align: "center" },
		);
	doc.moveDown(2);
	doc
		.fontSize(12)
		.font("Helvetica-Bold")
		.fillColor(dark)
		.text(`Certificate Code: ${cert.certificate_code}`, { align: "center" });

	// Signature area
	const sigY = doc.y + 60;
	doc.moveDown(4);
	const lineX = doc.page.width / 2 + 40;
	doc
		.moveTo(lineX - 180, sigY)
		.lineTo(lineX, sigY)
		.strokeColor(dark)
		.lineWidth(2)
		.stroke();
	doc
		.fontSize(12)
		.font("Helvetica-Bold")
		.fillColor(dark)
		.text("Signature", lineX - 180, sigY + 6, { width: 180, align: "center" });

	doc.end();

	await new Promise((resolve, reject) => {
		writeStream.on("finish", resolve);
		writeStream.on("error", reject);
	});

	const baseUrl = `${req.protocol}://${req.get("host")}`;
	const pdfUrl = `${baseUrl.replace(/\/$/, "")}/uploads/temp/${encodeURIComponent(filename)}`;

	// Schedule deletion
	try {
		setTimeout(() => {
			fs.unlink(filepath, (err) => {
				if (err) {
					console.warn(
						"Failed to delete temp PDF:",
						filepath,
						err.message || err,
					);
					return;
				}
				console.log("Deleted temp PDF:", filepath);
			});
		}, ttlMs);
	} catch (sErr) {
		console.error("Failed to schedule temp PDF deletion", sErr);
	}

	return { filepath, pdfUrl };
}

/**
 * Draw a radial gradient circle (simulated with concentric circles)
 * Creates a soft gradient effect from center outward
 */
function drawRadialGradientCircle(
	doc,
	centerX,
	centerY,
	radius,
	colorInner,
	colorOuter,
	opacity,
) {
	const steps = 15;
	for (let i = steps; i > 0; i--) {
		const ratio = i / steps;
		const r = radius * ratio;
		const color = blendColors(colorInner, colorOuter, 1 - ratio);
		doc
			.circle(centerX, centerY, r)
			.fillAndStroke(color, "#ffffff00")
			.fillOpacity(opacity)
			.fill();
	}
}

/**
 * Blend two hex colors together
 * @param {string} color1 - Hex color (e.g., "#ff0000")
 * @param {string} color2 - Hex color (e.g., "#00ff00")
 * @param {number} ratio - Blend ratio (0 = color1, 1 = color2)
 */
function blendColors(color1, color2, ratio) {
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);

	const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
	const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
	const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);

	return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
	return (
		"#" +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? "0" + hex : hex;
			})
			.join("")
	);
}

/**
 * Generate certificate for a completed attempt
 * POST /certificates/generate
 */
exports.generateCertificate = async (req, res) => {
	try {
		const { attempt_id } = req.body;
		const userId = req.user.id;

		if (!attempt_id) {
			return res.status(400).json({ error: "attempt_id is required" });
		}

		// Verify the attempt belongs to the user
		const attemptResult = await db.query(
			"SELECT student_id FROM test_attempts WHERE id = $1",
			[attempt_id],
		);

		if (attemptResult.rows.length === 0) {
			return res.status(404).json({ error: "Attempt not found" });
		}

		if (attemptResult.rows[0].student_id !== userId) {
			return res.status(403).json({
				error: "You can only generate certificates for your own attempts",
			});
		}

		const result = await certificateService.generateCertificate(
			attempt_id,
			req.body.test_id,
			userId,
			req.body.certificate_type || "both",
		);

		res.json({
			message: "Certificate generated successfully",
			certificate: result.certificate,
			verification_url: result.verificationUrl,
		});
	} catch (error) {
		console.error("Generate certificate error:", error);
		res
			.status(500)
			.json({ error: error.message || "Failed to generate certificate" });
	}
};

/**
 * Get student's certificates
 * GET /certificates/my-certificates
 */
exports.getMyCertificates = async (req, res) => {
	try {
		const userId = req.user.id;

		const result = await db.query(
			`SELECT c.*, 
				t.title as test_title, t.description as test_description,
				ta.score, ta.total_points, ta.submitted_at
			 FROM certificates c
			 JOIN tests t ON c.test_id = t.id
			 JOIN test_attempts ta ON c.attempt_id = ta.id
			 WHERE c.student_id = $1 AND c.is_active = true
			 ORDER BY c.issued_at DESC`,
			[userId],
		);

		const baseUrl = `${req.protocol}://${req.get("host")}`;

		const certificates = result.rows.map((cert) => {
			const percentage =
				cert.total_points > 0
					? Math.round((parseFloat(cert.score) / cert.total_points) * 100)
					: 0;
			// Ensure pdf_url and badge_url are absolute
			const makeAbsolute = (url) => {
				if (!url) return null;
				if (/^https?:\/\//i.test(url)) return url;
				// If url already starts with /, prefix host
				if (url.startsWith("/")) return `${baseUrl.replace(/\/$/, "")}${url}`;
				// Otherwise assume relative and prefix
				return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
			};

			return {
				id: cert.id,
				test_id: cert.test_id,
				test_title: cert.test_title,
				test_description: cert.test_description,
				certificate_code: cert.certificate_code,
				certificate_type: cert.certificate_type,
				pdf_url: makeAbsolute(cert.pdf_url),
				badge_url: makeAbsolute(cert.badge_url),
				issued_at: cert.issued_at,
				score: parseFloat(cert.score),
				total_points: cert.total_points,
				percentage: percentage,
			};
		});

		res.json({ certificates });
	} catch (error) {
		console.error("Get my certificates error:", error);
		res.status(500).json({ error: "Failed to fetch certificates" });
	}
};

/**
 * Get certificate by ID
 * GET /certificates/:id
 */
exports.getCertificateById = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const result = await db.query(
			`SELECT c.*, 
				t.title as test_title, t.description as test_description,
				u.name as student_name, u.email as student_email,
				ta.score, ta.total_points, ta.submitted_at
			 FROM certificates c
			 JOIN tests t ON c.test_id = t.id
			 JOIN users u ON c.student_id = u.id
			 JOIN test_attempts ta ON c.attempt_id = ta.id
			 WHERE c.id = $1 AND c.is_active = true`,
			[id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		const cert = result.rows[0];

		// Check if user owns this certificate or is admin/teacher
		if (
			cert.student_id !== userId &&
			req.user.role !== "admin" &&
			req.user.role !== "teacher"
		) {
			return res.status(403).json({ error: "Access denied" });
		}

		const percentage =
			cert.total_points > 0
				? Math.round((parseFloat(cert.score) / cert.total_points) * 100)
				: 0;

		const baseUrl = `${req.protocol}://${req.get("host")}`;

		const verificationUrl = `${baseUrl.replace(/\/$/, "")}/verify-certificate?code=${cert.certificate_code}`;

		// Ensure local PDF file exists; if missing, regenerate and update DB so frontend gets a valid URL
		try {
			const uploadsFile = path.join(
				__dirname,
				"..",
				"..",
				"uploads",
				"certificates",
				`${cert.certificate_code}.pdf`,
			);

			if (!fs.existsSync(uploadsFile)) {
				// regenerate using helper
				const filename = `${cert.certificate_code}.pdf`;
				const { filepath, pdfUrl } = await createPdfForCertificate(
					cert,
					filename,
					req,
				);
				await db.query("UPDATE certificates SET pdf_url = $1 WHERE id = $2", [
					pdfUrl,
					cert.id,
				]);
				cert.pdf_url = pdfUrl;
				console.log("Regenerated missing certificate PDF:", uploadsFile);
			}
		} catch (regenErr) {
			console.error(
				"Failed to ensure PDF exists for certificate id:",
				cert.id,
				regenErr,
			);
		}

		// Build absolute urls for response
		const makeAbsolute = (url) => {
			if (!url) return null;
			if (/^https?:\/\//i.test(url)) return url;
			if (url.startsWith("/")) return `${baseUrl.replace(/\/$/, "")}${url}`;
			return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
		};

		res.json({
			certificate: {
				id: cert.id,
				test_id: cert.test_id,
				test_title: cert.test_title,
				test_description: cert.test_description,
				student_name: cert.student_name,
				student_email: cert.student_email,
				certificate_code: cert.certificate_code,
				certificate_type: cert.certificate_type,
				pdf_url: makeAbsolute(cert.pdf_url),
				badge_url: makeAbsolute(cert.badge_url),
				issued_at: cert.issued_at,
				verified_at: cert.verified_at,
				score: parseFloat(cert.score),
				total_points: cert.total_points,
				percentage: percentage,
				verification_url: verificationUrl,
			},
		});
	} catch (error) {
		console.error("Get certificate by ID error:", error);
		res.status(500).json({ error: "Failed to fetch certificate" });
	}
};

/**
 * Verify certificate by code (public endpoint)
 * GET /certificates/verify/:code
 */
exports.verifyCertificate = async (req, res) => {
	try {
		const { code } = req.params;

		if (!code) {
			return res.status(400).json({ error: "Certificate code is required" });
		}

		const result = await certificateService.verifyCertificate(code);

		if (!result.valid) {
			return res.status(404).json({
				valid: false,
				error: result.reason || "Invalid certificate code",
			});
		}

		res.json(result);
	} catch (error) {
		console.error("Verify certificate error:", error);
		res.status(500).json({ error: "Failed to verify certificate" });
	}
};

/**
 * Public download by certificate code (used for placeholder pdf URL paths)
 * GET /certificates/:code/pdf
 */
exports.downloadByCode = async (req, res) => {
	try {
		const { code } = req.params;

		if (!code) {
			return res.status(400).json({ error: "Certificate code is required" });
		}

		const result = await db.query(
			`SELECT pdf_url, badge_url, certificate_code, is_active FROM certificates WHERE certificate_code = $1 AND is_active = true`,
			[code],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		const cert = result.rows[0];

		// If pdf_url exists but points to an API placeholder (e.g. /api/certificates/.../pdf),
		// treat as not available and generate the real PDF file to avoid redirect loops.
		const isApiPlaceholder =
			cert.pdf_url && /\/api\/certificates\//.test(cert.pdf_url);
		if (cert.pdf_url && !isApiPlaceholder) {
			// Always redirect to absolute PDF URL so browsers download the real file
			const baseUrl = `${req.protocol}://${req.get("host")}`;
			let pdfUrl = cert.pdf_url;
			if (!/^https?:\/\//i.test(pdfUrl)) {
				if (pdfUrl.startsWith("/")) {
					pdfUrl = `${baseUrl.replace(/\/$/, "")}${pdfUrl}`;
				} else {
					pdfUrl = `${baseUrl.replace(/\/$/, "")}/${pdfUrl.replace(/^\//, "")}`;
				}
			}
			return res.redirect(pdfUrl);
		}

		// If pdf_url not set, generate PDF on-demand and redirect to the generated file
		try {
			const fullRes = await db.query(
				`SELECT c.*, t.title as test_title, u.name as student_name, u.email as student_email, ta.score, ta.total_points, ta.submitted_at
				 FROM certificates c
				 JOIN tests t ON c.test_id = t.id
				 JOIN users u ON c.student_id = u.id
				 JOIN test_attempts ta ON c.attempt_id = ta.id
				 WHERE c.certificate_code = $1 AND c.is_active = true`,
				[code],
			);
			if (fullRes.rows.length === 0) {
				return res.status(404).json({ error: "Certificate not found" });
			}
			const fullCert = fullRes.rows[0];
			const filename = `${fullCert.certificate_code}-${Date.now()}.pdf`;
			const { filepath, pdfUrl } = await createTempPdfForCertificate(
				fullCert,
				filename,
				req,
			);

			// Do NOT persist temp pdf URL to DB; return/redirect to temp URL which will auto-delete
			return res.redirect(pdfUrl);
		} catch (genErr) {
			console.error("Failed to generate PDF for code:", code, genErr);
			return res
				.status(500)
				.json({ error: "Failed to generate certificate PDF" });
		}
	} catch (error) {
		console.error("Download by code error:", error);
		res.status(500).json({ error: "Failed to fetch certificate PDF" });
	}
};

/**
 * Download PDF certificate
 * GET /certificates/:id/download
 */
exports.downloadCertificate = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const result = await db.query(
			`SELECT c.*, 
				t.title as test_title,
				u.name as student_name,
				ta.score, ta.total_points
			 FROM certificates c
			 JOIN tests t ON c.test_id = t.id
			 JOIN users u ON c.student_id = u.id
			 JOIN test_attempts ta ON c.attempt_id = ta.id
			 WHERE c.id = $1 AND c.is_active = true`,
			[id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		const cert = result.rows[0];

		// Check if user owns this certificate
		if (
			cert.student_id !== userId &&
			req.user.role !== "admin" &&
			req.user.role !== "teacher"
		) {
			return res.status(403).json({ error: "Access denied" });
		}

		// If PDF URL already set, return it
		if (cert.pdf_url && cert.pdf_url.length > 0) {
			return res.json({ pdf_url: cert.pdf_url });
		}

		// Otherwise generate a temporary PDF on-demand and return its URL (auto-deletes)
		try {
			const filename = `${cert.certificate_code}-${Date.now()}.pdf`;
			const { filepath, pdfUrl } = await createTempPdfForCertificate(
				cert,
				filename,
				req,
			);

			// Do not persist temp PDF URL to DB; caller receives a short-lived link
			return res.json({ pdf_url: pdfUrl });
		} catch (genErr) {
			console.error("Failed to generate temp PDF:", genErr);
			return res
				.status(500)
				.json({ error: "Failed to generate certificate PDF" });
		}
	} catch (error) {
		console.error("Download certificate error:", error);
		res.status(500).json({ error: "Failed to download certificate" });
	}
};

/**
 * Email certificate PDF to student
 * POST /certificates/:id/email
 */
exports.emailCertificate = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const result = await db.query(
			`SELECT c.*, t.title as test_title, u.name as student_name, u.email as student_email, ta.score, ta.total_points
			 FROM certificates c
			 JOIN tests t ON c.test_id = t.id
			 JOIN users u ON c.student_id = u.id
			 JOIN test_attempts ta ON c.attempt_id = ta.id
			 WHERE c.id = $1 AND c.is_active = true`,
			[id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		const cert = result.rows[0];

		// Only owner or admin/teacher can email
		if (
			cert.student_id !== userId &&
			req.user.role !== "admin" &&
			req.user.role !== "teacher"
		) {
			return res.status(403).json({ error: "Access denied" });
		}

		// Ensure PDF exists by invoking generation helper if needed
		if (!cert.pdf_url) {
			try {
				const filename = `${cert.certificate_code}.pdf`;
				const { filepath, pdfUrl } = await createPdfForCertificate(
					cert,
					filename,
					req,
				);
				await db.query("UPDATE certificates SET pdf_url = $1 WHERE id = $2", [
					pdfUrl,
					cert.id,
				]);
				cert.pdf_url = pdfUrl;
			} catch (genErr) {
				console.error("Email certificate: failed to generate PDF", genErr);
				return res.status(500).json({
					error: "Failed to generate certificate PDF before emailing",
				});
			}
		}

		// Send email with attachment
		const smtpHost = process.env.SMTP_HOST;
		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;

		if (!smtpHost || !smtpUser || !smtpPass) {
			return res
				.status(501)
				.json({ error: "SMTP not configured. Cannot send email." });
		}

		const transporter = nodemailer.createTransport({
			host: smtpHost,
			port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
			secure: process.env.SMTP_SECURE === "true",
			auth: {
				user: smtpUser,
				pass: smtpPass,
			},
		});

		const uploadsDir = path.join(
			__dirname,
			"..",
			"..",
			"uploads",
			"certificates",
		);
		await fs.promises.mkdir(uploadsDir, { recursive: true });

		const filename = `${cert.certificate_code}.pdf`;
		const attachmentPath = path.join(uploadsDir, filename);

		// If the file is missing, regenerate it here using helper
		if (!fs.existsSync(attachmentPath)) {
			console.log(
				"Email certificate: PDF missing on disk, generating",
				attachmentPath,
			);
			try {
				const filename = `${cert.certificate_code}.pdf`;
				await createPdfForCertificate(cert, filename, req);
				// Ensure DB points to this server's uploads path
				const baseUrl = `${req.protocol}://${req.get("host")}`;
				const pdfUrl = `${baseUrl.replace(/\/$/, "")}/uploads/certificates/${encodeURIComponent(filename)}`;
				await db.query("UPDATE certificates SET pdf_url = $1 WHERE id = $2", [
					pdfUrl,
					cert.id,
				]);
				cert.pdf_url = pdfUrl;
				console.log(
					"Email certificate: generated PDF and updated DB",
					attachmentPath,
				);
			} catch (genErr) {
				console.error("Email certificate: failed to generate PDF", genErr);
				return res.status(500).json({
					error: "Failed to generate certificate PDF before emailing",
				});
			}
		}

		const mailOptions = {
			from: process.env.EMAIL_FROM || smtpUser,
			to: req.body.to || cert.student_email,
			subject: `Your Certificate for ${cert.test_title}`,
			text: `Congratulations! Please find your certificate attached. Verification code: ${cert.certificate_code}`,
			attachments: [
				{
					filename: `${cert.certificate_code}.pdf`,
					path: attachmentPath,
				},
			],
		};

		await transporter.sendMail(mailOptions);

		res.json({ message: "Certificate emailed successfully" });
	} catch (error) {
		console.error("Email certificate error:", error);
		res.status(500).json({ error: "Failed to email certificate" });
	}
};

/**
 * Auto-issue certificates for passed attempts (admin/teacher only)
 * POST /certificates/auto-issue
 */
exports.autoIssueCertificates = async (req, res) => {
	try {
		// Only admin and teachers can trigger auto-issuance
		if (req.user.role !== "admin" && req.user.role !== "teacher") {
			return res.status(403).json({ error: "Access denied" });
		}

		const { test_id } = req.body;

		// Get all submitted attempts for the test (or all tests if test_id not provided)
		let query = `
			SELECT ta.id, ta.test_id, ta.student_id, ta.score, ta.total_points, ta.status
			FROM test_attempts ta
			WHERE ta.status = 'submitted'
		`;
		const params = [];

		if (test_id) {
			query += " AND ta.test_id = $1";
			params.push(test_id);
		}

		const attemptsResult = await db.query(query, params);

		const results = [];
		for (const attempt of attemptsResult.rows) {
			const result = await certificateService.autoIssueCertificate(attempt.id);
			results.push({
				attempt_id: attempt.id,
				test_id: attempt.test_id,
				student_id: attempt.student_id,
				...result,
			});
		}

		res.json({
			message: "Auto-issuance completed",
			processed: attemptsResult.rows.length,
			results,
		});
	} catch (error) {
		console.error("Auto-issue certificates error:", error);
		res.status(500).json({ error: "Failed to auto-issue certificates" });
	}
};

// Export helper functions so other modules (like server.js) can regenerate PDFs on demand
exports.createTempPdfForCertificate = createTempPdfForCertificate;
exports.createPdfForCertificate = createPdfForCertificate;
