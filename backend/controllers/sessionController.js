const Session = require("../models/Session");

exports.createSession = async (req, res) => {
    try {
        const {
            title, description, category, subject, topic, difficulty,
            date, startTime, endTime, meetingPlatform, meetingLink,
            maxStudents, tags
        } = req.body;

        if (!title || !category || !subject || !date || !startTime || !endTime || !meetingLink || !maxStudents) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        const session = await Session.create({
            title, description, category, subject, topic, difficulty,
            date, startTime, endTime, meetingPlatform, meetingLink,
            maxStudents, tags,
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

exports.getSessions = async (req, res) => {
    try {
        const { category, subject, difficulty, search } = req.query;

        const filter = { status: "upcoming" };

        if (category) filter.category = category;
        if (subject) filter.subject = new RegExp(subject, "i");
        if (difficulty) filter.difficulty = difficulty;
        if (search) filter.title = new RegExp(search, "i");

        const sessions = await Session.find(filter)
            .populate("mentorId", "name college")
            .sort({ date: 1 });

        res.json({ sessions });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMySessions = async (req, res) => {
    try {
        if (req.user.role === "senior") {
            const sessions = await Session.find({ mentorId: req.user._id }).sort({ date: 1 });
            return res.json({ sessions });
        }

        const sessions = await Session.find({ "registeredStudents.student": req.user._id })
            .populate("mentorId", "name college")
            .sort({ date: 1 });

        res.json({ sessions });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate("mentorId", "name college bio skills");

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        res.json({ session });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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
            "date", "startTime", "endTime", "meetingPlatform", "meetingLink",
            "maxStudents", "tags", "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) session[field] = req.body[field];
        });

        await session.save();

        res.json({ message: "Session updated successfully", session });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own sessions" });
        }

        await session.deleteOne();

        res.json({ message: "Session deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.registerForSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot register for your own session" });
        }

        const alreadyRegistered = session.registeredStudents.some(
            (entry) => entry.student.toString() === req.user._id.toString()
        );

        if (alreadyRegistered) {
            return res.status(409).json({ message: "You have already registered for this session" });
        }

        if (session.registeredStudents.length >= session.maxStudents) {
            return res.status(400).json({ message: "No seats available" });
        }

        session.registeredStudents.push({ student: req.user._id });
        await session.save();

        res.json({ message: "Registered successfully", session });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRegisteredStudents = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate("registeredStudents.student", "name college year");

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.mentorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only view students of your own sessions" });
        }

        res.json({ students: session.registeredStudents });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};