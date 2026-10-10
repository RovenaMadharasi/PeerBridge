const router = require("express").Router();
const { createRating, getMentorRatings } = require("../controllers/ratingController");
const { protect } = require("../middleware/auth");

router.post("/", protect, createRating);
router.get("/mentor/:mentorId", protect, getMentorRatings);
router.get("/:mentorId", protect, getMentorRatings);

module.exports = router;