const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const checkMongo = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/beaconops';
        console.log(`Attempting to connect to: ${uri}`);
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

checkMongo();
