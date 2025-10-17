const mongoose = require('mongoose');

// Mock the models
const mockLeave = {
    _id: '507f1f77bcf86cd799439012',
    employee: '507f1f77bcf86cd799439011',
    fromDate: new Date('2024-12-20'),
    toDate: new Date('2024-12-22'),
    reason: 'Vacation',
    status: 'Pending',
    save: jest.fn().mockResolvedValue(this),
    populate: jest.fn().mockResolvedValue(this)
};

const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'testuser',
    role: 'user'
};

const mockLeaveModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn()
};

const mockUserModel = {
    findById: jest.fn()
};

// Mock the models
jest.mock('../../src/models/leaveModel', () => ({
    Leave: mockLeaveModel
}));

jest.mock('../../src/models/userModel', () => mockUserModel);

const { createLeave, getAllLeaves, getLeaveById, updateLeave, deleteLeave } = require('../../src/controllers/leaveController');

describe('Leave Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: { id: '507f1f77bcf86cd799439011', role: 'user' },
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createLeave', () => {
        it('should create a new leave request successfully', async () => {
            // Set future dates
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const futureDate2 = new Date();
            futureDate2.setDate(futureDate2.getDate() + 32);

            req.body = {
                fromDate: futureDate.toISOString().split('T')[0],
                toDate: futureDate2.toISOString().split('T')[0],
                reason: 'Vacation time'
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockLeaveModel.findOne.mockResolvedValue(null);
            mockLeaveModel.create.mockResolvedValue(mockLeave);

            await createLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leave request submitted successfully',
                leave: mockLeave
            });
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = {
                fromDate: '2024-12-20'
                // Missing toDate and reason
            };

            await createLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'All fields are required: fromDate, toDate, reason'
            });
        });

        it('should return 400 if fromDate is in the past', async () => {
            req.body = {
                fromDate: '2020-01-01',
                toDate: '2024-12-22',
                reason: 'Vacation time'
            };

            await createLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'From date must be today or in the future'
            });
        });

        it('should return 400 if toDate is before fromDate', async () => {
            // Set future dates where toDate is before fromDate
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() + 25);

            req.body = {
                fromDate: futureDate.toISOString().split('T')[0],
                toDate: pastDate.toISOString().split('T')[0],
                reason: 'Vacation time'
            };

            await createLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'To date must be after from date'
            });
        });

        it('should return 400 if user already has overlapping leave', async () => {
            // Set future dates
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const futureDate2 = new Date();
            futureDate2.setDate(futureDate2.getDate() + 32);

            req.body = {
                fromDate: futureDate.toISOString().split('T')[0],
                toDate: futureDate2.toISOString().split('T')[0],
                reason: 'Vacation time'
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockLeaveModel.findOne.mockResolvedValue(mockLeave); // Overlapping leave found

            await createLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'You already have a leave request for this period'
            });
        });
    });

    describe('getAllLeaves', () => {
        it('should return all leaves for the authenticated user', async () => {
            mockLeaveModel.find.mockResolvedValue([mockLeave]);

            await getAllLeaves(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leaves retrieved successfully',
                leaves: [mockLeave],
                count: 1
            });
        });

        it('should return leaves filtered by employee for admin', async () => {
            req.user.role = 'admin';
            req.query = { employee: '507f1f77bcf86cd799439011' };

            mockLeaveModel.find.mockResolvedValue([mockLeave]);

            await getAllLeaves(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockLeaveModel.find).toHaveBeenCalledWith({
                employee: '507f1f77bcf86cd799439011'
            });
        });
    });

    describe('getLeaveById', () => {
        it('should return a specific leave by ID', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            mockLeaveModel.findById.mockResolvedValue(mockLeave);

            await getLeaveById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leave retrieved successfully',
                leave: mockLeave
            });
        });

        it('should return 404 if leave not found', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            mockLeaveModel.findById.mockResolvedValue(null);

            await getLeaveById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leave request not found'
            });
        });

        it('should return 403 if user tries to access another user\'s leave', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            const anotherUserLeave = {
                ...mockLeave,
                employee: { _id: '507f1f77bcf86cd799439999' }
            };
            mockLeaveModel.findById.mockResolvedValue(anotherUserLeave);

            await getLeaveById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied. You can only view your own leave requests.'
            });
        });
    });

    describe('updateLeave', () => {
        it('should update leave details for the owner', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            req.body = {
                reason: 'Updated reason'
            };

            mockLeaveModel.findById.mockResolvedValue(mockLeave);
            mockLeaveModel.findById.mockResolvedValueOnce(mockLeave).mockResolvedValueOnce(mockLeave);

            await updateLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leave updated successfully',
                leave: mockLeave
            });
        });

        it('should allow admin to approve/reject leaves', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            req.user.role = 'admin';
            req.body = {
                status: 'Approved',
                reviewComments: 'Approved by admin'
            };

            mockLeaveModel.findById.mockResolvedValue(mockLeave);

            await updateLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockLeave.save).toHaveBeenCalled();
        });

        it('should return 400 if trying to edit non-pending leave', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            req.body = {
                reason: 'Trying to edit approved leave'
            };

            const approvedLeave = { ...mockLeave, status: 'Approved' };
            mockLeaveModel.findById.mockResolvedValue(approvedLeave);

            await updateLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'You can only edit pending leave requests'
            });
        });
    });

    describe('deleteLeave', () => {
        it('should delete leave for the owner', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            mockLeaveModel.findById.mockResolvedValue(mockLeave);
            mockLeaveModel.findByIdAndDelete.mockResolvedValue(mockLeave);

            await deleteLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Leave request deleted successfully'
            });
        });

        it('should allow admin to delete any leave', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            req.user.role = 'admin';
            mockLeaveModel.findById.mockResolvedValue(mockLeave);
            mockLeaveModel.findByIdAndDelete.mockResolvedValue(mockLeave);

            await deleteLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockLeaveModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
        });

        it('should return 400 if trying to delete non-pending leave', async () => {
            req.params.id = '507f1f77bcf86cd799439012';
            const approvedLeave = { ...mockLeave, status: 'Approved' };
            mockLeaveModel.findById.mockResolvedValue(approvedLeave);

            await deleteLeave(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'You can only delete pending leave requests'
            });
        });
    });
});
