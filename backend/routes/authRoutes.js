const router = require("express").Router();

const {
    signup,
    login,
    updateProfile
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

router.post("/signup", signup);

router.post("/login", login);

router.get("/me", protect, (req, res) => {
    res.json({
        message: "You are logged in",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            college: req.user.college,
            year: req.user.year,
            bio: req.user.bio,
            skills: req.user.skills,
            photo: req.user.photo,
            points: req.user.points
        }
    });
});

router.put("/profile", protect, updateProfile);

module.exports = router;