const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PointsService = require("../services/PointsService");
const { getNextBadgeThreshold } = require("../config/pointsConfig");

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_key_12345", {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
    });
};

// Formats user object for API responses safely (omits password)
const formatUser = (user) => ({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college,
    year: user.year,
    bio: user.bio || "",
    skills: user.skills || [],
    photo: user.photo || user.photoUrl || "",
    photoUrl: user.photoUrl || user.photo || "",
    socialLinks: user.socialLinks || { github: "", linkedin: "", twitter: "" },
    points: user.points || 0,
    badge: user.badge || "Newcomer",
    avgRating: user.avgRating || user.averageRating || 0,
    ratingCount: user.ratingCount || user.totalRatings || 0,
    createdAt: user.createdAt
});

// =========================
// REGISTER USER (AUTH-F1, F2, F3, D1)
// Role is set by server from year (1-2 => junior, 3-4 => senior). Request body role is ignored.
// =========================
exports.signup = async (req, res) => {
    try {
        const { name, email, password, college, year } = req.body;

        if (!name || !email || !password || !college || year === undefined) {
            return res.status(400).json({
                message: "Please provide all required fields: name, email, password, college, and year."
            });
        }

        // Restrict registration to SSN institutional email addresses only
        if (!email.toLowerCase().trim().endsWith("@ssn.edu.in")) {
            return res.status(400).json({
                message: "Only SSN institutional email addresses (@ssn.edu.in) are allowed to register."
            });
        }

        const parsedYear = Number(year);
        if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
            return res.status(400).json({
                message: "Year of study must be a number between 1 and 4."
            });
        }

        // D1: Role is set by the server from the year of study (1-2 junior, 3-4 senior)
        const computedRole = parsedYear <= 2 ? "junior" : "senior";

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: computedRole,
            college: college.trim(),
            year: parsedYear
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: formatUser(user)
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// LOGIN USER (AUTH-F4, F5, AUTH-N3)
// =========================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        // Safe login error (AUTH-N3): same message for wrong email or wrong password
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.json({
            message: "Login successful",
            token,
            user: formatUser(user)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET LOGGED-IN USER PROFILE (GET /api/users/me or /api/auth/me)
// =========================
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Compute rank
        const studentRank = (await User.countDocuments({ points: { $gt: user.points } })) + 1;
        const progress = getNextBadgeThreshold(user.points);

        const transactions = await PointsService.getUserTransactions(user._id);

        res.json({
            user: formatUser(user),
            rank: studentRank,
            badgeProgress: progress,
            transactions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// UPDATE USER PROFILE (PUT /api/users/me or /api/auth/profile)
// =========================
exports.updateProfile = async (req, res) => {
    try {
        const { bio, skills, photo, photoUrl, socialLinks } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined) {
            user.skills = Array.isArray(skills)
                ? skills
                : typeof skills === "string"
                ? skills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
        }
        if (photo !== undefined) user.photo = photo;
        if (photoUrl !== undefined) user.photoUrl = photoUrl;
        if (socialLinks !== undefined && typeof socialLinks === "object") {
            user.socialLinks = { ...user.socialLinks, ...socialLinks };
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: formatUser(user)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET PUBLIC USER PROFILE (GET /api/users/:id)
// =========================
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const studentRank = (await User.countDocuments({ points: { $gt: user.points } })) + 1;

        res.json({
            user: formatUser(user),
            rank: studentRank
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};