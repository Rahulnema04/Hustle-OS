const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createHR = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        // Check if HR already exists
        const existingHR = await User.findOne({ email: 'hr@gmail.com' });
        if (existingHR) {
            console.log('❌ HR user already exists!');
            console.log('📧 Email:', existingHR.email);
            console.log('👔 Role:', existingHR.role);
            console.log('\nPlease use existing HR user or delete it first.');
            process.exit(0);
        }

        // Create HR user
        const hrData = {
            firstName: 'HR',
            lastName: 'User',
            email: 'hr@gmail.com',
            password: 'hr@1234',
            role: 'hr',
            phoneNumber: '+91-9999999999',
            dateOfBirth: new Date('1990-01-01'),
            department: 'Human Resources',
            isActive: true,
            isPasswordChanged: true
        };

        const hr = await User.create(hrData);

        console.log('✅ HR user created successfully!\n');
        console.log('='.repeat(80));
        console.log('\n📋 HR USER CREDENTIALS:\n');
        console.log(`👤 Name: ${hr.firstName} ${hr.lastName}`);
        console.log(`📧 Email: ${hr.email}`);
        console.log(`🔑 Password: hr@1234`);
        console.log(`👔 Role: ${hr.role}`);
        console.log(`🆔 Employee ID: ${hr.employeeId}`);
        console.log(`🏢 Department: ${hr.department}`);
        console.log('\n' + '='.repeat(80));
        console.log('\n🚀 You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error creating HR user:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createHR();
