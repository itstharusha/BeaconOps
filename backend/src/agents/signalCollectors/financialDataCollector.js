// FILE: src/agents/signalCollectors/financialDataCollector.js
// SPEC REFERENCE: Section 9 - Signal Collectors
// Mocks fetching supplier financial health data

const supplierRepository = require('../../repositories/supplierRepository');
const { logger } = require('../../utils/logger');

/**
 * Fetch financial data for suppliers
 */
const collectFinancialData = async (organizationId) => {
    try {
        const suppliers = await supplierRepository.findAll(organizationId);
        let updatedCount = 0;

        for (const supplier of suppliers.data) {
            // Mock: Randomly fluctuate financial stability score
            const shouldUpdate = Math.random() > 0.95; // Rare update

            if (shouldUpdate) {
                const newScore = Math.floor(Math.random() * 40) + 60; // 60-100

                await supplierRepository.update(supplier._id, organizationId, {
                    financialStabilityScore: newScore
                });
                updatedCount++;
            }
        }

        return updatedCount;
    } catch (error) {
        logger.error('Financial collector failed', { error: error.message, organizationId });
        return 0;
    }
};

module.exports = { collectFinancialData };
