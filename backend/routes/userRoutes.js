const router = require("express").Router();
const { getMe, updateProfile, getUserById } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.get("/:id", protect, getUserById);

module.exports = router;
