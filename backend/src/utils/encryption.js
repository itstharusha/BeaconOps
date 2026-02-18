// FILE: src/utils/encryption.js
// SPEC REFERENCE: Section 17 - Password Hashing (bcrypt, salt rounds: 12), JWT utilities

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12; // Spec §17: bcrypt salt rounds = 12

/**
 * Hash a plaintext password using bcrypt
 * Spec §17: Never store or log plaintext passwords
 */
const hashPassword = async (plaintext) => {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
};

/**
 * Compare plaintext password against bcrypt hash
 * Returns true if match, false otherwise
 */
const comparePassword = async (plaintext, hash) => {
    return bcrypt.compare(plaintext, hash);
};

/**
 * Generate a cryptographically secure random token (for refresh tokens, reset tokens)
 */
const generateSecureToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a UUID v4 (for idempotency keys, event fingerprints)
 */
const generateUUID = () => {
    return crypto.randomUUID();
};

/**
 * Generate an event fingerprint for deduplication
 * Spec §12: hash of organizationId + entityType + entityId + eventType + timestamp (rounded to minute)
 */
const generateEventFingerprint = (organizationId, entityType, entityId, eventType, timestamp) => {
    const roundedTs = new Date(timestamp);
    roundedTs.setSeconds(0, 0); // Round to minute
    const data = `${organizationId}:${entityType}:${entityId}:${eventType}:${roundedTs.toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
    hashPassword,
    comparePassword,
    generateSecureToken,
    generateUUID,
    generateEventFingerprint,
    SALT_ROUNDS,
};
