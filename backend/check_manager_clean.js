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
            process.stdout.write('MANAGER_EMAIL:' + m.email + '\n');
            process.stdout.write('MANAGER_ACTIVE:' + m.isActive + '\n');
            process.stdout.write('MANAGER_ROLE:' + m.role + '\n');
        } else {
            process.stdout.write('NO_MANAGER_FOUND\n');
        }
        await mongoose.disconnect();
    } catch (error) {
        process.stdout.write('ERROR:' + error.message + '\n');
    }
};

checkManager();
