const PointTransaction = require("../models/PointTransaction");
const User = require("../models/User");
const { getBadgeForPoints } = require("../config/pointsConfig");

class PointsService {
    /**
     * Award points to a user for an action, avoiding duplicate awards via PointTransaction unique index.
     * @param {string} userId - ID of the user receiving points
     * @param {string} action - 'SESSION_ATTENDED', 'QUIZ_COMPLETE', 'RATING_GIVEN', 'RESOURCE_SHARED'
     * @param {string} refId - ID of related Session, Quiz, or Resource
     * @param {number} points - Number of points to award
     * @param {string} [refType='System'] - Model type of refId ('Session', 'Quiz', 'Resource')
     * @returns {Promise<{ awarded: boolean, pointsAwarded: number, totalPoints: number, badge: string }>}
     */
    static async award(userId, action, refId, points, refType = "System") {
        try {
            if (!userId || !action || !refId || !points) {
                return { awarded: false, pointsAwarded: 0 };
            }

            // Attempt to create the audit transaction record
            await PointTransaction.create({
                userId,
                action,
                refType,
                refId,
                points
            });

            // If transaction succeeded (no duplicate key error), increment user points
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { points: points } },
                { returnDocument: "after" }
            );

            if (updatedUser) {
                const newBadge = getBadgeForPoints(updatedUser.points);
                if (updatedUser.badge !== newBadge) {
                    updatedUser.badge = newBadge;
                    await updatedUser.save();
                }

                return {
                    awarded: true,
                    pointsAwarded: points,
                    totalPoints: updatedUser.points,
                    badge: updatedUser.badge
                };
            }

            return { awarded: false, pointsAwarded: 0 };
        } catch (err) {
            // Duplicate key code 11000 means points were already awarded for this action+refId
            if (err.code === 11000) {
                const user = await User.findById(userId);
                return {
                    awarded: false,
                    alreadyAwarded: true,
                    pointsAwarded: 0,
                    totalPoints: user ? user.points : 0,
                    badge: user ? user.badge : "Newcomer"
                };
            }
            console.error("PointsService.award error:", err);
            return { awarded: false, pointsAwarded: 0 };
        }
    }

    /**
     * Get transaction log for a user
     */
    static async getUserTransactions(userId) {
        return PointTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
    }
}

module.exports = PointsService;
