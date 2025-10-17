const authorizedRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated (should be set by authMiddleware)
            if (!req.user) {
                return res.status(401).json({ 
                    message: 'Access denied. User not authenticated.' 
                });
            }

            // Check if user has required role
            const userRole = req.user.role;
            
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ 
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
                });
            }

            next();
        } catch (error) {
            console.error('Role authorization error:', error);
            res.status(500).json({ 
                message: 'Server error during role authorization.' 
            });
        }
    };
};

module.exports = authorizedRoles;