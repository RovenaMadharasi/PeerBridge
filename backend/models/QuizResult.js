const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answers: {
      type: [Number],
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);