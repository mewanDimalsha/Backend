const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/user', verifyToken, (req, res) => {
    res.send('User route is working');
});

router.get('/admin', verifyToken, (req, res) => {
    res.send('Admin route is working');
});

module.exports = router;
