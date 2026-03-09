const { Leave, LeaveBalance } = require('../models/Leave');
const User = require('../models/User');
const mongoose = require('mongoose');
const notificationService = require('../services/enhancedNotificationService');
const attendanceLeaveSync = require('../services/attendanceLeaveSync');

// Helper function to initialize leave balance for new employees
const initializeLeaveBalance = async (employeeId, year = new Date().getFullYear()) => {
  try {
    const existingBalance = await LeaveBalance.findOne({ employee: employeeId, year });
    
    if (!existingBalance) {
      const newBalance = new LeaveBalance({
        employee: employeeId,
        year,
        balances: {
          sick: { allocated: 12, used: 0, remaining: 12 },
          casual: { allocated: 12, used: 0, remaining: 12 },
          vacation: { allocated: 21, used: 0, remaining: 21 },
          maternity: { allocated: 180, used: 0, remaining: 180 },
          paternity: { allocated: 15, used: 0, remaining: 15 },
          compensatory: { allocated: 0, used: 0, remaining: 0 }
        }
      });
      
      await newBalance.save();
      return newBalance;
    }
    
    return existingBalance;
  } catch (error) {
    console.error('Error initializing leave balance:', error);
    throw error;
  }
};

// Helper function to update leave balance
const updateLeaveBalance = async (employeeId, leaveType, days, operation = 'deduct') => {
  try {
    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employee: employeeId, year });
    
    if (!balance) {
      balance = await initializeLeaveBalance(employeeId, year);
    }
    
    if (operation === 'deduct') {
      balance.balances[leaveType].used += days;
      balance.balances[leaveType].remaining -= days;
    } else if (operation === 'restore') {
      balance.balances[leaveType].used -= days;
      balance.balances[leaveType].remaining += days;
    }
    
    // Ensure remaining doesn't go negative
    if (balance.balances[leaveType].remaining < 0) {
      balance.balances[leaveType].remaining = 0;
    }
    
    balance.lastUpdated = new Date();
    await balance.save();
    
    return balance;
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw error;
  }
};

