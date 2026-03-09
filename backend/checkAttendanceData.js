const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const checkAttendanceRecords = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // Get recent attendance records with detailed date info
    const recentRecords = await db.collection('attendances').find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('\nDetailed attendance records:');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. Employee ID: ${record.employeeId}`);
      console.log(`   Date (stored): ${record.date}`);
      console.log(`   Date (ISO): ${record.date.toISOString()}`);
      console.log(`   Date (Local): ${record.date.toString()}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Punch In: ${record.punchIn?.time || 'Not set'}`);
      console.log('   ---');
    });
    
    // Test our date query logic
    console.log('\n=== Testing Date Query Logic ===');
    
    // Test for today with new logic
    const todayString = new Date().toISOString().split('T')[0];
    console.log('Today string:', todayString);
    
    const [year, month, day] = todayString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    console.log('Query range:');
    console.log('Start:', targetDate, '(', targetDate.toISOString(), ')');
    console.log('End:', nextDay, '(', nextDay.toISOString(), ')');
    
    // Test the actual query
    const queryResult = await db.collection('attendances').find({
      date: { $gte: targetDate, $lt: nextDay }
    }).toArray();
    
    console.log(`\nRecords found with this query: ${queryResult.length}`);
    queryResult.forEach((record, index) => {
      console.log(`${index + 1}. Employee ID: ${record.employeeId}, Date: ${record.date.toISOString()}`);
    });
    
    // Also test for tomorrow (Oct 8) since our records seem to be there
    const tomorrowString = '2025-10-08';
    const [tYear, tMonth, tDay] = tomorrowString.split('-').map(Number);
    const tomorrowTargetDate = new Date(tYear, tMonth - 1, tDay, 0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrowTargetDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log('\n=== Testing Oct 8 Query ===');
    console.log('Query range for Oct 8:');
    console.log('Start:', tomorrowTargetDate, '(', tomorrowTargetDate.toISOString(), ')');
    console.log('End:', dayAfterTomorrow, '(', dayAfterTomorrow.toISOString(), ')');
    
    const oct8Result = await db.collection('attendances').find({
      date: { $gte: tomorrowTargetDate, $lt: dayAfterTomorrow }
    }).toArray();
    
    console.log(`\nRecords found for Oct 8: ${oct8Result.length}`);
    oct8Result.forEach((record, index) => {
      console.log(`${index + 1}. Employee ID: ${record.employeeId}, Date: ${record.date.toISOString()}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAttendanceRecords();