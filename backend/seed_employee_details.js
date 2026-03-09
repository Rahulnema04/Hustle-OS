require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to update.`);

        const bankNames = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'];
        const institutes = ['IIT Bombay', 'University of Delhi', 'BITS Pilani', 'NIT Trichy'];
        const qualifications = ['B.Tech Computer Science', 'MBA Finance', 'B.Sc Statistics', 'M.Tech AI'];
        const locations = ['Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR', 'Pune, Maharashtra'];

        let updatedCount = 0;

        for (const user of users) {
            // Skip if data already appears substantial (rudimentary check)
            if (user.education && user.education.instituteName) continue;

            const randomBank = bankNames[Math.floor(Math.random() * bankNames.length)];
            const randomInstitute = institutes[Math.floor(Math.random() * institutes.length)];
            const randomQual = qualifications[Math.floor(Math.random() * qualifications.length)];
            const randomLoc = locations[Math.floor(Math.random() * locations.length)];

            // Random 12 digit Aadhaar
            const aadhaar = Math.floor(100000000000 + Math.random() * 900000000000).toString();
            // Random PAN like ABCDE1234F
            const pan = 'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F';

            user.education = {
                instituteName: randomInstitute,
                highestQualification: randomQual
            };

            user.bankDetails = {
                bankName: randomBank,
                branchName: 'Main Branch',
                accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
                ifscCode: randomBank.substring(0, 4).toUpperCase() + '0001234',
                accountHolderName: `${user.firstName} ${user.lastName}`
            };

            user.aadhaarDetails = {
                number: aadhaar,
                verified: true
            };

            user.panDetails = {
                number: pan,
                verified: true
            };

            user.address = randomLoc;

            // Only update dateOfBirth if it's the default 1970/1990 placeholder or missing
            if (!user.dateOfBirth || user.dateOfBirth.getFullYear() <= 1990) {
                const randomYear = 1990 + Math.floor(Math.random() * 10);
                user.dateOfBirth = new Date(`${randomYear}-05-15`);
            }

            if (!user.joiningDate) {
                user.joiningDate = user.createdAt;
            }

            await user.save({ validateBeforeSave: false }); // Skip strict validation for now to ensure update
            updatedCount++;
            console.log(`Updated details for ${user.email}`);
        }

        console.log(`\nSuccessfully updated ${updatedCount} users with dummy data.`);

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedData();
