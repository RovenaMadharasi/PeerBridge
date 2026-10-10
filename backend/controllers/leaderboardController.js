const User = require("../models/User");

// =========================
// STUDENT LEADERBOARD (LEAD-F1, F2, F3, N2, 3.5.6)
// Ranked by points (descending), then createdAt (ascending)
// =========================
exports.getStudentLeaderboard = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || 1));
        const limit = Math.max(1, parseInt(req.query.limit || 20));
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();

        const students = await User.find()
            .select("name college year role points badge photo photoUrl createdAt")
            .sort({ points: -1, createdAt: 1 })
            .skip(skip)
            .limit(limit);

        // Add rank number to each entry (handles ties if needed)
        const rankedStudents = students.map((s, index) => ({
            rank: skip + index + 1,
            _id: s._id,
            name: s.name,
            college: s.college,
            year: s.year,
            role: s.role,
            points: s.points || 0,
            badge: s.badge || "Newcomer",
            photo: s.photo || s.photoUrl || ""
        }));

        res.json({
            leaderboard: rankedStudents,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// MENTOR LEADERBOARD (LEAD-F4, D9, 3.5.6)
// Seniors with 3 or more ratings, sorted by avgRating (descending), ratingCount (descending)
// =========================
exports.getMentorLeaderboard = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || 1));
        const limit = Math.max(1, parseInt(req.query.limit || 20));
        const skip = (page - 1) * limit;

        // D9: Mentor leaderboard lists only mentors with at least 3 ratings (ratingCount >= 3)
        const filter = {
            role: "senior",
            $or: [
                { ratingCount: { $gte: 3 } },
                { totalRatings: { $gte: 3 } }
            ]
        };

        const total = await User.countDocuments(filter);

        const mentors = await User.find(filter)
            .select("name college year role avgRating ratingCount averageRating totalRatings photo photoUrl bio skills")
            .sort({ avgRating: -1, ratingCount: -1 })
            .skip(skip)
            .limit(limit);

        const rankedMentors = mentors.map((m, index) => ({
            rank: skip + index + 1,
            _id: m._id,
            name: m.name,
            college: m.college,
            year: m.year,
            avgRating: m.avgRating || m.averageRating || 0,
            ratingCount: m.ratingCount || m.totalRatings || 0,
            photo: m.photo || m.photoUrl || "",
            skills: m.skills || []
        }));

        res.json({
            leaderboard: rankedMentors,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// MY RANK & POSITION (LEAD-F6, 3.5.6)
// =========================
exports.getMyRank = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Student Rank: Count users with strictly higher points + 1 (LLD 3.5.6)
        const studentRank = (await User.countDocuments({ points: { $gt: user.points } })) + 1;
        const totalStudents = await User.countDocuments();

        // Mentor Rank if senior with >= 3 ratings
        let mentorRank = null;
        let totalMentors = 0;
        const userRatings = user.ratingCount || user.totalRatings || 0;
        const userAvg = user.avgRating || user.averageRating || 0;

        if (user.role === "senior" && userRatings >= 3) {
            totalMentors = await User.countDocuments({
                role: "senior",
                $or: [{ ratingCount: { $gte: 3 } }, { totalRatings: { $gte: 3 } }]
            });

            const higherMentors = await User.countDocuments({
                role: "senior",
                $or: [{ ratingCount: { $gte: 3 } }, { totalRatings: { $gte: 3 } }],
                $or: [
                    { avgRating: { $gt: userAvg } },
                    { avgRating: userAvg, ratingCount: { $gt: userRatings } }
                ]
            });

            mentorRank = higherMentors + 1;
        }

        res.json({
            userId: user._id,
            name: user.name,
            points: user.points || 0,
            badge: user.badge || "Newcomer",
            studentRank,
            totalStudents,
            mentorRank,
            totalMentors,
            avgRating: userAvg,
            ratingCount: userRatings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
