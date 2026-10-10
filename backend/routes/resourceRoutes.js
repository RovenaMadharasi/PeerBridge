const router = require("express").Router();
const {
    createResource,
    getResources,
    toggleUpvote,
    toggleBookmark,
    getBookmarks
} = require("../controllers/resourceController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getResources);
router.post("/", protect, createResource);

router.get("/bookmarks", protect, getBookmarks);
router.post("/:id/upvote", protect, toggleUpvote);
router.post("/:id/bookmark", protect, toggleBookmark);

module.exports = router;
