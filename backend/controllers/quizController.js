const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const Session = require("../models/Session");

// Check whether the logged-in user is the mentor who owns the session
const isSessionMentor = (session, userId) => {
    return session.mentorId.toString() === userId.toString();
};

// Check whether the logged-in user is registered for the session
const isRegisteredStudent = (session, userId) => {
    return session.registeredStudents.some(
        (entry) => entry.student.toString() === userId.toString()
    );
};

// Hide correct answers before sending a quiz to a junior
const sanitizeQuiz = (quiz) => {
    return {
        _id: quiz._id,
        session: quiz.session,
        title: quiz.title,
        questions: quiz.questions.map((question) => ({
            _id: question._id,
            question: question.question,
            options: question.options
        })),
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt
    };
};

// Validate quiz questions
const validateQuestions = (questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return "Quiz must contain at least one question.";
    }

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (
            !question.question ||
            typeof question.question !== "string" ||
            !question.question.trim()
        ) {
            return `Question ${i + 1} must have text.`;
        }

        if (!Array.isArray(question.options) || question.options.length < 2) {
            return `Question ${i + 1} must have at least 2 options.`;
        }

        if (
            !Number.isInteger(question.correctAnswer) ||
            question.correctAnswer < 0 ||
            question.correctAnswer >= question.options.length
        ) {
            return `Question ${i + 1} has an invalid correct answer.`;
        }
    }

    return null;
};


// =========================
// CREATE QUIZ
// Senior only
// =========================
exports.createQuiz = async (req, res) => {
    try {
        const { session: sessionId, title, questions } = req.body;

        if (!sessionId || !title || !questions) {
            return res.status(400).json({
                message: "Session, title and questions are required."
            });
        }

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (!isSessionMentor(session, req.user._id)) {
            return res.status(403).json({
                message: "You can only create a quiz for your own session."
            });
        }

        // One quiz per session
        const existingQuiz = await Quiz.findOne({ session: sessionId });

        if (existingQuiz) {
            return res.status(409).json({
                message: "A quiz already exists for this session."
            });
        }

        const validationError = validateQuestions(questions);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const quiz = await Quiz.create({
            session: sessionId,
            title: title.trim(),
            questions
        });

        res.status(201).json({
            message: "Quiz created successfully.",
            quiz
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// GET QUIZ BY SESSION
// Junior gets sanitized version
// Senior owner gets full version
// =========================
exports.getQuizForSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        const quiz = await Quiz.findOne({
            session: req.params.sessionId
        });

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found for this session."
            });
        }

        // Senior mentor can view the complete quiz
        if (req.user.role === "senior") {
            if (!isSessionMentor(session, req.user._id)) {
                return res.status(403).json({
                    message: "You can only view quizzes for your own sessions."
                });
            }

            return res.json({ quiz });
        }

        // Junior must be registered
        if (!isRegisteredStudent(session, req.user._id)) {
            return res.status(403).json({
                message: "You must be registered for this session to take the quiz."
            });
        }

        res.json({
            quiz: sanitizeQuiz(quiz)
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// GET QUIZ BY ID
// =========================
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const session = await Session.findById(quiz.session);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (req.user.role === "senior") {
            if (!isSessionMentor(session, req.user._id)) {
                return res.status(403).json({
                    message: "You can only view quizzes for your own sessions."
                });
            }

            return res.json({ quiz });
        }

        if (!isRegisteredStudent(session, req.user._id)) {
            return res.status(403).json({
                message: "You must be registered for this session to take the quiz."
            });
        }

        res.json({
            quiz: sanitizeQuiz(quiz)
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// UPDATE QUIZ
// Senior only
// =========================
exports.updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const session = await Session.findById(quiz.session);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (!isSessionMentor(session, req.user._id)) {
            return res.status(403).json({
                message: "You can only edit quizzes for your own sessions."
            });
        }

        const { title, questions } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Quiz title cannot be empty."
                });
            }

            quiz.title = title.trim();
        }

        if (questions !== undefined) {
            const validationError = validateQuestions(questions);

            if (validationError) {
                return res.status(400).json({
                    message: validationError
                });
            }

            quiz.questions = questions;
        }

        await quiz.save();

        res.json({
            message: "Quiz updated successfully.",
            quiz
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// DELETE QUIZ
// Senior only
// =========================
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const session = await Session.findById(quiz.session);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (!isSessionMentor(session, req.user._id)) {
            return res.status(403).json({
                message: "You can only delete quizzes for your own sessions."
            });
        }

        // Remove old results as well
        await QuizResult.deleteMany({
            quiz: quiz._id
        });

        await quiz.deleteOne();

        res.json({
            message: "Quiz deleted successfully."
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// SUBMIT QUIZ
// Junior only
// =========================
exports.submitQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const session = await Session.findById(quiz.session);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (!isRegisteredStudent(session, req.user._id)) {
            return res.status(403).json({
                message: "You must be registered for this session to submit the quiz."
            });
        }

        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                message: "Answers must be an array."
            });
        }

        if (answers.length !== quiz.questions.length) {
            return res.status(400).json({
                message: "Please answer all questions."
            });
        }

        // Validate every answer
        for (let i = 0; i < answers.length; i++) {
            if (
                !Number.isInteger(answers[i]) ||
                answers[i] < 0 ||
                answers[i] >= quiz.questions[i].options.length
            ) {
                return res.status(400).json({
                    message: `Invalid answer for question ${i + 1}.`
                });
            }
        }

        // Prevent multiple submissions
        const existingResult = await QuizResult.findOne({
            quiz: quiz._id,
            student: req.user._id
        });

        if (existingResult) {
            return res.status(409).json({
                message: "You have already submitted this quiz."
            });
        }

        let score = 0;

        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                score++;
            }
        });

        const result = await QuizResult.create({
            quiz: quiz._id,
            student: req.user._id,
            answers,
            score,
            totalQuestions: quiz.questions.length
        });

        res.status(201).json({
            message: "Quiz submitted successfully.",
            result: {
                _id: result._id,
                quiz: result.quiz,
                score: result.score,
                totalQuestions: result.totalQuestions,
                percentage: Math.round(
                    (result.score / result.totalQuestions) * 100
                ),
                submittedAt: result.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// GET MY RESULT
// Junior only
// =========================
exports.getMyResult = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const result = await QuizResult.findOne({
            quiz: quiz._id,
            student: req.user._id
        });

        if (!result) {
            return res.status(404).json({
                message: "You have not submitted this quiz yet."
            });
        }

        res.json({
            result: {
                _id: result._id,
                quiz: result.quiz,
                score: result.score,
                totalQuestions: result.totalQuestions,
                percentage: Math.round(
                    (result.score / result.totalQuestions) * 100
                ),
                submittedAt: result.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// =========================
// GET ALL RESULTS
// Senior only
// =========================
exports.getQuizResults = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found."
            });
        }

        const session = await Session.findById(quiz.session);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (!isSessionMentor(session, req.user._id)) {
            return res.status(403).json({
                message: "You can only view results for your own quizzes."
            });
        }

        const results = await QuizResult.find({
            quiz: quiz._id
        })
            .populate("student", "name email college year")
            .sort({ createdAt: -1 });

        const formattedResults = results.map((result) => ({
            _id: result._id,
            student: result.student,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: Math.round(
                (result.score / result.totalQuestions) * 100
            ),
            submittedAt: result.createdAt
        }));

        res.json({
            results: formattedResults
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};