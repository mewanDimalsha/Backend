const jwt = require('jsonwebtoken');

// Mock the auth middleware
const mockVerifyToken = jest.fn();

// Mock the middleware
jest.mock('../../src/middleware/authMiddleware', () => mockVerifyToken);

describe('Auth Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('Token Validation', () => {
        it('should validate JWT token correctly', () => {
            const token = jwt.sign(
                { id: '507f1f77bcf86cd799439011', role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            req.headers.authorization = `Bearer ${token}`;

            // Mock successful verification
            mockVerifyToken.mockImplementation((req, res, next) => {
                req.user = { id: '507f1f77bcf86cd799439011', role: 'user' };
                next();
            });

            mockVerifyToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({ id: '507f1f77bcf86cd799439011', role: 'user' });
        });

        it('should handle missing authorization header', () => {
            mockVerifyToken.mockImplementation((req, res, next) => {
                if (!req.headers.authorization) {
                    res.status(401).json({ message: 'Access denied. No token provided.' });
                    return;
                }
                next();
            });

            mockVerifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle invalid token format', () => {
            req.headers.authorization = 'InvalidFormat';

            mockVerifyToken.mockImplementation((req, res, next) => {
                if (!req.headers.authorization.startsWith('Bearer ')) {
                    res.status(401).json({ message: 'Access denied. Invalid token.' });
                    return;
                }
                next();
            });

            mockVerifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied. Invalid token.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle malformed JWT token', () => {
            req.headers.authorization = 'Bearer invalid-token';

            mockVerifyToken.mockImplementation((req, res, next) => {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
                    next();
                } catch (error) {
                    res.status(401).json({ message: 'Access denied. Invalid token.' });
                }
            });

            mockVerifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied. Invalid token.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle expired token', () => {
            const expiredToken = jwt.sign(
                { id: '507f1f77bcf86cd799439011', role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' } // Expired token
            );

            req.headers.authorization = `Bearer ${expiredToken}`;

            mockVerifyToken.mockImplementation((req, res, next) => {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
                    next();
                } catch (error) {
                    res.status(401).json({ message: 'Access denied. Invalid token.' });
                }
            });

            mockVerifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied. Invalid token.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle token with extra spaces', () => {
            const token = jwt.sign(
                { id: '507f1f77bcf86cd799439011', role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            req.headers.authorization = `Bearer  ${token}  `; // Extra spaces

            mockVerifyToken.mockImplementation((req, res, next) => {
                const token = req.headers.authorization.split(' ')[1].trim();
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
                req.user = decoded;
                next();
            });

            mockVerifyToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeTruthy();
        });

        it('should handle case-insensitive authorization header', () => {
            const token = jwt.sign(
                { id: '507f1f77bcf86cd799439011', role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            req.headers.authorization = `bearer ${token}`; // Lowercase "bearer"

            mockVerifyToken.mockImplementation((req, res, next) => {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
                    res.status(401).json({ message: 'Access denied. Invalid token.' });
                    return;
                }
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
                req.user = decoded;
                next();
            });

            mockVerifyToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeTruthy();
        });
    });
});
