const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkManager = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const m = await User.findOne({ role: 'manager' });
        if (m) {
            console.log('--- Manager Details ---');
            console.log('ID:', m._id);
            console.log('Email:', m.email);
            console.log('Active:', m.isActive);
            console.log('IsPasswordChanged:', m.isPasswordChanged);
            console.log('Role:', m.role);
        } else {
            console.log('No manager found');
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkManager();
