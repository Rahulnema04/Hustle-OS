const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const newPassword = 'TempPass123!';
        // Manually hash to be sure, though User model middleware handles it.
        // Better to use save() to trigger middleware.

        const emailsToReset = [
            'ceo@hustlesystem.com',
            'hos@gmail.com',
            'asmisoni2208@gmail.com',
            'cofounder@gmail.com'
        ];

        for (const email of emailsToReset) {
            const user = await User.findOne({ email });
            if (user) {
                console.log(`Resetting password for ${user.email} (${user.role})...`);
                user.password = newPassword;
                // Ensure originalPassword is updated mostly for our reference, 
                // though model logic might only set it if isNew.
                // We'll trust the pre-save hook to hash 'password'.
                await user.save();
                console.log(`Password reset successful for ${user.email}`);
            } else {
                console.log(`User not found: ${email}`);
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetPasswords();
