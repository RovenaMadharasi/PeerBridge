const Rating = require("../models/Rating");
const Session = require("../models/Session");
const User = require("../models/User");

exports.createRating = async (req, res) => {
    try {
        const { sessionId, subjectKnowledge, explanationQuality, communication, usefulness, overallRating, feedback } = req.body;

        if (!sessionId || !subjectKnowledge || !explanationQuality || !communication || !usefulness || !overallRating) {
            return res.status(400).json({
                message: "Please provide a sessionId and all five ratings"
            });
        }

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const isRegistered = session.registeredStudents.some(
            (entry) => entry.student.toString() === req.user._id.toString()
        );

        if (!isRegistered) {
            return res.status(403).json({ message: "You can only rate sessions you registered for" });
        }

        if (session.mentorId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot rate your own session" });
        }

        const existing = await Rating.findOne({ sessionId, studentId: req.user._id });

        if (existing) {
            return res.status(409).json({ message: "You have already rated this session" });
        }

        const rating = await Rating.create({
            sessionId,
            mentorId: session.mentorId,
            studentId: req.user._id,
            subjectKnowledge,
            explanationQuality,
            communication,
            usefulness,
            overallRating,
            feedback
        });

        // recalculate the mentor's average overall rating across all their sessions
        const mentorRatings = await Rating.find({ mentorId: session.mentorId });

        const average =
            mentorRatings.reduce((sum, r) => sum + r.overallRating, 0) / mentorRatings.length;

        await User.findByIdAndUpdate(session.mentorId, {
            averageRating: Math.round(average * 10) / 10,
            totalRatings: mentorRatings.length
        });

        res.status(201).json({ message: "Rating submitted successfully", rating });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "You have already rated this session" });
        }
        res.status(400).json({ message: err.message });
    }
};

exports.getMentorRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ mentorId: req.params.mentorId })
            .populate("studentId", "name college")
            .populate("sessionId", "title")
            .sort({ createdAt: -1 });

        res.json({ ratings });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};