const Rating = require("../models/Rating");
const Session = require("../models/Session");
const User = require("../models/User");
const PointsService = require("../services/PointsService");
const { POINTS_RULES } = require("../config/pointsConfig");

// =========================
// SUBMIT MENTOR RATING (RATE-F1 to F7, D10, 3.5.5)
// =========================
exports.createRating = async (req, res) => {
    try {
        const {
            sessionId,
            subjectKnowledge,
            explanationQuality,
            communication,
            usefulness,
            overall,
            overallRating,
            feedback
        } = req.body;

        const session_id = sessionId || req.params.sessionId || req.params.id;
        const scoreOverall = Number(overall || overallRating);
        const scoreSub = Number(subjectKnowledge);
        const scoreExp = Number(explanationQuality);
        const scoreComm = Number(communication);
        const scoreUse = Number(usefulness);

        if (!session_id || !scoreSub || !scoreExp || !scoreComm || !scoreUse || !scoreOverall) {
            return res.status(400).json({
                message: "Please provide sessionId and all 5 rating metrics (1 to 5 stars)."
            });
        }

        const session = await Session.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        const now = new Date();
        // RATE-F1, N3, D10: Rating opens when the session start time has passed
        if (new Date(session.startsAt) > now) {
            return res.status(400).json({
                message: "Rating opens only after the session start time has passed."
            });
        }

        // Student registration check
        const isRegistered = session.registeredStudents.some(
            (id) => id.toString() === req.user._id.toString()
        );
        if (!isRegistered) {
            return res.status(403).json({ message: "You can only rate sessions you registered for." });
        }

        // RATE-F4: No self rating
        if (session.mentorId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot rate your own session." });
        }

        // Check duplicate rating (RATE-F3)
        const existing = await Rating.findOne({ sessionId: session._id, studentId: req.user._id });
        if (existing) {
            return res.status(409).json({ message: "You have already rated this mentor for this session." });
        }

        const rating = await Rating.create({
            sessionId: session._id,
            mentorId: session.mentorId,
            studentId: req.user._id,
            subjectKnowledge: scoreSub,
            explanationQuality: scoreExp,
            communication: scoreComm,
            usefulness: scoreUse,
            overall: scoreOverall,
            overallRating: scoreOverall,
            feedback: feedback ? String(feedback).trim() : ""
        });

        // 3.5.5 Recompute Mentor Average using MongoDB aggregation
        const agg = await Rating.aggregate([
            { $match: { mentorId: session.mentorId } },
            {
                $group: {
                    _id: null,
                    avg: { $avg: "$overall" },
                    n: { $sum: 1 }
                }
            }
        ]);

        if (agg && agg.length > 0) {
            const roundedAvg = Math.round(agg[0].avg * 100) / 100; // round to 2 decimals (LLD 3.5.5)
            const count = agg[0].n;

            await User.findByIdAndUpdate(session.mentorId, {
                avgRating: roundedAvg,
                ratingCount: count,
                averageRating: roundedAvg,
                totalRatings: count
            });
        }

        // Award RATING_GIVEN (+2 pts) and SESSION_ATTENDED (+5 pts if not already awarded)
        await PointsService.award(req.user._id, "RATING_GIVEN", session._id, POINTS_RULES.RATING_GIVEN, "Session");
        await PointsService.award(req.user._id, "SESSION_ATTENDED", session._id, POINTS_RULES.SESSION_ATTENDED, "Session");

        res.status(201).json({
            message: "Rating submitted successfully",
            rating
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "You have already rated this session." });
        }
        res.status(400).json({ message: err.message });
    }
};

// =========================
// GET MENTOR RATINGS HISTORY & AVERAGE BREAKDOWN
// =========================
exports.getMentorRatings = async (req, res) => {
    try {
        const mentorId = req.params.mentorId || req.params.id;
        const mentor = await User.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found." });
        }

        const ratings = await Rating.find({ mentorId })
            .populate("studentId", "name college year photo photoUrl")
            .populate("sessionId", "title subject category startsAt")
            .sort({ createdAt: -1 });

        // Calculate detailed breakdown
        let subSum = 0, expSum = 0, commSum = 0, useSum = 0, overallSum = 0;
        ratings.forEach((r) => {
            subSum += r.subjectKnowledge || 0;
            expSum += r.explanationQuality || 0;
            commSum += r.communication || 0;
            useSum += r.usefulness || 0;
            overallSum += r.overall || r.overallRating || 0;
        });

        const total = ratings.length;
        const breakdown = total > 0 ? {
            subjectKnowledge: Math.round((subSum / total) * 10) / 10,
            explanationQuality: Math.round((expSum / total) * 10) / 10,
            communication: Math.round((commSum / total) * 10) / 10,
            usefulness: Math.round((useSum / total) * 10) / 10,
            overall: Math.round((overallSum / total) * 10) / 10
        } : null;

        res.json({
            mentor: {
                id: mentor._id,
                name: mentor.name,
                college: mentor.college,
                avgRating: mentor.avgRating || mentor.averageRating || 0,
                ratingCount: mentor.ratingCount || mentor.totalRatings || 0
            },
            breakdown,
            ratings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};