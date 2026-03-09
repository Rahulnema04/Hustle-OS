const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'manager@hustlesystem.com' });
        if (!user) {
            console.log('User not found');
            return;
        }

        // Explicitly set password and flags
        user.password = 'Manager@2024';
        user.isPasswordChanged = true;
        user.isActive = true;

        await user.save();
        console.log('Password reset successfully for manager@hustlesystem.com');
        console.log('New stats: isActive:', user.isActive, 'isPasswordChanged:', user.isPasswordChanged);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

resetPassword();
