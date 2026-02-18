// FILE: src/repositories/riskScoreRepository.js
// SPEC REFERENCE: Section 5 - RiskScore Schema, Section 10 - Risk Scoring Models

const RiskScore = require('../models/RiskScore');

/**
 * Get latest risk score for an entity
 */
const getByEntityId = async (entityId, entityType, organizationId) => {
    return RiskScore.findOne({ entityId, entityType, organizationId })
        .sort({ evaluatedAt: -1 })
        .lean();
};

/**
 * Get risk scores for multiple entities (for dashboard aggregation)
 */
const getByEntityIds = async (entityIds, entityType, organizationId) => {
    // Get the latest score for each entity using aggregation
    return RiskScore.aggregate([
        { $match: { entityId: { $in: entityIds }, entityType, organizationId: organizationId } },
        { $sort: { evaluatedAt: -1 } },
        { $group: { _id: '$entityId', doc: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$doc' } },
    ]);
};

/**
 * Get score history for an entity
 */
const getHistory = async (entityId, entityType, organizationId, limit = 30) => {
    return RiskScore.find({ entityId, entityType, organizationId })
        .sort({ evaluatedAt: -1 })
        .limit(limit)
        .lean();
};

/**
 * Get all entities at a specific risk tier for an org
 */
const getByRiskTier = async (organizationId, entityType, riskTier) => {
    return RiskScore.find({ organizationId, entityType, riskTier })
        .sort({ overallScore: -1 })
        .lean();
};

/**
 * Upsert risk score: update existing or create new
 * Spec §10: Agent creates/updates RiskScore document after each evaluation
 */
const upsertScore = async (organizationId, entityId, entityType, scoreData) => {
    const existing = await RiskScore.findOne({ entityId, entityType, organizationId })
        .sort({ evaluatedAt: -1 });

    if (existing) {
        // Preserve previous score for history
        scoreData.previousScore = existing.overallScore;
        return RiskScore.findByIdAndUpdate(
            existing._id,
            { $set: scoreData },
            { new: true, runValidators: true }
        );
    } else {
        const riskScore = new RiskScore({ organizationId, entityId, entityType, ...scoreData });
        return riskScore.save();
    }
};

/**
 * Get risk tier distribution for dashboard widget
 */
const getRiskTierDistribution = async (organizationId, entityType) => {
    return RiskScore.aggregate([
        {
            $match: { organizationId, entityType },
        },
        {
            $sort: { evaluatedAt: -1 },
        },
        {
            $group: {
                _id: '$entityId',
                riskTier: { $first: '$riskTier' },
                overallScore: { $first: '$overallScore' },
            },
        },
        {
            $group: {
                _id: '$riskTier',
                count: { $sum: 1 },
            },
        },
    ]);
};

module.exports = {
    getByEntityId,
    getByEntityIds,
    getHistory,
    getByRiskTier,
    upsertScore,
    getRiskTierDistribution,
};
