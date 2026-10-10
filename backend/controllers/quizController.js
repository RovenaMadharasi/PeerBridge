const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Session = require("../models/Session");
const PointsService = require("../services/PointsService");
const { POINTS_RULES } = require("../config/pointsConfig");

// Helper: Check if logged-in user is session mentor owner
const isSessionMentor = (session, userId) => {
    return session.mentorId.toString() === userId.toString();
};

// Helper: Check if student is registered for session
const isRegisteredStudent = (session, userId) => {
    return session.registeredStudents.some(
        (id) => id.toString() === userId.toString()
    );
};

// Helper: Sanitize questions for student (hide correctIndex & explanation) - LLD 3.5.3 & QUIZ-F4, N1
const sanitizeQuestionsForStudent = (questions) => {
    return questions.map((q, idx) => ({
        _id: q._id,
        index: idx,
        question: q.question,
        options: q.options,
        marks: q.marks || 1
    }));
};

// Helper: Auto-finalize attempt if server deadline + 5s passed (LLD 3.5.3 / 3.6)
const finalizeIfExpired = async (attempt, quiz) => {
    if (attempt.status !== "IN_PROGRESS") return attempt;

    const now = new Date();
    const expiryBufferMs = (quiz.timeLimitMin * 60 * 1000) + 5000;
    const isExpired = now.getTime() > (new Date(attempt.startedAt).getTime() + expiryBufferMs);

    if (isExpired) {
        attempt.status = "AUTO_SUBMITTED";
        attempt.submittedAt = now;

        // Grade saved answers so far
        let score = 0;
        quiz.questions.forEach((q, idx) => {
            const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
            if (studentAns && studentAns.selectedIndex === q.correctIndex) {
                score += q.marks || 1;
            }
        });

        attempt.score = score;
        attempt.totalMarks = quiz.totalMarks || 1;
        attempt.percent = Math.round((score / attempt.totalMarks) * 100);

        // QUIZ_COMPLETE points = 10 + round(percent / 10)
        const pts = POINTS_RULES.QUIZ_COMPLETE_BASE + Math.round(attempt.percent / 10);
        attempt.pointsAwarded = pts;

        await attempt.save();
        await PointsService.award(attempt.studentId, "QUIZ_COMPLETE", quiz._id, pts, "Quiz");
    }

    return attempt;
};

