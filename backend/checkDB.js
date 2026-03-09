const mongoose = require('mongoose');
require('./config/database');

setTimeout(async () => {
  try {
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    console.log('Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
    
    if (mongoose.connection.readyState === 1) {
      console.log('Database connected successfully!');
      
      // Get basic stats
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Try to count attendance records
      const Attendance = require('./models/Attendance');
      const count = await Attendance.countDocuments();
      console.log('Total attendance records:', count);
      
    } else {
      console.log('Database not connected');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 3000);