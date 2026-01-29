const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();
require("express-async-errors");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const testRoutes = require("./routes/tests");
const questionRoutes = require("./routes/questions");
const attemptRoutes = require("./routes/attempts");
const codeRoutes = require("./routes/code");
const departmentRoutes = require("./routes/departmentRoutes");
const academicYearRoutes = require("./routes/academicYearRoutes");
const materialRoutes = require("./routes/materials");
const bookingRoutes = require("./routes/bookings");
const violationRoutes = require("./routes/violations");
const databaseRoutes = require("./routes/databaseRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const activityLogsRoutes = require("./routes/activityLogsRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotifications");
const certificateRoutes = require("./routes/certificates");
const materialProgressRoutes = require("./routes/materialProgress");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Winston logger configuration
const logger = winston.createLogger({
	level: isProduction ? "info" : "debug",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	defaultMeta: { service: "quiz-portal-backend" },
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: isProduction ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

// Middleware
app.use(
	helmet({
		contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in development
	}),
);
app.use(cookieParser()); // Parse cookies before CORS
app.use(compression()); // Enable gzip compression
app.use(limiter); // Apply rate limiting
app.use(
	cors({
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		exposedHeaders: ["Set-Cookie"],
	}),
);
app.use(morgan(isProduction ? "combined" : "dev")); // Use combined format in production
app.use(express.json({ limit: "10mb" })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "OK", message: "Quiz Portal API is running" });
});

// Public certificate verification page (simple HTML)
const certificateService = require("./services/certificateService");
const certificateController = require("./controllers/certificateController");
const db = require("./config/database");
const fs = require("fs");
app.get("/verify-certificate", async (req, res) => {
	const code = req.query.code;
	if (!code) return res.status(400).send("Certificate code is required");
	try {
		const result = await certificateService.verifyCertificate(code);
		if (!result.valid) {
			// app.use(
			//      cors({
			//              origin: (origin, callback) => {
			//                      // Allow requests with no origin (like mobile apps or Postman)
			//                      if (!origin) return callback(null, true);
			//
			//                      // List of allowed origins
			//                      const allowedOrigins = [
			//                              "http://localhost:8081",
			//                              "http://192.168.1.1:8081",
			//                              "http://127.0.0.1:8081",
			//                              process.env.FRONTEND_URL,
			//                      ].filter(Boolean);
			//                      if (
			//                              allowedOrigins.indexOf(origin) !== -1 ||
			//                              origin.startsWith("http://localhost") ||
			//                              origin.startsWith("http://192.168")
			//                      ) {
			//                              callback(null, true);
			//                      } else {
			//                              callback(null, true); // Allow all in development
			//                      }
			//              },
			//              credentials: true,
			//              methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			//              allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			//              exposedHeaders: ["Set-Cookie"],
			//      }),
			// );
app.use("/api/departments", departmentRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/admin/database", databaseRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/logs", activityLogsRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/materials", materialProgressRoutes);

// Serve uploaded assets (certificates, badges, etc.)
const uploadsPath = path.join(__dirname, "..", "uploads");
// If a PDF under /uploads/certificates is requested but missing, attempt to regenerate it
app.get("/uploads/certificates/:filename", async (req, res, next) => {
	try {
		const { filename } = req.params;
		const certsDir = path.join(uploadsPath, "certificates");
		const requestedPath = path.join(certsDir, filename);

		if (fs.existsSync(requestedPath)) {
			// File exists now (race), serve it via sendFile
			return res.sendFile(requestedPath);
		}

		// Determine certificate code. If filename ends with -<digits>.pdf it's a temp file,
		// so the certificate code is the portion before the last -<digits>.pdf. Otherwise
		// treat the whole basename (without .pdf) as the certificate code.
		let code = filename.replace(/\.pdf$/i, "");
		const m = filename.match(/^(.+)-\d+\.pdf$/);
		const isTempLike = !!m;
		if (m) {
			code = m[1];
		}

		// Verify certificate exists and is active
		const verify = await certificateService.verifyCertificate(code);
		if (!verify || !verify.valid) {
			return res.status(404).send("Certificate not found");
		}

		const cert = verify.certificate;

		if (!isTempLike && filename === `${code}.pdf`) {
			// Persistent file: regenerate and update DB
			const { filepath, pdfUrl } =
				await certificateController.createPdfForCertificate(
					cert,
					filename,
					req,
				);
			// Update DB to point to regenerated URL
			try {
				await db.query(
					"UPDATE certificates SET pdf_url = $1 WHERE certificate_code = $2",
					[pdfUrl, code],
				);
			} catch (dbErr) {
				console.warn(
					"Failed to update certificate pdf_url in DB",
					dbErr.message || dbErr,
				);
			}
			return res.redirect(pdfUrl);
		}

		// Temp-like filename: create a fresh temp PDF and redirect
		const tempFilename = `${code}-${Date.now()}.pdf`;
		const { filepath: tpath, pdfUrl: tempUrl } =
			await certificateController.createTempPdfForCertificate(
				cert,
				tempFilename,
				req,
			);
		return res.redirect(tempUrl);
	} catch (err) {
		console.error("Error regenerating certificate PDF:", err);
		return next(err);
	}
});
// Allow embedding uploaded PDFs in an iframe from the frontend during development
app.use(
	"/uploads",
	(req, res, next) => {
		// In development allow embedding uploaded PDFs in iframes from local frontends
		if (!isProduction) {
			// Very permissive for local development; tighten for production
			res.setHeader("Content-Security-Policy", "frame-ancestors *;");
			res.setHeader("X-Frame-Options", "ALLOWALL");
			// Allow cross-origin resource access for ease of testing
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
			res.setHeader(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			);
		}
		next();
	},
	express.static(uploadsPath),
);

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
	logger.error("Unhandled error", {
		error: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		ip: req.ip,
	});

	res.status(err.status || 500).json({
		error: err.message || "Internal server error",
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
});

// Start server
const server = app.listen(PORT, () => {
	logger.info(`Quiz Portal API Server started`, {
		port: PORT,
		environment: process.env.NODE_ENV || "development",
		nodeVersion: process.version,
	});

	console.log(`
╔═══════════════════════════════════════╗
║      Quiz Portal API Server           ║
║                                       ║
║   📡 Port: ${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV || "development"}         ║
║   💚 Status: Running                  ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	logger.info("SIGTERM received, shutting down gracefully");
	server.close(() => {
		logger.info("Process terminated");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	logger.info("SIGINT received, shutting down gracefully");
	server.close(() => {
		logger.info("Process terminated");
		process.exit(0);
	});
});

module.exports = app;

