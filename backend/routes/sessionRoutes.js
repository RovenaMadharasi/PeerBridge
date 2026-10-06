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

const { protect, authorize } = require("../middleware/auth");

router.get("/", getSessions);
router.get("/my", protect, getMySessions);
router.get("/:id", getSessionById);

router.post("/", protect, authorize("senior"), createSession);
router.put("/:id", protect, authorize("senior"), updateSession);
router.delete("/:id", protect, authorize("senior"), deleteSession);

router.post("/:id/register", protect, authorize("junior"), registerForSession);
router.get("/:id/students", protect, authorize("senior"), getRegisteredStudents);

module.exports = router;