// FILE: src/utils/mathHelpers.js
// Utility for random numbers etc.

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = { getRandomInt };
