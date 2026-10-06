const router = require("express").Router();

const { createRating, getMentorRatings } = require("../controllers/ratingController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("junior"), createRating);
router.get("/mentor/:mentorId", getMentorRatings);

module.exports = router;