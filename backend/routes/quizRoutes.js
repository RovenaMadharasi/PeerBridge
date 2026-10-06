const router = require("express").Router();

const {
    createQuiz,
    getQuizForSession,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
    getMyResult,
    getQuizResults
} = require("../controllers/quizController");

const { protect, authorize } = require("../middleware/auth");

// Get quiz for a session
router.get("/session/:sessionId", protect, getQuizForSession);

// Get quiz by ID
router.get("/:quizId", protect, getQuizById);

// Senior creates a quiz
router.post("/", protect, authorize("senior"), createQuiz);

// Senior updates a quiz
router.put("/:quizId", protect, authorize("senior"), updateQuiz);

// Senior deletes a quiz
router.delete("/:quizId", protect, authorize("senior"), deleteQuiz);

// Junior submits a quiz
router.post(
    "/:quizId/submit",
    protect,
    authorize("junior"),
    submitQuiz
);

// Junior views own result
router.get(
    "/:quizId/result",
    protect,
    authorize("junior"),
    getMyResult
);

// Senior views all results
router.get(
    "/:quizId/results",
    protect,
    authorize("senior"),
    getQuizResults
);

module.exports = router;