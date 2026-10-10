const router = require("express").Router();
const {
    getStudentLeaderboard,
    getMentorLeaderboard,
    getMyRank
} = require("../controllers/leaderboardController");
const { protect } = require("../middleware/auth");

router.get("/students", protect, getStudentLeaderboard);
router.get("/mentors", protect, getMentorLeaderboard);
router.get("/me", protect, getMyRank);

module.exports = router;
