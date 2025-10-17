const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authorization token missing or malformed' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            console.log('Decoded JWT:', decoded);
            next();
        } catch (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
    }

};

