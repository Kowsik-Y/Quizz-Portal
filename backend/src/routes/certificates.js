const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { auth } = require("../middleware/auth");

// Public route - certificate verification
router.get("/verify/:code", certificateController.verifyCertificate);

// Public route - download by certificate code (pdf/badge)
router.get("/:code/pdf", certificateController.downloadByCode);

// Protected routes - require authentication
router.use(auth);

// Generate certificate for an attempt
router.post("/generate", certificateController.generateCertificate);

// Get student's certificates
router.get("/my-certificates", certificateController.getMyCertificates);

// Get certificate by ID
router.get("/:id", certificateController.getCertificateById);

// Email certificate: POST /certificates/:id/email
router.post("/:id/email", certificateController.emailCertificate);

// Download PDF certificate
router.get("/:id/download", certificateController.downloadCertificate);

// Auto-issue certificates (admin/teacher only)
router.post("/auto-issue", certificateController.autoIssueCertificates);

module.exports = router;
