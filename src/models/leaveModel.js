const mongoose = require('mongoose');
const { z } = require('zod');

// Zod validation schema for leave
const leaveValidationSchema = z.object({
    employee: z.string().min(1, 'Employee ID is required'),
    fromDate: z.date({
        required_error: 'From date is required',
        invalid_type_error: 'From date must be a valid date'
    }).refine((date) => date >= new Date(), {
        message: 'From date must be in the future'
    }),
    toDate: z.date({
        required_error: 'To date is required',
        invalid_type_error: 'To date must be a valid date'
    }),
    reason: z.string()
        .min(1, 'Reason is required')
        .max(500, 'Reason must be less than 500 characters'),
    status: z.enum(['Pending', 'Approved', 'Rejected']).default('Pending'),
    appliedAt: z.date().default(() => new Date())
}).refine((data) => data.toDate >= data.fromDate, {
    message: 'To date must be after from date',
    path: ['toDate']
});

// Mongoose schema
const leaveSchema = new mongoose.Schema({
    employee: {
  type: String,  // Change from ObjectId to String
  required: true
},
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Validation middleware using Zod
leaveSchema.pre('save', function(next) {
    try {
        const leaveData = {
            employee: this.employee.toString(),
            fromDate: this.fromDate,
            toDate: this.toDate,
            reason: this.reason,
            status: this.status,
            appliedAt: this.appliedAt
        };
        
        leaveValidationSchema.parse(leaveData);
        next();
    } catch (error) {
        next(new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`));
    }
});

// Static method to validate leave data
leaveSchema.statics.validateLeave = function(data) {
    return leaveValidationSchema.parse(data);
};

const Leave = mongoose.model('Leave', leaveSchema, 'leaves');

module.exports = { Leave, leaveValidationSchema };
