// FILE: backend/scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../src/models/Organization');
const User = require('../src/models/User');
const authService = require('../src/services/authService');
const { ROLES } = require('../src/utils/constants');
const { connectDB } = require('../src/config/database');

const seed = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();

        // 1. Clear existing data (Be careful in production!)
        console.log('Cleaning existing users and organizations...');
        await User.deleteMany({});
        await Organization.deleteMany({});

        // 2. Create Demo Organization
        console.log('Creating demo organization...');
        const org = await Organization.create({
            name: 'BeaconOps Demo Org',
            domain: 'beaconops.demo',
            industry: 'Logistics',
            contactEmail: 'admin@beaconops.demo',
            subscriptionTier: 'enterprise',
        });
        const orgId = org._id;

        // 3. Define Seed Users
        const users = [
            {
                firstName: 'Super',
                lastName: 'Admin',
                email: 'superadmin@beaconops.com',
                password: 'password123',
                role: ROLES.SUPER_ADMIN,
                organizationId: null
            },
            {
                firstName: 'System',
                lastName: 'Manager',
                email: 'admin@beaconops.demo',
                password: 'password123',
                role: ROLES.ORG_ADMIN,
                organizationId: orgId
            },
            {
                firstName: 'Risk',
                lastName: 'Analyst',
                email: 'analyst@beaconops.demo',
                password: 'password123',
                role: ROLES.RISK_ANALYST,
                organizationId: orgId
            },
            {
                firstName: 'Logistics',
                lastName: 'Operator',
                email: 'operator@beaconops.demo',
                password: 'password123',
                role: ROLES.LOGISTICS_OPERATOR,
                organizationId: orgId
            },
            {
                firstName: 'Inventory',
                lastName: 'Manager',
                email: 'inventory@beaconops.demo',
                password: 'password123',
                role: ROLES.INVENTORY_MANAGER,
                organizationId: orgId
            },
            {
                firstName: 'External',
                lastName: 'Viewer',
                email: 'viewer@beaconops.demo',
                password: 'password123',
                role: ROLES.VIEWER,
                organizationId: orgId
            }
        ];

        // 4. Register Users via AuthService
        console.log('Registering seed users...');
        for (const userData of users) {
            try {
                await authService.register(userData);
                console.log(`✅ Created ${userData.role}: ${userData.email}`);
            } catch (err) {
                console.error(`❌ Failed to create ${userData.role}: ${err.message}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
