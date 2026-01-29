const db = require("../config/database");

/**
 * Mark material as viewed
 * POST /materials/progress
 */
exports.markViewed = async (req, res) => {
	try {
		const { material_id, material_type } = req.body;
		const userId = req.user.id;

		if (!material_id || !material_type) {
			return res
				.status(400)
				.json({ error: "material_id and material_type are required" });
		}

		if (!["test", "course"].includes(material_type)) {
			return res
				.status(400)
				.json({ error: 'material_type must be "test" or "course"' });
		}

		// Check if progress record exists
		const existingResult = await db.query(
			`SELECT id FROM material_progress 
			 WHERE student_id = $1 AND material_id = $2 AND material_type = $3`,
			[userId, material_id, material_type],
		);

		let result;
		if (existingResult.rows.length > 0) {
			// Update existing record
			result = await db.query(
				`UPDATE material_progress 
				 SET viewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
				 WHERE id = $1
				 RETURNING *`,
				[existingResult.rows[0].id],
			);
		} else {
			// Create new record
			result = await db.query(
				`INSERT INTO material_progress 
				 (student_id, material_id, material_type, viewed_at)
				 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
				 RETURNING *`,
				[userId, material_id, material_type],
			);
		}

		res.json({
			message: "Material marked as viewed",
			progress: result.rows[0],
		});
	} catch (error) {
		console.error("Mark viewed error:", error);
		res.status(500).json({ error: "Failed to mark material as viewed" });
	}
};

/**
 * Get student's material progress
 * GET /materials/progress
 */
exports.getProgress = async (req, res) => {
	try {
		const userId = req.user.id;
		const { material_type, material_id } = req.query;

		let query = "SELECT * FROM material_progress WHERE student_id = $1";
		const params = [userId];

		if (material_type) {
			query += " AND material_type = $2";
			params.push(material_type);
		}

		if (material_id) {
			const paramIndex = params.length + 1;
			query += ` AND material_id = $${paramIndex}`;
			params.push(material_id);
		}

		query += " ORDER BY viewed_at DESC";

		const result = await db.query(query, params);

		res.json({ progress: result.rows });
	} catch (error) {
		console.error("Get progress error:", error);
		res.status(500).json({ error: "Failed to fetch material progress" });
	}
};

/**
 * Update material progress (completion percentage, position)
 * PUT /materials/progress/:id
 */
exports.updateProgress = async (req, res) => {
	try {
		const { id } = req.params;
		const { completion_percentage, last_position } = req.body;
		const userId = req.user.id;

		// Verify the progress record belongs to the user
		const existingResult = await db.query(
			"SELECT * FROM material_progress WHERE id = $1 AND student_id = $2",
			[id, userId],
		);

		if (existingResult.rows.length === 0) {
			return res.status(404).json({ error: "Progress record not found" });
		}

		const updateFields = [];
		const updateValues = [];
		let paramIndex = 1;

		if (completion_percentage !== undefined) {
			if (completion_percentage < 0 || completion_percentage > 100) {
				return res
					.status(400)
					.json({ error: "completion_percentage must be between 0 and 100" });
			}
			updateFields.push(`completion_percentage = $${paramIndex++}`);
			updateValues.push(completion_percentage);
		}

		if (last_position !== undefined) {
			updateFields.push(`last_position = $${paramIndex++}`);
			updateValues.push(last_position);
		}

		if (updateFields.length === 0) {
			return res.status(400).json({ error: "No fields to update" });
		}

		updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
		updateValues.push(id);

		const result = await db.query(
			`UPDATE material_progress 
			 SET ${updateFields.join(", ")}
			 WHERE id = $${paramIndex}
			 RETURNING *`,
			updateValues,
		);

		res.json({
			message: "Progress updated successfully",
			progress: result.rows[0],
		});
	} catch (error) {
		console.error("Update progress error:", error);
		res.status(500).json({ error: "Failed to update progress" });
	}
};
