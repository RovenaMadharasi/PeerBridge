const router = require("express").Router();

const {
    createSession,
    getSessions,
    getMySessions,
    getSessionById,
    updateSession,
    deleteSession,
    registerForSession,
    getRegisteredStudents
} = require("../controllers/sessionController");

const { createRating } = require("../controllers/ratingController");
const { createQuiz } = require("../controllers/quizController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getSessions);
router.get("/mine", protect, getMySessions);
router.get("/my", protect, getMySessions);
router.get("/:id", protect, getSessionById);

router.post("/", protect, authorize("senior"), createSession);
router.put("/:id", protect, authorize("senior"), updateSession);
router.delete("/:id", protect, authorize("senior"), deleteSession);

router.post("/:id/register", protect, registerForSession);
router.get("/:id/students", protect, authorize("senior"), getRegisteredStudents);

// Nested routes per LLD 3.4 API Design
router.post("/:id/ratings", protect, createRating);
router.post("/:id/quiz", protect, authorize("senior"), createQuiz);

module.exports = router;