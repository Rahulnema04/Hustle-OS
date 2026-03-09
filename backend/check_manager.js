const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkManager = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const managers = await User.find({ role: 'manager' });
        console.log('Managers found:', managers.length);
        managers.forEach(m => {
            console.log(`- ${m.firstName} ${m.lastName} (${m.email}) | Active: ${m.isActive}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkManager();
