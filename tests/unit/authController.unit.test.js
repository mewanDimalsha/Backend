const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the User model
const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'testuser',
    password: 'hashedpassword',
    role: 'user',
    save: jest.fn().mockResolvedValue(this)
};

const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn()
};

// Mock the User model
jest.mock('../../src/models/userModel', () => mockUserModel);

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn()
}));

const { login, register } = require('../../src/controllers/authController');

describe('Auth Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            req.body = {
                name: 'newuser',
                password: 'password123',
                role: 'user'
            };

            mockUserModel.findOne.mockResolvedValue(null);
            mockUserModel.create.mockResolvedValue(mockUser);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User newuser registered successfully'
            });
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ name: 'newuser' });
            expect(mockUserModel.create).toHaveBeenCalled();
        });

        it('should return 400 if name is missing', async () => {
            req.body = {
                password: 'password123'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Name and password are required'
            });
        });

        it('should return 400 if password is missing', async () => {
            req.body = {
                name: 'newuser'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Name and password are required'
            });
        });

        it('should return 409 if user already exists', async () => {
            req.body = {
                name: 'existinguser',
                password: 'password123'
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User already exists'
            });
        });

        it('should handle server errors', async () => {
            req.body = {
                name: 'newuser',
                password: 'password123'
            };

            mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: 'Database error'
            });
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            req.body = {
                name: 'testuser',
                password: 'password123'
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(true);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login testuser successful',
                token: expect.any(String)
            });
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ name: 'testuser' });
        });

        it('should return 400 if name is missing', async () => {
            req.body = {
                password: 'password123'
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Name and password are required'
            });
        });

        it('should return 400 if password is missing', async () => {
            req.body = {
                name: 'testuser'
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Name and password are required'
            });
        });

        it('should return 404 if user not found', async () => {
            req.body = {
                name: 'nonexistent',
                password: 'password123'
            };

            mockUserModel.findOne.mockResolvedValue(null);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User nonexistent not found'
            });
        });

        it('should return 401 if password is incorrect', async () => {
            req.body = {
                name: 'testuser',
                password: 'wrongpassword'
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid password'
            });
        });

        it('should handle server errors', async () => {
            req.body = {
                name: 'testuser',
                password: 'password123'
            };

            mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Server error'
            });
        });
    });
});
