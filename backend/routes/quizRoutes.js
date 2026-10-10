const router = require("express").Router();

const {
    createQuiz,
    updateQuiz,
    getQuizForSession,
    startQuizAttempt,
    getQuizResultsForMentor
} = require("../controllers/quizController");

const { protect, authorize } = require("../middleware/auth");

// Quiz management routes
router.post("/", protect, authorize("senior"), createQuiz);
router.put("/:id", protect, authorize("senior"), updateQuiz);
router.put("/:quizId", protect, authorize("senior"), updateQuiz);

router.get("/session/:sessionId", protect, getQuizForSession);
router.get("/:id", protect, getQuizForSession);

// Start attempt endpoint (LLD 3.4)
router.post("/:id/start", protect, startQuizAttempt);
router.post("/:quizId/start", protect, startQuizAttempt);

// Senior mentor views all student results for a quiz
router.get("/:id/results", protect, authorize("senior"), getQuizResultsForMentor);
router.get("/:quizId/results", protect, authorize("senior"), getQuizResultsForMentor);

module.exports = router;