// Create a new leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    console.log('Leave request received:', req.body); // Debug logging
    
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact,
      handoverDetails,
      handoverTo,
      isHalfDay,
      halfDayPeriod
    } = req.body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      console.log('Validation failed - missing fields:', { leaveType, startDate, endDate, reason }); // Debug logging
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: leaveType, startDate, endDate, reason'
      });
    }

    // Check if start date is in the future (except for emergency/sick leave)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedStartDate = new Date(startDate);
    requestedStartDate.setHours(0, 0, 0, 0);

    if (!['sick', 'emergency'].includes(leaveType) && requestedStartDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave start date cannot be in the past for this leave type'
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employee: req.user._id,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ],
      status: { $nin: ['rejected', 'cancelled'] }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for overlapping dates'
      });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    // For half-day leave, totalDays should be 0.5
    const actualTotalDays = isHalfDay ? 0.5 : totalDays;

    // Create leave request
    const leaveRequest = new Leave({
      employee: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays: actualTotalDays,
      reason,
      emergencyContact,
      handoverDetails,
      handoverTo: handoverTo && handoverTo.trim() !== '' ? handoverTo : undefined,
      isHalfDay: isHalfDay || false,
      halfDayPeriod
    });

    // Check leave balance before saving
    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employee: req.user._id, year });
    
    if (!balance) {
      balance = await initializeLeaveBalance(req.user._id, year);
    }

    if (balance.balances[leaveType].remaining < actualTotalDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${balance.balances[leaveType].remaining} days, Requested: ${actualTotalDays} days`
      });
    }

    await leaveRequest.save();
    
    await leaveRequest.populate([
      { path: 'employee', select: 'firstName lastName email role department' },
      { path: 'handoverTo', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message
    });
  }
};

// Get all leave requests (with filters)
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employee, leaveType, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    // Role-based filtering
    if (['individual', 'service-delivery', 'service-onboarding'].includes(req.user.role)) {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      // Managers can see their own leaves and their team's leaves
      const teamMembers = await User.find({ 
        role: { $in: ['individual', 'service-delivery', 'service-onboarding'] } 
      }).select('_id');
      const teamIds = teamMembers.map(member => member._id);
      query.employee = { $in: [...teamIds, req.user._id] };
    }
    // HR and above can see all leaves
    
    if (status) query.status = status;
    if (employee) query.employee = employee;
    if (leaveType) query.leaveType = leaveType;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'employee', select: 'firstName lastName email role department' },
        { path: 'handoverTo', select: 'firstName lastName email' },
        { path: 'managerApproval.approvedBy', select: 'firstName lastName' },
        { path: 'hrApproval.approvedBy', select: 'firstName lastName' },
        { path: 'coFounderApproval.approvedBy', select: 'firstName lastName' }
      ]
    };

    const leaves = await Leave.paginate(query, options);

    res.status(200).json({
      success: true,
      data: leaves
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

// Get pending approvals for current user
exports.getPendingApprovals = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'manager') {
      // Get leaves that need manager approval
      const teamMembers = await User.find({ 
        role: { $in: ['individual', 'service-delivery', 'service-onboarding'] } 
      }).select('_id');
      const teamIds = teamMembers.map(member => member._id);
      
      query = {
        employee: { $in: teamIds },
        'managerApproval.status': 'pending',
        status: { $in: ['pending'] }
      };
    } else if (req.user.role === 'hr') {
      // Get leaves that need HR approval
      query = {
        $or: [
          { 'hrApproval.status': 'pending', status: { $in: ['pending', 'manager_approved'] } },
          { 
            employee: { $in: await User.find({ role: 'manager' }).select('_id') },
            'hrApproval.status': 'pending',
            status: { $in: ['pending'] }
          }
        ]
      };
    } else if (req.user.role === 'co-founder') {
      // Get leaves that need co-founder approval
      const managerAndHRIds = await User.find({ role: { $in: ['manager', 'hr'] } }).select('_id');
      const ids = managerAndHRIds.map(u => u._id);
      
      query = {
        employee: { $in: ids },
        'coFounderApproval.status': 'pending',
        status: { $in: ['pending', 'manager_approved', 'hr_approved'] }
      };
    }

    const pendingLeaves = await Leave.find(query)
      .populate('employee', 'firstName lastName email role department')
      .populate('handoverTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingLeaves
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

// Approve or reject leave request
exports.updateLeaveApproval = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const leave = await Leave.findById(leaveId).populate('employee');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    const userRole = req.user.role;
    const employeeRole = leave.employee.role;
    
    let canApprove = false;
    let approvalField = '';

    // Manager can approve leaves for individual contributors
    if (userRole === 'manager' && ['individual', 'service-delivery', 'service-onboarding'].includes(employeeRole)) {
      canApprove = true;
      approvalField = 'managerApproval';
    } 
    // HR can approve any employee's leave
    else if (userRole === 'hr') {
      canApprove = true;
      approvalField = 'hrApproval';
    } 
    // Co-founder can approve manager and HR leaves
    else if (userRole === 'co-founder' && ['manager', 'hr'].includes(employeeRole)) {
      canApprove = true;
      approvalField = 'coFounderApproval';
    }

    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this leave request'
      });
    }

    // Update approval
    const updateObj = {};
    updateObj[`${approvalField}.status`] = action === 'approve' ? 'approved' : 'rejected';
    updateObj[`${approvalField}.approvedBy`] = req.user._id;
    updateObj[`${approvalField}.approvedAt`] = new Date();
    updateObj[`${approvalField}.comments`] = comments || '';

    // Update the leave document
    await Leave.findByIdAndUpdate(leaveId, updateObj);
    
    // Refetch the updated leave document
    const updatedLeave = await Leave.findById(leaveId).populate('employee');
    
    // Update overall status
    await updatedLeave.updateStatus();
    await updatedLeave.save(); // Save the status changes to database
    
    // If leave is fully approved, deduct from balance
    if (updatedLeave.status === 'approved' && !updatedLeave.deductedFromBalance) {
      await updateLeaveBalance(updatedLeave.employee._id, updatedLeave.leaveType, updatedLeave.totalDays, 'deduct');
      await Leave.findByIdAndUpdate(leaveId, { deductedFromBalance: true });
    }
    
    // If leave is rejected and was previously deducted, restore balance
    if (updatedLeave.status === 'rejected' && updatedLeave.deductedFromBalance) {
      await updateLeaveBalance(updatedLeave.employee._id, updatedLeave.leaveType, updatedLeave.totalDays, 'restore');
      await Leave.findByIdAndUpdate(leaveId, { deductedFromBalance: false });
    }

    // Get final updated leave with all populated fields
    const finalLeave = await Leave.findById(leaveId).populate([
      { path: 'employee', select: 'firstName lastName email role department' },
      { path: 'handoverTo', select: 'firstName lastName email' },
      { path: 'managerApproval.approvedBy', select: 'firstName lastName' },
      { path: 'hrApproval.approvedBy', select: 'firstName lastName' },
      { path: 'coFounderApproval.approvedBy', select: 'firstName lastName' }
    ]);

    // Send notifications
    try {
      if (action === 'approve') {
        // Notify employee if leave is fully approved
        if (finalLeave.status === 'approved') {
          await notificationService.notifyLeaveApproved(finalLeave);
          
          // Auto-mark attendance for approved leave
          try {
            console.log(`🔄 Auto-marking attendance for approved leave ${leaveId}`);
            await attendanceLeaveSync.markAttendanceForLeave(leaveId);
            console.log(`✅ Attendance auto-marked for leave ${leaveId}`);
          } catch (attendanceError) {
            console.error('Error auto-marking attendance:', attendanceError);
            // Don't fail the request if attendance marking fails
          }
        }
      } else if (action === 'reject') {
        // Clean up auto-generated attendance if leave was previously approved
        if (updatedLeave.attendanceMarked) {
          try {
            console.log(`🗑️  Cleaning up attendance for rejected leave ${leaveId}`);
            await attendanceLeaveSync.handleLeaveCancellation(leaveId);
            console.log(`✅ Attendance cleanup completed for rejected leave ${leaveId}`);
          } catch (attendanceError) {
            console.error('Error cleaning up attendance:', attendanceError);
          }
        }
        
        // Notify employee of rejection
        await notificationService.notifyLeaveRejected(finalLeave, comments);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${action}d successfully`,
      data: finalLeave
    });

  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave approval',
      error: error.message
    });
  }
};

