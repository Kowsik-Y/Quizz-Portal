const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require admin authentication
router.use(auth);
router.use(checkRole('admin'));

// Routes
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
