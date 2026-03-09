const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('./models/Company');

const checkCompanies = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
        console.log('Connected to MongoDB');

        const count = await Company.countDocuments();
        console.log(`Total Companies: ${count}`);

        const companies = await Company.find({}).limit(5);
        console.log('First 5 companies:', JSON.stringify(companies, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkCompanies();
