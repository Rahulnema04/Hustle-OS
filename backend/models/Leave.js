const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required']
  },
  leaveType: {
    type: String,
    enum: {
      values: ['sick', 'casual', 'vacation', 'maternity', 'paternity', 'emergency', 'personal', 'compensatory'],
      message: 'Invalid leave type'
    },
    required: [true, 'Leave type is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  totalDays: {
    type: Number,
    required: true,
    min: [0.5, 'Minimum leave duration is 0.5 days']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'manager_approved', 'hr_approved', 'approved', 'rejected', 'cancelled'],
      message: 'Invalid status'
    },
    default: 'pending'
  },
  // Approval workflow
  managerApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  hrApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  coFounderApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  // Emergency contact during leave
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  // Work handover details
  handoverDetails: {
    type: String,
    maxlength: [1000, 'Handover details cannot exceed 1000 characters']
  },
  handoverTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional fields
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayPeriod: {
    type: String,
    enum: ['first-half', 'second-half'],
    required: function() {
      return this.isHalfDay;
    }
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  appliedDate: {
    type: Date,
    default: Date.now
  },
  // For tracking leave balance deduction
  deductedFromBalance: {
    type: Boolean,
    default: false
  },
  // Attendance integration fields
  attendanceMarked: {
    type: Boolean,
    default: false
  },
  attendanceRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }]
}, {
  timestamps: true
});

// Leave Balance Schema for tracking annual leave balances
const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  balances: {
    sick: {
      allocated: { type: Number, default: 12 }, // 12 days per year
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 }
    },
    casual: {
      allocated: { type: Number, default: 12 }, // 12 days per year
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 }
    },
    vacation: {
      allocated: { type: Number, default: 21 }, // 21 days per year
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 21 }
    },
    maternity: {
      allocated: { type: Number, default: 180 }, // 180 days (6 months)
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 180 }
    },
    paternity: {
      allocated: { type: Number, default: 15 }, // 15 days
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 15 }
    },
    compensatory: {
      allocated: { type: Number, default: 0 }, // Earned through overtime
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total days
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    // Calculate business days (excluding weekends)
    let totalDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays += 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If half day, reduce by 0.5
    if (this.isHalfDay) {
      totalDays = 0.5;
    }
    
    this.totalDays = totalDays;
  }
  next();
});

// Method to check if user needs specific approvals based on role
leaveSchema.methods.getRequiredApprovals = function() {
  return new Promise(async (resolve, reject) => {
    try {
      await this.populate('employee');
      const userRole = this.employee.role;
      
      let requiredApprovals = [];
      
      switch (userRole) {
        case 'individual':
          requiredApprovals = ['manager', 'hr'];
          break;
        case 'manager':
          requiredApprovals = ['coFounder', 'hr'];
          break;
        case 'hr':
          requiredApprovals = ['coFounder'];
          break;
        case 'co-founder':
          requiredApprovals = ['ceo'];
          break;
        case 'ceo':
          requiredApprovals = []; // CEO leaves are auto-approved or require board approval
          break;
        default:
          requiredApprovals = ['manager', 'hr'];
      }
      
      resolve(requiredApprovals);
    } catch (error) {
      reject(error);
    }
  });
};

// Method to update leave status based on approvals
leaveSchema.methods.updateStatus = function() {
  return new Promise(async (resolve, reject) => {
    try {
      const requiredApprovals = await this.getRequiredApprovals();
      let allApproved = true;
      let anyRejected = false;
      
      // Check if any required approval is rejected
      if (requiredApprovals.includes('manager') && this.managerApproval.status === 'rejected') {
        anyRejected = true;
      }
      if (requiredApprovals.includes('hr') && this.hrApproval.status === 'rejected') {
        anyRejected = true;
      }
      if (requiredApprovals.includes('coFounder') && this.coFounderApproval.status === 'rejected') {
        anyRejected = true;
      }
      
      if (anyRejected) {
        this.status = 'rejected';
        resolve(this);
        return;
      }
      
      // Check if all required approvals are given
      if (requiredApprovals.includes('manager') && this.managerApproval.status !== 'approved') {
        allApproved = false;
      }
      if (requiredApprovals.includes('hr') && this.hrApproval.status !== 'approved') {
        allApproved = false;
      }
      if (requiredApprovals.includes('coFounder') && this.coFounderApproval.status !== 'approved') {
        allApproved = false;
      }
      
      if (allApproved) {
        this.status = 'approved';
      } else {
        // Determine intermediate status
        if (requiredApprovals.includes('manager') && this.managerApproval.status === 'approved') {
          this.status = 'manager_approved';
        }
        if (requiredApprovals.includes('hr') && this.hrApproval.status === 'approved') {
          if (this.status === 'manager_approved' || !requiredApprovals.includes('manager')) {
            this.status = 'hr_approved';
          }
        }
      }
      
      resolve(this);
    } catch (error) {
      reject(error);
    }
  });
};

// Compound index for efficient queries
leaveSchema.index({ employee: 1, year: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Add pagination plugin
leaveSchema.plugin(mongoosePaginate);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

const Leave = mongoose.model('Leave', leaveSchema);
const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = { Leave, LeaveBalance };