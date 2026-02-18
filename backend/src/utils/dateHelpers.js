// FILE: src/utils/dateHelpers.js
// SPEC REFERENCE: Section 10 - Risk Scoring (ETA deviation calculation), Section 12 - Cooldown/Escalation timing

/**
 * Get current UTC timestamp as ISO 8601 string
 */
const nowUTC = () => new Date().toISOString();

/**
 * Get current Date object in UTC
 */
const now = () => new Date();

/**
 * Calculate difference between two dates in hours
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number} Difference in hours (positive if date2 > date1)
 */
const diffInHours = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (d2 - d1) / (1000 * 60 * 60);
};

/**
 * Calculate difference between two dates in days
 */
const diffInDays = (date1, date2) => {
    return diffInHours(date1, date2) / 24;
};

/**
 * Calculate difference between two dates in minutes
 */
const diffInMinutes = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (d2 - d1) / (1000 * 60);
};

/**
 * Add hours to a date
 */
const addHours = (date, hours) => {
    const d = new Date(date);
    d.setTime(d.getTime() + hours * 60 * 60 * 1000);
    return d;
};

/**
 * Add days to a date
 */
const addDays = (date, days) => {
    return addHours(date, days * 24);
};

/**
 * Add milliseconds to a date
 */
const addMs = (date, ms) => {
    const d = new Date(date);
    d.setTime(d.getTime() + ms);
    return d;
};

/**
 * Check if a date is older than N days from now
 */
const isOlderThanDays = (date, days) => {
    return diffInDays(date, now()) > days;
};

/**
 * Check if a date is in the past
 */
const isPast = (date) => new Date(date) < now();

/**
 * Format date to ISO 8601 UTC string
 */
const toISO = (date) => new Date(date).toISOString();

/**
 * Calculate ETA deviation in hours (positive = delayed, negative = early)
 * Used by shipment risk scoring engine
 */
const calculateETADeviation = (estimatedArrival, currentTime = null) => {
    const reference = currentTime ? new Date(currentTime) : now();
    return diffInHours(estimatedArrival, reference);
};

module.exports = {
    nowUTC,
    now,
    diffInHours,
    diffInDays,
    diffInMinutes,
    addHours,
    addDays,
    addMs,
    isOlderThanDays,
    isPast,
    toISO,
    calculateETADeviation,
};
