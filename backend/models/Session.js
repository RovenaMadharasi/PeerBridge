const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },

        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        category: {
            type: String,
            enum: ["Academic", "Career Preparation"],
            required: true
        },

        subject: { type: String, required: true, trim: true },
        topic: { type: String, default: "", trim: true },

        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },

        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },

        meetingPlatform: {
            type: String,
            enum: ["Google Meet", "Zoom", "Microsoft Teams", "Other"],
            default: "Google Meet"
        },
        meetingLink: { type: String, required: true },

        maxStudents: { type: Number, required: true, min: 1 },

        registeredStudents: [
            {
                student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                registeredAt: { type: Date, default: Date.now }
            }
        ],

        tags: { type: [String], default: [] },

        status: {
            type: String,
            enum: ["upcoming", "completed", "cancelled"],
            default: "upcoming"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);