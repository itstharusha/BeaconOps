// FILE: src/services/notificationService.js
// SPEC REFERENCE: Section 12 - Notification Dispatch, Section 19 - Email/SMS Config
// Handles sending emails and SMS (currently mocked/stubbed for development)

const OrganizationConfig = require('../models/OrganizationConfig');
const { logger } = require('../utils/logger');
// In production: const nodemailer = require('nodemailer');
// In production: const twilio = require('twilio');

/**
 * Send notification based on org preferences and channel availability
 * Spec §12: Dispatch via configured channels (Email, SMS, In-App)
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {object} params.recipient - { email, phone, id }
 * @param {string} params.subject
 * @param {string} params.message
 * @param {string} params.severity - 'critical' | 'high' | 'medium' | 'low'
 */
const sendNotification = async ({ organizationId, recipient, subject, message, severity }) => {
    try {
        // 1. Load Org Config
        const orgConfig = await OrganizationConfig.findOne({ organizationId }).lean();
        const channels = orgConfig?.notificationChannels || { email: { enabled: true }, sms: { enabled: false } };

        const results = [];

        // 2. Email Channel
        if (channels.email?.enabled && recipient.email) {
            results.push(sendEmail(recipient.email, subject, message));
        }

        // 3. SMS Channel (Only for Critical/High if enabled)
        if (channels.sms?.enabled && recipient.phone && (severity === 'critical' || severity === 'high')) {
            results.push(sendSMS(recipient.phone, message));
        }

        await Promise.all(results);
        return true;
    } catch (error) {
        logger.error('Notification dispatch failed', { error: error.message, recipient: recipient.email });
        return false;
    }
};

/**
 * Mock Email Sender (Replace with Nodemailer in production)
 */
const sendEmail = async (to, subject, body) => {
    logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 50)}...`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
};

/**
 * Mock SMS Sender (Replace with Twilio/SNS in production)
 */
const sendSMS = async (to, body) => {
    logger.info(`[MOCK SMS] To: ${to} | Body: ${body.substring(0, 50)}...`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
};

module.exports = { sendNotification };
