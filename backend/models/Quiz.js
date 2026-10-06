const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: function (options) {
        return options.length >= 2;
      },
      message: "A question must have at least 2 options.",
    },
  },

  correctAnswer: {
    type: Number,
    required: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: function (questions) {
          return questions.length > 0;
        },
        message: "Quiz must contain at least one question.",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);