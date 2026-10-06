const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        subjectKnowledge: { type: Number, required: true, min: 1, max: 5 },
        explanationQuality: { type: Number, required: true, min: 1, max: 5 },
        communication: { type: Number, required: true, min: 1, max: 5 },
        usefulness: { type: Number, required: true, min: 1, max: 5 },
        overallRating: { type: Number, required: true, min: 1, max: 5 },

        feedback: { type: String, default: "", trim: true }
    },
    { timestamps: true }
);

// one rating per student per session — prevents duplicate ratings at the database level
ratingSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);