// Config file for points system and badge thresholds
// Reference: HLD and LLD Section 3.3 / Points Rules (OI-6)

const POINTS_RULES = {
    SESSION_ATTENDED: 5,
    QUIZ_COMPLETE_BASE: 10,
    RATING_GIVEN: 2,
    RESOURCE_SHARED: 3,
    MAX_RESOURCE_SHARES_PER_DAY: 3
};

const BADGE_RANGES = [
    { name: "Champion", minPoints: 300 },
    { name: "Achiever", minPoints: 150 },
    { name: "Learner", minPoints: 50 },
    { name: "Newcomer", minPoints: 0 }
];

const getBadgeForPoints = (points) => {
    const pts = Math.max(0, points || 0);
    const badgeObj = BADGE_RANGES.find((b) => pts >= b.minPoints);
    return badgeObj ? badgeObj.name : "Newcomer";
};

const getNextBadgeThreshold = (points) => {
    const pts = Math.max(0, points || 0);
    if (pts < 50) return { nextBadge: "Learner", targetPoints: 50, pointsNeeded: 50 - pts };
    if (pts < 150) return { nextBadge: "Achiever", targetPoints: 150, pointsNeeded: 150 - pts };
    if (pts < 300) return { nextBadge: "Champion", targetPoints: 300, pointsNeeded: 300 - pts };
    return { nextBadge: "Champion (Max)", targetPoints: 300, pointsNeeded: 0 };
};

module.exports = {
    POINTS_RULES,
    BADGE_RANGES,
    getBadgeForPoints,
    getNextBadgeThreshold
};