// Get leave balance for user
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    // Check authorization
    if (req.user.role === 'individual' && employeeId && employeeId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own leave balance'
      });
    }
    
    const targetEmployeeId = employeeId || req.user._id;
    
    let balance = await LeaveBalance.findOne({ 
      employee: targetEmployeeId, 
      year: parseInt(year) 
    }).populate('employee', 'firstName lastName email');
    
    if (!balance) {
      balance = await initializeLeaveBalance(targetEmployeeId, parseInt(year));
      await balance.populate('employee', 'firstName lastName email');
    }

    res.status(200).json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message
    });
  }
};

// Update leave balance (HR only)
exports.updateLeaveBalance = async (req, res) => {
  try {
    if (!['hr', 'co-founder', 'ceo'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only HR and above can update leave balances'
      });
    }

    const { employeeId } = req.params;
    const { leaveType, allocated } = req.body;
    const { year = new Date().getFullYear() } = req.query;

    if (!leaveType || allocated === undefined) {
      return res.status(400).json({
        success: false,
        message: 'leaveType and allocated are required'
      });
    }

    let balance = await LeaveBalance.findOne({ 
      employee: employeeId, 
      year: parseInt(year) 
    });
    
    if (!balance) {
      balance = await initializeLeaveBalance(employeeId, parseInt(year));
    }

    const oldAllocated = balance.balances[leaveType].allocated;
    const used = balance.balances[leaveType].used;
    
    balance.balances[leaveType].allocated = allocated;
    balance.balances[leaveType].remaining = allocated - used;
    balance.lastUpdated = new Date();

    await balance.save();
    await balance.populate('employee', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Leave balance updated successfully',
      data: balance
    });

  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave balance',
      error: error.message
    });
  }
};

