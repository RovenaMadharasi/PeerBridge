const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    questionIndex: {
        type: Number,
        required: true
    },
    questionId: {
        type: String
    },
    selectedIndex: {
        type: Number,
        required: true
    }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema(
    {
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        deadlineAt: {
            type: Date,
            required: true
        },
        answers: [answerSchema],
        status: {
            type: String,
            enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"],
            default: "IN_PROGRESS"
        },
        score: {
            type: Number,
            default: 0
        },
        totalMarks: {
            type: Number,
            default: 0
        },
        percent: {
            type: Number,
            default: 0
        },
        pointsAwarded: {
            type: Number,
            default: 0
        },
        submittedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index: one attempt per student per quiz (LLD 3.3 & 3.5.3)
quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
