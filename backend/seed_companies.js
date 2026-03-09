const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('./models/Company');
const User = require('./models/User');

const seedCompanies = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
        console.log('Connected to MongoDB');

        // Get a user to assign as identifiedBy
        const user = await User.findOne();
        if (!user) {
            console.error('No users found. Cannot seed companies without a user.');
            process.exit(1);
        }

        const companies = [
            {
                companyName: 'TechCorp Solutions',
                industry: 'Software',
                website: 'https://techcorp.com',
                location: { city: 'San Francisco', country: 'USA' },
                employeeCount: '51-200',
                revenue: '10-50Cr',
                status: 'approved',
                priority: 'high',
                identifiedBy: user._id,
                approvalStatus: 'approved',
                overview: 'Leading provider of enterprise software solutions.'
            },
            {
                companyName: 'Global Innovations',
                industry: 'Manufacturing',
                website: 'https://globalinnovations.com',
                location: { city: 'Mumbai', country: 'India' },
                employeeCount: '201-500',
                revenue: '50-100Cr',
                status: 'researching',
                priority: 'medium',
                identifiedBy: user._id,
                approvalStatus: 'pending',
                overview: 'Innovative manufacturing processes for automotive parts.'
            },
            {
                companyName: 'Creative Studios',
                industry: 'Design',
                website: 'https://creativestudios.agency',
                location: { city: 'London', country: 'UK' },
                employeeCount: '1-10',
                revenue: '<1Cr',
                status: 'in-contact',
                priority: 'low',
                identifiedBy: user._id,
                approvalStatus: 'approved',
                overview: 'Boutique design agency specializing in branding.'
            }
        ];

        await Company.insertMany(companies);
        console.log(`Seeded ${companies.length} companies successfully.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedCompanies();
