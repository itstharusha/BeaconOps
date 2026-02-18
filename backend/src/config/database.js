// FILE: src/config/database.js
// SPEC REFERENCE: Section 16 - MongoDB Query Limits (max 100 connections), Section 19 - MongoDB Replica Set

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beaconops';

const CONNECTION_OPTIONS = {
    maxPoolSize: 100,          // Spec §16: Max 100 connections per instance
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
};

let isConnected = false;

/**
 * Connect to MongoDB with retry logic
 * Spec §19: Mongoose auto-reconnect enabled
 */
const connectDB = async (retries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(MONGODB_URI, CONNECTION_OPTIONS);
            isConnected = true;
            logger.info('MongoDB connected successfully', {
                uri: MONGODB_URI.replace(/\/\/.*@/, '//***@'), // Mask credentials in logs
                attempt,
            });

            // Connection event handlers
            mongoose.connection.on('disconnected', () => {
                isConnected = false;
                logger.warn('MongoDB disconnected. Attempting to reconnect...');
            });

            mongoose.connection.on('reconnected', () => {
                isConnected = true;
                logger.info('MongoDB reconnected successfully');
            });

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error', { error: err.message });
            });

            return;
        } catch (error) {
            logger.error(`MongoDB connection attempt ${attempt} failed`, {
                error: error.message,
                retriesLeft: retries - attempt,
            });

            if (attempt === retries) {
                logger.error('All MongoDB connection attempts failed. Exiting...');
                process.exit(1);
            }

            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
    }
};

/**
 * Gracefully close MongoDB connection
 */
const disconnectDB = async () => {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        logger.info('MongoDB connection closed');
    }
};

/**
 * Check if MongoDB is connected
 */
const isDBConnected = () => isConnected;

module.exports = { connectDB, disconnectDB, isDBConnected };