// =========================
// CREATE QUIZ FOR SESSION (Senior owner only)
// =========================
exports.createQuiz = async (req, res) => {
    try {
        const sessionId = req.body.sessionId || req.body.session || req.params.sessionId;
        const { title, timeLimitMin, questions } = req.body;

        if (!sessionId || !title || !questions) {
            return res.status(400).json({
                message: "Session ID, quiz title, and questions are required."
            });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (!isSessionMentor(session, req.user._id)) {
            return res.status(403).json({ message: "You can only create a quiz for your own session." });
        }

        // Unique quiz per session check (LLD 3.3)
        const existingQuiz = await Quiz.findOne({ sessionId });
        if (existingQuiz) {
            return res.status(409).json({ message: "A quiz already exists for this session." });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Quiz must contain at least one question." });
        }

        // Validate each question
        const formattedQuestions = questions.map((q, i) => {
            const text = q.question || q.text;
            const options = q.options;
            const correctIndex = q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer;

            if (!text || !text.trim()) throw new Error(`Question ${i + 1} must have text.`);
            if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
                throw new Error(`Question ${i + 1} must have between 2 and 6 options.`);
            }
            if (correctIndex === undefined || correctIndex < 0 || correctIndex >= options.length) {
                throw new Error(`Question ${i + 1} must have a valid correct answer option index.`);
            }

            return {
                question: text.trim(),
                options: options.map((o) => String(o).trim()),
                correctIndex: Number(correctIndex),
                marks: Number(q.marks || 1),
                explanation: q.explanation ? String(q.explanation).trim() : ""
            };
        });

        const quiz = await Quiz.create({
            sessionId,
            title: title.trim(),
            timeLimitMin: Math.max(1, Number(timeLimitMin || 15)),
            questions: formattedQuestions,
            isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: "Quiz created successfully",
            quiz
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// UPDATE OR PUBLISH QUIZ (Senior owner only)
// =========================
exports.updateQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId || req.params.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const session = await Session.findById(quiz.sessionId);
        if (!session || !isSessionMentor(session, req.user._id)) {
            return res.status(403).json({ message: "You can only edit quizzes for your own sessions." });
        }

        const { title, timeLimitMin, questions, isPublished } = req.body;

        if (title !== undefined) quiz.title = title.trim();
        if (timeLimitMin !== undefined) quiz.timeLimitMin = Math.max(1, Number(timeLimitMin));
        if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);

        if (questions !== undefined) {
            if (!Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({ message: "Quiz must contain at least one question." });
            }

            quiz.questions = questions.map((q) => ({
                question: (q.question || q.text).trim(),
                options: q.options,
                correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer,
                marks: q.marks || 1,
                explanation: q.explanation || ""
            }));
        }

        await quiz.save();

        res.json({
            message: "Quiz updated successfully",
            quiz
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// GET QUIZ FOR SESSION
// =========================
exports.getQuizForSession = async (req, res) => {
    try {
        const sessionId = req.params.sessionId || req.params.id;
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        const quiz = await Quiz.findOne({ sessionId });
        if (!quiz) {
            return res.status(404).json({ message: "No quiz created for this session yet." });
        }

        const isMentor = isSessionMentor(session, req.user._id);

        // Senior owner gets full quiz details with correct answers
        if (isMentor) {
            return res.json({ quiz, isMentor: true });
        }

        // Student must be registered
        if (!isRegisteredStudent(session, req.user._id)) {
            return res.status(403).json({ message: "You must be registered for this session to view or take the quiz." });
        }

        if (!quiz.isPublished) {
            return res.status(403).json({ message: "This quiz has not been published by the mentor yet." });
        }

        // Check if student has an active or completed attempt
        const attempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: req.user._id });

        res.json({
            quiz: {
                _id: quiz._id,
                sessionId: quiz.sessionId,
                title: quiz.title,
                timeLimitMin: quiz.timeLimitMin,
                totalMarks: quiz.totalMarks,
                questionCount: quiz.questions.length,
                isPublished: quiz.isPublished
            },
            attemptStatus: attempt ? attempt.status : "NOT_STARTED",
            attemptId: attempt ? attempt._id : null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// START QUIZ ATTEMPT (Registered student - QUIZ-F8, N3, 3.5.3)
// =========================
exports.startQuizAttempt = async (req, res) => {
    try {
        const quizId = req.params.quizId || req.params.id;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const session = await Session.findById(quiz.sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (!isRegisteredStudent(session, req.user._id)) {
            return res.status(403).json({ message: "You must be registered for this session to start the quiz." });
        }

        if (!quiz.isPublished) {
            return res.status(403).json({ message: "Quiz is not published yet." });
        }

        const now = new Date();

        // Award SESSION_ATTENDED points (+5 pts) on first quiz start or rating (LLD 3.5.4)
        await PointsService.award(req.user._id, "SESSION_ATTENDED", session._id, POINTS_RULES.SESSION_ATTENDED, "Session");

        // Unique index (quizId, studentId): second start returns the existing attempt (LLD 3.5.3)
        let attempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: req.user._id });

        if (!attempt) {
            const deadlineAt = new Date(now.getTime() + quiz.timeLimitMin * 60 * 1000);

            attempt = await QuizAttempt.create({
                quizId: quiz._id,
                sessionId: quiz.sessionId,
                studentId: req.user._id,
                startedAt: now,
                deadlineAt,
                status: "IN_PROGRESS",
                answers: [],
                totalMarks: quiz.totalMarks
            });
        } else {
            attempt = await finalizeIfExpired(attempt, quiz);
        }

        // Return questions WITHOUT correctIndex and explanation (QUIZ-F4, N1, 3.5.3)
        res.json({
            attemptId: attempt._id,
            serverNow: new Date(),
            deadlineAt: attempt.deadlineAt,
            status: attempt.status,
            answers: attempt.answers,
            timeLimitMin: quiz.timeLimitMin,
            title: quiz.title,
            questions: sanitizeQuestionsForStudent(quiz.questions)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// AUTOSAVE ANSWER (Attempt owner - PATCH /api/attempts/:id/answer)
// =========================
exports.autosaveAnswer = async (req, res) => {
    try {
        const attemptId = req.params.id;
        const { questionIndex, selectedIndex } = req.body;

        let attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: "Quiz attempt not found." });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized attempt access." });
        }

        const quiz = await Quiz.findById(attempt.quizId);
        attempt = await finalizeIfExpired(attempt, quiz);

        if (attempt.status !== "IN_PROGRESS") {
            return res.status(400).json({
                message: "Attempt is closed or already submitted.",
                status: attempt.status
            });
        }

        if (questionIndex !== undefined && selectedIndex !== undefined) {
            const existingIdx = attempt.answers.findIndex((a) => a.questionIndex === Number(questionIndex));
            if (existingIdx >= 0) {
                attempt.answers[existingIdx].selectedIndex = Number(selectedIndex);
            } else {
                attempt.answers.push({
                    questionIndex: Number(questionIndex),
                    selectedIndex: Number(selectedIndex)
                });
            }
            await attempt.save();
        }

        res.json({
            message: "Answer saved successfully",
            status: attempt.status,
            answers: attempt.answers
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// SUBMIT QUIZ ATTEMPT (POST /api/attempts/:id/submit)
// =========================
exports.submitQuizAttempt = async (req, res) => {
    try {
        const attemptId = req.params.id;
        let attempt = await QuizAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(404).json({ message: "Quiz attempt not found." });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized attempt submission." });
        }

        const quiz = await Quiz.findById(attempt.quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Associated quiz not found." });
        }

        if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
            // Already submitted - return stored result (TC14: submit same quiz again -> same result, points not added twice)
            return res.json({
                message: "Quiz already submitted.",
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                percent: attempt.percent,
                pointsAwarded: attempt.pointsAwarded,
                status: attempt.status,
                review: quiz.questions.map((q, idx) => ({
                    questionIndex: idx,
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    marks: q.marks,
                    explanation: q.explanation
                }))
            });
        }

        const now = new Date();
        const expiryBufferMs = (quiz.timeLimitMin * 60 * 1000) + 5000;
        const isExpired = now.getTime() > (new Date(attempt.startedAt).getTime() + expiryBufferMs);

        attempt.status = isExpired ? "AUTO_SUBMITTED" : "SUBMITTED";
        attempt.submittedAt = now;

        // Optionally update final answers array from request body if passed
        if (Array.isArray(req.body.answers)) {
            req.body.answers.forEach((ans) => {
                const qIdx = ans.questionIndex !== undefined ? ans.questionIndex : ans.index;
                const sIdx = ans.selectedIndex !== undefined ? ans.selectedIndex : ans.selected;
                if (qIdx !== undefined && sIdx !== undefined) {
                    const ex = attempt.answers.findIndex((a) => a.questionIndex === Number(qIdx));
                    if (ex >= 0) {
                        attempt.answers[ex].selectedIndex = Number(sIdx);
                    } else {
                        attempt.answers.push({ questionIndex: Number(qIdx), selectedIndex: Number(sIdx) });
                    }
                }
            });
        }

        // Server-side grading logic (LLD 3.5.3)
        let score = 0;
        quiz.questions.forEach((q, idx) => {
            const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
            if (studentAns && studentAns.selectedIndex === q.correctIndex) {
                score += q.marks || 1;
            }
        });

        attempt.score = score;
        attempt.totalMarks = quiz.totalMarks || 1;
        attempt.percent = Math.round((score / attempt.totalMarks) * 100);

        // QUIZ_COMPLETE points = 10 + round(percent / 10)
        const pts = POINTS_RULES.QUIZ_COMPLETE_BASE + Math.round(attempt.percent / 10);
        attempt.pointsAwarded = pts;

        await attempt.save();

        // Award points to user
        const awardResult = await PointsService.award(attempt.studentId, "QUIZ_COMPLETE", quiz._id, pts, "Quiz");

        // Build question review with correct answers & explanations (sent ONLY after submit - QUIZ-F4, LLD 3.4)
        const review = quiz.questions.map((q, idx) => {
            const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
            return {
                questionIndex: idx,
                question: q.question,
                options: q.options,
                selectedIndex: studentAns ? studentAns.selectedIndex : null,
                correctIndex: q.correctIndex,
                isCorrect: studentAns ? studentAns.selectedIndex === q.correctIndex : false,
                marks: q.marks,
                explanation: q.explanation
            };
        });

        res.json({
            message: "Quiz submitted and graded successfully",
            attemptId: attempt._id,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percent: attempt.percent,
            pointsAwarded: pts,
            userBadge: awardResult.badge,
            status: attempt.status,
            review
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET ATTEMPT RESULT (Attempt owner)
// =========================
exports.getAttemptResult = async (req, res) => {
    try {
        const attemptId = req.params.id;
        const attempt = await QuizAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found." });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized access to attempt result." });
        }

        const quiz = await Quiz.findById(attempt.quizId);

        const review = quiz.questions.map((q, idx) => {
            const studentAns = attempt.answers.find((a) => a.questionIndex === idx);
            return {
                questionIndex: idx,
                question: q.question,
                options: q.options,
                selectedIndex: studentAns ? studentAns.selectedIndex : null,
                correctIndex: q.correctIndex,
                isCorrect: studentAns ? studentAns.selectedIndex === q.correctIndex : false,
                marks: q.marks,
                explanation: q.explanation
            };
        });

        res.json({
            attemptId: attempt._id,
            quizTitle: quiz.title,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percent: attempt.percent,
            pointsAwarded: attempt.pointsAwarded,
            status: attempt.status,
            submittedAt: attempt.submittedAt || attempt.updatedAt,
            review
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET ALL QUIZ RESULTS FOR SESSION (Senior owner only)
// =========================
exports.getQuizResultsForMentor = async (req, res) => {
    try {
        const quizId = req.params.quizId || req.params.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const session = await Session.findById(quiz.sessionId);
        if (!session || !isSessionMentor(session, req.user._id)) {
            return res.status(403).json({ message: "You can only view results for your own quizzes." });
        }

        const attempts = await QuizAttempt.find({ quizId: quiz._id })
            .populate("studentId", "name email college year points badge photo photoUrl")
            .sort({ submittedAt: -1 });

        res.json({
            quizTitle: quiz.title,
            totalMarks: quiz.totalMarks,
            attemptCount: attempts.length,
            results: attempts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};