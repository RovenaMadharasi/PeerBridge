const Session = require("../models/Session");
const Quiz = require("../models/Quiz");

// =========================
// CREATE SESSION (Senior only)
// =========================
exports.createSession = async (req, res) => {
    try {
        const {
            title, description, category, subject, topic, difficulty,
            startsAt, date, startTime, endTime, meetingPlatform, meetingLink,
            maxSeats, maxStudents, tags
        } = req.body;

        if (!title || !subject || !meetingLink || (!maxSeats && !maxStudents)) {
            return res.status(400).json({
                message: "Please fill in all required fields: title, subject, meetingLink, maxSeats."
            });
        }

        // Validate startsAt date
        let sessionStartsAt = startsAt ? new Date(startsAt) : null;
        if (!sessionStartsAt && date) {
            sessionStartsAt = new Date(date);
        }
        if (!sessionStartsAt || isNaN(sessionStartsAt.getTime())) {
            return res.status(400).json({
                message: "Valid start date and time (startsAt) is required."
            });
        }

        if (sessionStartsAt <= new Date()) {
            return res.status(400).json({
                message: "Session start time must be in the future."
            });
        }

        // Validate meetingLink format
        if (!/^https?:\/\/.+/i.test(meetingLink.trim())) {
            return res.status(400).json({
                message: "Meeting link must be a valid URL starting with http:// or https://"
            });
        }

        const seats = Number(maxSeats || maxStudents);
        if (isNaN(seats) || seats < 1) {
            return res.status(400).json({
                message: "Maximum seats must be a number greater than or equal to 1."
            });
        }

        const session = await Session.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            category: category || "Academic",
            subject: subject.trim(),
            topic: topic ? topic.trim() : "",
            difficulty: difficulty || "Beginner",
            startsAt: sessionStartsAt,
            date: sessionStartsAt,
            startTime: startTime || "",
            endTime: endTime || "",
            meetingPlatform: meetingPlatform || "Google Meet",
            meetingLink: meetingLink.trim(),
            maxSeats: seats,
            maxStudents: seats,
            tags: Array.isArray(tags) ? tags : [],
            mentorId: req.user._id
        });

        res.status(201).json({
            message: "Session created successfully",
            session
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// GET SESSIONS (Browse & Filter - SESS-F3, F4, N2)
// =========================
exports.getSessions = async (req, res) => {
    try {
        const { category, subject, difficulty, search, status, page = 1, limit = 20 } = req.query;

        const filter = {};

        // Filter upcoming vs past
        const now = new Date();
        if (status === "past") {
            filter.startsAt = { $lte: now };
        } else if (status === "all") {
            // no time restriction
        } else {
            // default to upcoming
            filter.startsAt = { $gt: now };
        }

        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (subject) filter.subject = new RegExp(subject, "i");
        if (search) {
            filter.$or = [
                { title: new RegExp(search, "i") },
                { subject: new RegExp(search, "i") },
                { description: new RegExp(search, "i") }
            ];
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        const total = await Session.countDocuments(filter);

        const sessions = await Session.find(filter)
            .populate("mentorId", "name college avgRating ratingCount photo photoUrl year role")
            .sort({ startsAt: status === "past" ? -1 : 1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            sessions,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET MY SESSIONS (Registered for juniors, Created for seniors)
// =========================
exports.getMySessions = async (req, res) => {
    try {
        const createdSessions = await Session.find({ mentorId: req.user._id })
            .populate("mentorId", "name college avgRating ratingCount photo photoUrl")
            .sort({ startsAt: 1 });

        const registeredSessions = await Session.find({ registeredStudents: req.user._id })
            .populate("mentorId", "name college avgRating ratingCount photo photoUrl")
            .sort({ startsAt: 1 });

        res.json({
            createdSessions,
            registeredSessions,
            sessions: req.user.role === "senior" ? createdSessions : registeredSessions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET SESSION DETAILS BY ID
// =========================
exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate("mentorId", "name college bio skills avgRating ratingCount photo photoUrl year role");

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Check if quiz exists for session
        const quiz = await Quiz.findOne({ sessionId: session._id });

        const isMentor = session.mentorId._id.toString() === req.user._id.toString();
        const isRegistered = session.registeredStudents.some(
            (id) => id.toString() === req.user._id.toString()
        );

        res.json({
            session,
            isMentor,
            isRegistered,
            quiz: quiz ? {
                _id: quiz._id,
                title: quiz.title,
                timeLimitMin: quiz.timeLimitMin,
                totalMarks: quiz.totalMarks,
                isPublished: quiz.isPublished,
                questionCount: quiz.questions ? quiz.questions.length : 0
            } : null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// ATOMIC SEAT REGISTRATION (SESS-F5 to F8, N1, D4, 3.5.2)
// =========================
exports.registerForSession = async (req, res) => {
    try {
        const sessionId = req.params.id;
        const userId = req.user._id;
        const now = new Date();

        // 3.5.2 Seat Registration (atomic update in single MongoDB operation)
        const updated = await Session.findOneAndUpdate(
            {
                _id: sessionId,
                mentorId: { $ne: userId },                  // no self registration
                registeredStudents: { $ne: userId },       // no duplicate registration
                startsAt: { $gt: now },                    // session not started
                $expr: {
                    $lt: [{ $size: "$registeredStudents" }, "$maxSeats"] // seat free
                }
            },
            { $addToSet: { registeredStudents: userId } },
            { returnDocument: "after" }
        ).populate("mentorId", "name college");

        if (updated) {
            const seatsLeft = Math.max(0, updated.maxSeats - updated.registeredStudents.length);
            return res.json({
                message: "Registered successfully for session",
                session: updated,
                seatsLeft
            });
        }

        // If atomic update failed, inspect session to return precise error code (LLD 3.5.2)
        const existingSession = await Session.findById(sessionId);

        if (!existingSession) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (existingSession.mentorId.toString() === userId.toString()) {
            return res.status(400).json({ message: "You cannot register for your own session" });
        }

        if (existingSession.registeredStudents.some((id) => id.toString() === userId.toString())) {
            return res.status(409).json({ message: "You are already registered for this session" });
        }

        if (existingSession.startsAt <= now) {
            return res.status(400).json({ message: "Cannot register for a session that has already started or passed" });
        }

        if (existingSession.registeredStudents.length >= existingSession.maxSeats) {
            return res.status(409).json({ message: "Session is full. No seats available." });
        }

        return res.status(400).json({ message: "Registration failed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET REGISTERED STUDENTS FOR SESSION (Owner mentor only)
// =========================
exports.getRegisteredStudents = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate("registeredStudents", "name email college year points badge photo photoUrl");

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only view students of your own sessions" });
        }

        res.json({
            sessionTitle: session.title,
            maxSeats: session.maxSeats,
            registeredCount: session.registeredStudents.length,
            students: session.registeredStudents
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// UPDATE SESSION (Owner mentor only)
// =========================
exports.updateSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only edit your own sessions" });
        }

        const allowedFields = [
            "title", "description", "category", "subject", "topic", "difficulty",
            "startsAt", "date", "startTime", "endTime", "meetingPlatform", "meetingLink",
            "maxSeats", "maxStudents", "tags", "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) session[field] = req.body[field];
        });

        if (req.body.startsAt) {
            session.startsAt = new Date(req.body.startsAt);
            session.date = session.startsAt;
        }

        if (req.body.maxSeats || req.body.maxStudents) {
            const newSeats = Number(req.body.maxSeats || req.body.maxStudents);
            session.maxSeats = newSeats;
            session.maxStudents = newSeats;
        }

        await session.save();

        res.json({ message: "Session updated successfully", session });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// DELETE SESSION (Owner mentor only)
// =========================
exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own sessions" });
        }

        await Quiz.deleteMany({ sessionId: session._id });
        await session.deleteOne();

        res.json({ message: "Session deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};