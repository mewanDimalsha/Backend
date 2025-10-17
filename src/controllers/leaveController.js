const { Leave } = require('../models/leaveModel');
const User = require('../models/userModel');

// Create a new leave request
const createLeave = async (req, res) => {
    try {
        const { fromDate, toDate, reason } = req.body;
        const employeeId = req.user.id;

        // Get user details
        const user = await User.findById(employeeId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validation
        if (!fromDate || !toDate || !reason) {
            return res.status(400).json({
                message: 'All fields are required: fromDate, toDate, reason'
            });
        }

        // Validate dates
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({
                message: 'From date must be today or in the future'
            });
        }

        if (end < start) {
            return res.status(400).json({
                message: 'To date must be after from date'
            });
        }

        // Check for overlapping leaves for the same employee
        const overlappingLeave = await Leave.findOne({
            employee: employeeId,
            status: { $in: ['Pending', 'Approved'] },
            $or: [
                { fromDate: { $lte: end }, toDate: { $gte: start } }
            ]
        });

        if (overlappingLeave) {
            return res.status(400).json({
                message: 'You already have a leave request for this period'
            });
        }

        // Create new leave request
        const newLeave = new Leave({
            employee: employeeId,
            fromDate: start,
            toDate: end,
            reason,
            status: 'Pending'
        });

        await newLeave.save();

        // Populate the employee field for response
        await newLeave.populate('employee', 'name role');

        res.status(201).json({
            message: 'Leave request submitted successfully',
            leave: newLeave
        });

    } catch (error) {
        console.error('Error creating leave:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all leave requests (admin view) or filtered by employee
const getAllLeaves = async (req, res) => {
    try {
        const { employee } = req.query;
        const userRole = req.user.role;

        let query = {};

        // If user is not admin, they can only see their own leaves
        if (userRole !== 'admin') {
            query.employee = req.user.id;
        } else if (employee) {
            // Admin can filter by specific employee
            query.employee = employee;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'name role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Leaves retrieved successfully',
            leaves,
            count: leaves.length
        });

    } catch (error) {
        console.error('Error retrieving leaves:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single leave by ID
const getLeaveById = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        const leave = await Leave.findById(id)
            .populate('employee', 'name role');

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Check if user can view this leave
        if (userRole !== 'admin' && leave.employee._id.toString() !== req.user.id) {
            return res.status(403).json({ 
                message: 'Access denied. You can only view your own leave requests.' 
            });
        }

        res.status(200).json({
            message: 'Leave retrieved successfully',
            leave
        });

    } catch (error) {
        console.error('Error retrieving leave:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update leave request
const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewComments, fromDate, toDate, reason } = req.body;
        const userRole = req.user.role;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Check permissions
        if (userRole === 'admin') {
            // Admin can approve/reject and add comments
            if (status && ['Approved', 'Rejected'].includes(status)) {
                leave.status = status;
                if (reviewComments) {
                    leave.reviewComments = reviewComments;
                }
            } else {
                return res.status(400).json({ 
                    message: 'Admin can only approve or reject leaves' 
                });
            }
        } else {
            // Employee can only edit their own pending leaves
            if (leave.employee.toString() !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Access denied. You can only edit your own leave requests.' 
                });
            }

            if (leave.status !== 'Pending') {
                return res.status(400).json({ 
                    message: 'You can only edit pending leave requests' 
                });
            }

            // Update leave details
            if (fromDate) {
                const start = new Date(fromDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (start < today) {
                    return res.status(400).json({
                        message: 'From date must be today or in the future'
                    });
                }
                leave.fromDate = start;
            }

            if (toDate) {
                const end = new Date(toDate);
                if (end < leave.fromDate) {
                    return res.status(400).json({
                        message: 'To date must be after from date'
                    });
                }
                leave.toDate = end;
            }

            if (reason) leave.reason = reason;
        }

        await leave.save();

        const updatedLeave = await Leave.findById(id)
            .populate('employee', 'name role');

        res.status(200).json({
            message: 'Leave updated successfully',
            leave: updatedLeave
        });

    } catch (error) {
        console.error('Error updating leave:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete leave request
const deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Check permissions
        if (userRole === 'admin') {
            // Admin can delete any leave
            await Leave.findByIdAndDelete(id);
            res.status(200).json({ message: 'Leave request deleted successfully' });
        } else {
            // Employee can only delete their own pending leaves
            if (leave.employee.toString() !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Access denied. You can only delete your own leave requests.' 
                });
            }

            if (leave.status !== 'Pending') {
                return res.status(400).json({ 
                    message: 'You can only delete pending leave requests' 
                });
            }

            await Leave.findByIdAndDelete(id);
            res.status(200).json({ message: 'Leave request deleted successfully' });
        }

    } catch (error) {
        console.error('Error deleting leave:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createLeave,
    getAllLeaves,
    getLeaveById,
    updateLeave,
    deleteLeave
};