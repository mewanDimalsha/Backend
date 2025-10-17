const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const authorizedRoles = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/user', verifyToken, authorizedRoles('user'), (req, res) => {
    res.send('User route is working');
});

router.get('/admin', verifyToken, authorizedRoles('admin'), (req, res) => {
    res.send('Admin route is working');
});

module.exports = router;