// Cancel leave request (employee only, before approval)
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave request
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    // Only allow cancellation if leave is pending or manager_approved
    if (!['pending', 'manager_approved'].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave that has been fully approved or already cancelled'
      });
    }

    // Clean up auto-generated attendance if leave was approved
    if (leave.status === 'approved' && leave.attendanceMarked) {
      try {
        console.log(`🗑️  Cleaning up attendance for cancelled leave ${leaveId}`);
        await attendanceLeaveSync.handleLeaveCancellation(leaveId);
        console.log(`✅ Attendance cleanup completed for leave ${leaveId}`);
      } catch (attendanceError) {
        console.error('Error cleaning up attendance:', attendanceError);
        // Continue with cancellation even if cleanup fails
      }
    }

    // Restore leave balance if it was deducted
    if (leave.deductedFromBalance) {
      await updateLeaveBalance(leave.employee, leave.leaveType, leave.totalDays, 'restore');
    }

    // Update leave status to cancelled
    leave.status = 'cancelled';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave
    });

  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request',
      error: error.message
    });
  }
};

// Get leave statistics (for dashboards)
exports.getLeaveStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    let matchCondition = {};
    
    // Role-based access
    if (['individual', 'service-delivery', 'service-onboarding'].includes(req.user.role)) {
      matchCondition.employee = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ 
        role: { $in: ['individual', 'service-delivery', 'service-onboarding'] } 
      }).select('_id');
      const teamIds = teamMembers.map(member => member._id);
      matchCondition.employee = { $in: [...teamIds, req.user._id] };
    }
    
    const stats = await Leave.aggregate([
      {
        $match: {
          ...matchCondition,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approvedRequests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pendingRequests: { $sum: { $cond: [{ $in: ['$status', ['pending', 'manager_approved', 'hr_approved']] }, 1, 0] } },
          rejectedRequests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          totalDaysRequested: { $sum: '$totalDays' },
          avgDaysPerRequest: { $avg: '$totalDays' }
        }
      }
    ]);

    const leaveTypeStats = await Leave.aggregate([
      {
        $match: {
          ...matchCondition,
          status: 'approved',
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRequests: 0,
          approvedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          totalDaysRequested: 0,
          avgDaysPerRequest: 0
        },
        byLeaveType: leaveTypeStats
      }
    });

  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message
    });
  }
};

// Get current user's leave requests
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate([
        { path: 'handoverTo', select: 'firstName lastName email' },
        { path: 'managerApproval.approvedBy', select: 'firstName lastName' },
        { path: 'hrApproval.approvedBy', select: 'firstName lastName' },
        { path: 'coFounderApproval.approvedBy', select: 'firstName lastName' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves
    });

  } catch (error) {
    console.error('Error fetching my leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your leave requests',
      error: error.message
    });
  }
};

// Get current user's leave balance
exports.getMyLeaveBalance = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const balance = await LeaveBalance.findOneAndUpdate(
      { 
        employee: req.user._id, 
        year: currentYear 
      },
      {
        $setOnInsert: {
          employee: req.user._id,
          year: currentYear,
          balances: {
            sick: { allocated: 12, used: 0, remaining: 12 },
            casual: { allocated: 12, used: 0, remaining: 12 },
            vacation: { allocated: 21, used: 0, remaining: 21 },
            maternity: { allocated: 180, used: 0, remaining: 180 },
            paternity: { allocated: 15, used: 0, remaining: 15 }
          }
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Transform the nested balances structure to flat structure for frontend
    const transformedBalance = {
      vacation: balance.balances.vacation,
      sick: balance.balances.sick,
      casual: balance.balances.casual,
      maternity: balance.balances.maternity,
      paternity: balance.balances.paternity
    };

    res.status(200).json({
      success: true,
      data: transformedBalance
    });

  } catch (error) {
    console.error('Error fetching my leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your leave balance',
      error: error.message
    });
  }
};