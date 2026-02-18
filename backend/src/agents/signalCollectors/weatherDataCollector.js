// FILE: src/agents/signalCollectors/weatherDataCollector.js
// SPEC REFERENCE: Section 9 - Signal Collectors, Section 10 - Weather Risk
// Mocks fetching weather data for active shipment routes

const shipmentRepository = require('../../repositories/shipmentRepository');
const { getRandomInt } = require('../../utils/mathHelpers'); // Need to create this or just inline
const { logger } = require('../../utils/logger');

// Mock weather conditions
const WEATHER_CONDITIONS = ['Clear', 'Rain', 'Storm', 'Snow', 'fog', 'Hurricane'];
const RISK_LEVELS = ['low', 'medium', 'high', 'severe'];

/**
 * Fetch and update weather risk for active shipments
 * In production, this would call a real Weather API (details in agentConfig.js)
 */
const collectWeatherData = async (organizationId) => {
    try {
        const activeShipments = await shipmentRepository.findActive(organizationId);
        let updatedCount = 0;

        for (const shipment of activeShipments) {
            // Mock: Randomly update weather risk for demonstration/simulation
            // In real app: Fetch based on shipment.currentLocation or route
            const shouldUpdate = Math.random() > 0.7; // 30% chance to change

            if (shouldUpdate) {
                const condition = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
                let risk = 'low';

                if (['Storm', 'Snow'].includes(condition)) risk = 'medium';
                if (['Hurricane'].includes(condition)) risk = 'severe';
                if (['fog'].includes(condition)) risk = 'medium';

                await shipmentRepository.update(shipment._id, organizationId, {
                    weatherRisk: risk,
                    // 'metadata.weatherCondition': condition 
                });
                updatedCount++;
            }
        }

        // logger.info(`Weather collector updated ${updatedCount} shipments for org ${organizationId}`);
        return updatedCount;
    } catch (error) {
        logger.error('Weather collector failed', { error: error.message, organizationId });
        return 0;
    }
};

module.exports = { collectWeatherData };
