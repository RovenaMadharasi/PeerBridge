const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, college, year } = req.body;

        if (!name || !email || !password || !role || !college || !year) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            college,
            year
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                year: user.year
            }
        });

    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                year: user.year
            }
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { bio, skills, photo } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (bio !== undefined) {
            user.bio = bio;
        }

        if (skills !== undefined) {
            user.skills = skills;
        }

        if (photo !== undefined) {
            user.photo = photo;
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                year: user.year,
                bio: user.bio,
                skills: user.skills,
                photo: user.photo,
                points: user.points
            }
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};