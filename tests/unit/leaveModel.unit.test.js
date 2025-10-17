const { z } = require('zod');

// Mock mongoose
const mockMongoose = {
    Schema: jest.fn().mockImplementation(() => ({
        pre: jest.fn(),
        statics: {}
    })),
    model: jest.fn(),
    Schema: {
        Types: {
            ObjectId: jest.fn()
        }
    }
};

jest.mock('mongoose', () => mockMongoose);

const { leaveValidationSchema } = require('../../src/models/leaveModel');

describe('Leave Model Unit Tests', () => {
    describe('Zod Validation Schema', () => {
        it('should validate valid leave data', () => {
            const validData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time',
                status: 'Pending',
                appliedAt: new Date()
            };

            expect(() => leaveValidationSchema.parse(validData)).not.toThrow();
        });

        it('should throw error for missing employee', () => {
            const invalidData = {
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for missing fromDate', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for missing toDate', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                reason: 'Vacation time'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for missing reason', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22')
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for past fromDate', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2020-01-01'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error when toDate is before fromDate', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-22'),
                toDate: new Date('2024-12-20'),
                reason: 'Vacation time'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for empty reason', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: ''
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should throw error for reason too long', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'a'.repeat(501) // More than 500 characters
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should accept valid status values', () => {
            const validStatuses = ['Pending', 'Approved', 'Rejected'];
            
            validStatuses.forEach(status => {
                const validData = {
                    employee: '507f1f77bcf86cd799439011',
                    fromDate: new Date('2024-12-20'),
                    toDate: new Date('2024-12-22'),
                    reason: 'Vacation time',
                    status
                };

                expect(() => leaveValidationSchema.parse(validData)).not.toThrow();
            });
        });

        it('should throw error for invalid status', () => {
            const invalidData = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time',
                status: 'InvalidStatus'
            };

            expect(() => leaveValidationSchema.parse(invalidData)).toThrow();
        });

        it('should default status to Pending', () => {
            const dataWithoutStatus = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time'
            };

            const result = leaveValidationSchema.parse(dataWithoutStatus);
            expect(result.status).toBe('Pending');
        });

        it('should default appliedAt to current date', () => {
            const dataWithoutAppliedAt = {
                employee: '507f1f77bcf86cd799439011',
                fromDate: new Date('2024-12-20'),
                toDate: new Date('2024-12-22'),
                reason: 'Vacation time'
            };

            const result = leaveValidationSchema.parse(dataWithoutAppliedAt);
            expect(result.appliedAt).toBeInstanceOf(Date);
        });
    });

    describe('Schema Definition', () => {
        it('should create mongoose schema with correct structure', () => {
            expect(mockMongoose.Schema).toHaveBeenCalled();
            
            // Check if the schema was called with the right structure
            const schemaCall = mockMongoose.Schema.mock.calls[0];
            const schemaDefinition = schemaCall[0];
            
            expect(schemaDefinition).toHaveProperty('employee');
            expect(schemaDefinition).toHaveProperty('fromDate');
            expect(schemaDefinition).toHaveProperty('toDate');
            expect(schemaDefinition).toHaveProperty('reason');
            expect(schemaDefinition).toHaveProperty('status');
            expect(schemaDefinition).toHaveProperty('appliedAt');
        });

        it('should set up schema options correctly', () => {
            const schemaCall = mockMongoose.Schema.mock.calls[0];
            const schemaOptions = schemaCall[1];
            
            expect(schemaOptions).toHaveProperty('timestamps', true);
            expect(schemaOptions).toHaveProperty('versionKey', false);
        });

        it('should create model with correct name', () => {
            expect(mockMongoose.model).toHaveBeenCalledWith('Leave', expect.any(Object), 'leaves');
        });
    });
});
