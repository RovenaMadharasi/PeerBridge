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
        overall: { type: Number, required: true, min: 1, max: 5 },
        overallRating: { type: Number, min: 1, max: 5 }, // Alias

        feedback: { type: String, default: "", maxlength: 500, trim: true }
    },
    { timestamps: true }
);

ratingSchema.pre("save", function () {
    if (this.overall && !this.overallRating) {
        this.overallRating = this.overall;
    } else if (this.overallRating && !this.overall) {
        this.overall = this.overallRating;
    }
});

// One rating per student per session (LLD 3.3)
ratingSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);