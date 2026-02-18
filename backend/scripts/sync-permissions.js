// FILE: backend/scripts/sync-permissions.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { ROLE_PERMISSIONS } = require('../src/utils/constants');
const { connectDB } = require('../src/config/database');

const sync = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();

        const users = await User.find({});
        console.log(`Found ${users.length} users. Syncing permissions...`);

        for (const user of users) {
            const newPermissions = ROLE_PERMISSIONS[user.role] || [];
            user.permissions = newPermissions;
            await user.save();
            console.log(`✅ Synced ${user.email} (${user.role})`);
        }

        console.log('Permission sync completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
};

sync();
