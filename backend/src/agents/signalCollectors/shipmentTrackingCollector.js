// FILE: src/agents/signalCollectors/shipmentTrackingCollector.js
// SPEC REFERENCE: Section 9 - Signal Collectors
// Mocks fetching carrier tracking updates

const shipmentRepository = require('../../repositories/shipmentRepository');
const { logger } = require('../../utils/logger');
const { SHIPMENT_STATUSES } = require('../../utils/constants');

/**
 * Fetch carrier tracking updates
 */
const collectTrackingData = async (organizationId) => {
    try {
        const activeShipments = await shipmentRepository.findActive(organizationId);
        let updatedCount = 0;

        for (const shipment of activeShipments) {
            // Mock: Simulate movement or delay
            // In real app: Call Carrier API (FedEx, DHL, etc.)

            const shouldUpdate = Math.random() > 0.8; // 20% chance of new event

            if (shouldUpdate) {
                const event = {
                    status: shipment.status, // Status might not change
                    location: `Location_${Math.floor(Math.random() * 100)}`,
                    description: 'In transit to next facility',
                    timestamp: new Date(),
                    source: 'CarrierAPI'
                };

                // Simulate random delay
                if (Math.random() > 0.9 && shipment.status === SHIPMENT_STATUSES.IN_TRANSIT) {
                    // We won't change status here, the Risk Agent will detect the ETA deviation
                    // But we might push an event saying "Delay at hub"
                    event.status = SHIPMENT_STATUSES.DELAYED;
                    event.description = 'Delay at sorting hub due to volume';

                    // Update shipment status directly? Or let the agent do it? 
                    // Usually collector updates raw data.
                    await shipmentRepository.updateStatus(shipment._id, organizationId, SHIPMENT_STATUSES.DELAYED);
                }

                await shipmentRepository.addTrackingEvent(shipment._id, organizationId, event);
                updatedCount++;
            }
        }

        // logger.info(`Tracking collector updated ${updatedCount} shipments for org ${organizationId}`);
        return updatedCount;
    } catch (error) {
        logger.error('Tracking collector failed', { error: error.message, organizationId });
        return 0;
    }
};

module.exports = { collectTrackingData };
