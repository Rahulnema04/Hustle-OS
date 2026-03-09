require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUserData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}).limit(5).lean();

        console.log('--- Checking User Data ---');
        users.forEach(user => {
            console.log(`\nUser: ${user.firstName} ${user.lastName} (${user.email})`);
            console.log('Role:', user.role);
            console.log('Department:', user.department);
            console.log('Address:', user.address);
            console.log('Phone:', user.phoneNumber || user.phone);
            console.log('Date of Birth:', user.dateOfBirth);
            console.log('Joining Date:', user.joiningDate);
            console.log('Education:', JSON.stringify(user.education, null, 2));
            console.log('Bank Details:', JSON.stringify(user.bankDetails, null, 2));
            console.log('Aadhaar Details:', JSON.stringify(user.aadhaarDetails, null, 2));
            console.log('PAN Details:', JSON.stringify(user.panDetails, null, 2));
        });

        await mongoose.disconnect();
        console.log('\nDisconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUserData();
