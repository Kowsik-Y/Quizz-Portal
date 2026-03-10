const { Server } = require("socket.io");
const db = require("./config/database");

let io = null;

/**
 * Initialize Socket.IO and attach it to the existing HTTP server.
 */
function initWebSocket(server) {
	io = new Server(server, {
		cors: {
			origin: (origin, callback) => {
				// Mirror the same CORS policy as Express
				if (!origin) return callback(null, true);
				const isProduction = process.env.NODE_ENV === "production";
				const allowedOrigins = [
					"http://localhost:8081",
					"http://192.168.1.1:8081",
					"http://127.0.0.1:8081",
					"https://quizz-portal.vercel.app",
					process.env.FRONTEND_URL,
				].filter(Boolean);

				if (
					allowedOrigins.includes(origin) ||
					(!isProduction &&
						(origin.startsWith("http://localhost") ||
							origin.startsWith("http://192.168")))
				) {
					callback(null, true);
				} else {
					callback(new Error("Not allowed by CORS"));
				}
			},
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`🔌 WebSocket connected: ${socket.id}`);

		// Client joins a test-specific room to receive live updates
		socket.on("join-test", (testId) => {
			const room = `test:${testId}`;
			socket.join(room);
			console.log(`📥 Socket ${socket.id} joined room ${room}`);
		});

		// Client leaves a test room
		socket.on("leave-test", (testId) => {
			const room = `test:${testId}`;
			socket.leave(room);
			console.log(`📤 Socket ${socket.id} left room ${room}`);
		});

		socket.on("disconnect", () => {
			console.log(`❌ WebSocket disconnected: ${socket.id}`);
		});
	});

	console.log("⚡ Socket.IO initialized");
	return io;
}

/**
 * Get the current IO instance.
 */
function getIO() {
	return io;
}

/**
 * Broadcast the latest live attempt data to all clients watching a specific test.
 * This is called from controllers after attempt start/answer/submit.
 */
async function broadcastLiveUpdate(testId) {
	if (!io) return;

	try {
		const attemptsResult = await db.query(
			`
      SELECT 
        ta.id,
        ta.status,
        ta.score,
        ta.total_points,
        ta.platform,
        ta.browser,
        ta.started_at,
        ta.submitted_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.roll_number as enrollment_number,
        (
          SELECT COUNT(*) 
          FROM student_answers sa 
          WHERE sa.attempt_id = ta.id
        ) as answered_count,
        (
          SELECT COUNT(*) 
          FROM questions q 
          WHERE q.test_id = ta.test_id
        ) as total_questions
      FROM test_attempts ta
      JOIN users u ON ta.student_id = u.id
      WHERE ta.test_id = $1
      ORDER BY ta.started_at DESC
    `,
			[testId],
		);

		const data = {
			attempts: attemptsResult.rows,
			live_count: attemptsResult.rows.filter((a) => a.status === "in_progress")
				.length,
			completed_count: attemptsResult.rows.filter(
				(a) => a.status === "submitted",
			).length,
			total_count: attemptsResult.rows.length,
		};

		io.to(`test:${testId}`).emit("live-update", data);
	} catch (error) {
		console.error("WebSocket broadcast error:", error.message);
	}
}

module.exports = { initWebSocket, getIO, broadcastLiveUpdate };
