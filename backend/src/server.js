// FILE: src/server.js
// SPEC REFERENCE: Section 13 - API Contract, Section 17 - Security (Helmet, CORS)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const clean = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

// Config & Utils
const { connectDB } = require('./config/database');
const { logger } = require('./utils/logger');
const { startAgentScheduler } = require('./agents/agentScheduler');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const { requestLogger } = require('./middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const alertRoutes = require('./routes/alertRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize App
const app = express();

// ─── SECURITY MIDDLEWARE ────────────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(globalRateLimiter); // Rate limiting
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(clean()); // Data sanitization against XSS

// ─── GENERAL MIDDLEWARE ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
app.use(cookieParser()); // Parse Cookie header and populate req.cookies
app.use(compression()); // Compress all responses
app.use(requestLogger); // Custom request logging

// ─── ROUTES ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'BeaconOps API is running', timestamp: new Date() });
});

// ─── ERROR HANDLING ─────────────────────────────────────────────────────────
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Global error handler

// ─── SERVER STARTUP ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to Database
        await connectDB();

        // 2. Start AI Agents
        startAgentScheduler();

        // 3. Start Express Server
        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err.message, stack: err.stack });
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            logger.info('SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated!');
            });
        });

    } catch (err) {
        logger.error('Failed to start server', { error: err.message });
        process.exit(1);
    }
};

startServer();

module.exports = app; // For testing
