const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require admin authentication
router.use(auth);
router.use(checkRole('admin'));

// Routes
router.get('/', academicYearController.getAllAcademicYears);
router.get('/:id', academicYearController.getAcademicYear);
router.post('/', academicYearController.createAcademicYear);
router.put('/:id', academicYearController.updateAcademicYear);
router.delete('/:id', academicYearController.deleteAcademicYear);

module.exports = router;
