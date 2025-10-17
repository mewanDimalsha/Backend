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
        
        const end = new Date(toDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(fromDate);
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());

        if (startDate < today) {
            return res.status(400).json({
                message: 'From date must be today or in the future'
            });
        }

        // if (start < today) {
        //     return res.status(400).json({
        //         message: 'From date must be today or in the future'
        //     });
        // }

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

        // Get employee details for response
        let employeeDetails = null;
        if (newLeave.employee === 'employee') {
            employeeDetails = await User.findOne({ name: 'employee' }).select('name role');
        } else {
            employeeDetails = await User.findById(newLeave.employee).select('name role');
        }
        newLeave.employee = employeeDetails;

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
        let query = {};
        
        // Add employee filter if provided
        if (employee) {
            // First, find users whose names match the search term
            const matchingUsers = await User.find({ 
                name: { $regex: employee, $options: 'i' } 
            }).select('_id name role');
            
            if (matchingUsers.length === 0) {
                // No matching users found, return empty result
                return res.status(200).json([]);
            }
            
            // Get the IDs of matching users
            const userIds = matchingUsers.map(user => user._id.toString());
            query.employee = { $in: userIds };
        }
        
        const leaves = await Leave.find(query).sort({ createdAt: -1 });
        
        // Manually populate employee details
        const leavesWithEmployeeDetails = await Promise.all(
            leaves.map(async (leave) => {
                let employeeDetails = null;
                
                // Handle case where employee field contains "employee" string
                if (leave.employee === 'employee') {
                    // Find user with name "employee"
                    employeeDetails = await User.findOne({ name: 'employee' }).select('name role');
                } else {
                    // Handle normal ObjectId case
                    employeeDetails = await User.findById(leave.employee).select('name role');
                }
                
                return {
                    ...leave.toObject(),
                    employee: employeeDetails
                };
            })
        );
        
        res.status(200).json(leavesWithEmployeeDetails);

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

        const leave = await Leave.findById(id);
        
        if (leave) {
            let employeeDetails = null;
            if (leave.employee === 'employee') {
                employeeDetails = await User.findOne({ name: 'employee' }).select('name role');
            } else {
                employeeDetails = await User.findById(leave.employee).select('name role');
            }
            leave.employee = employeeDetails;
        }

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

        const updatedLeave = await Leave.findById(id);
        if (updatedLeave) {
            let employeeDetails = null;
            if (updatedLeave.employee === 'employee') {
                employeeDetails = await User.findOne({ name: 'employee' }).select('name role');
            } else {
                employeeDetails = await User.findById(updatedLeave.employee).select('name role');
            }
            updatedLeave.employee = employeeDetails;
        }

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