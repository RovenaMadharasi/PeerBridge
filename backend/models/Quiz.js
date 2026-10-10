const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (opts) {
                return Array.isArray(opts) && opts.length >= 2 && opts.length <= 6;
            },
            message: "A question must have between 2 and 6 options."
        }
    },
    correctIndex: {
        type: Number,
        required: true,
        min: 0
    },
    marks: {
        type: Number,
        default: 1,
        min: 1
    },
    explanation: {
        type: String,
        default: "",
        trim: true
    }
});

const quizSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true,
            unique: true // One quiz per session (LLD 3.3)
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        timeLimitMin: {
            type: Number,
            required: true,
            default: 15,
            min: 1
        },
        questions: {
            type: [questionSchema],
            required: true,
            validate: {
                validator: function (qs) {
                    return Array.isArray(qs) && qs.length > 0;
                },
                message: "Quiz must contain at least one question."
            }
        },
        totalMarks: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Calculate totalMarks before saving
quizSchema.pre("save", function () {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }
});

module.exports = mongoose.model("Quiz", quizSchema);