const router = require("express").Router();

const {
    autosaveAnswer,
    submitQuizAttempt,
    getAttemptResult
} = require("../controllers/quizController");

const { protect } = require("../middleware/auth");

router.patch("/:id/answer", protect, autosaveAnswer);
router.post("/:id/submit", protect, submitQuizAttempt);
router.get("/:id/result", protect, getAttemptResult);

module.exports = router;
