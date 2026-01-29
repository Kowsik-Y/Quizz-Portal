const express = require("express");
const router = express.Router();
const materialProgressController = require("../controllers/materialProgressController");
const { auth } = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Mark material as viewed
router.post("/progress", materialProgressController.markViewed);

// Get student's material progress
router.get("/progress", materialProgressController.getProgress);

// Update material progress
router.put("/progress/:id", materialProgressController.updateProgress);

module.exports = router;
