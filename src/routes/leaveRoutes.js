const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const authorizedRoles = require('../middleware/roleMiddleware');
const {
    createLeave,
    getAllLeaves,
    getLeaveById,
    updateLeave,
    deleteLeave
} = require('../controllers/leaveController');

// All leave routes require authentication
router.use(verifyToken);

// POST /leaves - Create a leave request
router.post('/',verifyToken,authorizedRoles('user'), createLeave);

//router.get('/stats',verifyToken, authorizedRoles('admin'), getLeaveStats);

// GET /leaves - Get all leaves (admin view) or filtered by employee
router.get('/',verifyToken, authorizedRoles('admin', 'user'), getAllLeaves);

// GET /leaves/:id - Get single leave by ID
router.get('/:id',verifyToken,authorizedRoles('admin', 'user'), getLeaveById);

//router.get('/:name',verifyToken,authorizedRoles('admin', 'user'), getLeaveByName);

// PUT /leaves/:id - Update leave (edit dates/reason if pending; admin can approve/reject)
router.put('/:id',verifyToken,authorizedRoles('admin', 'user'), updateLeave);

// DELETE /leaves/:id - Delete/cancel leave (only allowed if pending; admin may delete)
router.delete('/:id',verifyToken, deleteLeave);

module.exports = router;

