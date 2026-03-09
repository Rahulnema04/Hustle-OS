const mongoose = require('mongoose');
require('./config/database');
const Attendance = require('./models/Attendance');

setTimeout(async () => {
  try {
    const attendances = await Attendance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employeeId', 'firstName lastName employeeId role');
    
    console.log('Recent attendance records:');
    console.log('Total records found:', attendances.length);
    
    if (attendances.length === 0) {
      console.log('No attendance records found.');
    } else {
      attendances.forEach((record, index) => {
        console.log(`${index + 1}. ${record.employeeId?.firstName} ${record.employeeId?.lastName} (${record.employeeId?.employeeId}) - ${record.employeeId?.role}`);
        console.log(`   Date: ${record.date.toDateString()}`);
        console.log(`   Punch In: ${record.punchIn.time ? record.punchIn.time.toLocaleTimeString() : 'Not punched in'}`);
        console.log(`   Punch Out: ${record.punchOut.time ? record.punchOut.time.toLocaleTimeString() : 'Not punched out'}`);
        console.log(`   Status: ${record.status}`);
        console.log('---');
      });
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);