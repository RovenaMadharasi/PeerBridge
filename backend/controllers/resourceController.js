const Resource = require("../models/Resource");
const Bookmark = require("../models/Bookmark");
const PointTransaction = require("../models/PointTransaction");
const PointsService = require("../services/PointsService");
const { POINTS_RULES } = require("../config/pointsConfig");

// =========================
// SHARE RESOURCE LINK (RES-F1, F2, D11)
// =========================
exports.createResource = async (req, res) => {
    try {
        const { title, description, subject, type, link } = req.body;

        if (!title || !subject || !link) {
            return res.status(400).json({
                message: "Please fill in all required fields: title, subject, and link."
            });
        }

        // Validate http/https URL (D11, RES-N2)
        if (!/^https?:\/\/.+/i.test(link.trim())) {
            return res.status(400).json({
                message: "Resource link must be a valid URL starting with http:// or https://"
            });
        }

        const resource = await Resource.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            subject: subject.trim(),
            type: type || "OTHER",
            link: link.trim(),
            uploadedBy: req.user._id
        });

        // Award RESOURCE_SHARED (+3 pts) with daily cap check (Max 3 rewarded shares per day - LLD 3.3)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const sharesToday = await PointTransaction.countDocuments({
            userId: req.user._id,
            action: "RESOURCE_SHARED",
            createdAt: { $gte: startOfDay }
        });

        let pointInfo = { awarded: false };
        if (sharesToday < POINTS_RULES.MAX_RESOURCE_SHARES_PER_DAY) {
            pointInfo = await PointsService.award(
                req.user._id,
                "RESOURCE_SHARED",
                resource._id,
                POINTS_RULES.RESOURCE_SHARED,
                "Resource"
            );
        }

        res.status(201).json({
            message: "Resource shared successfully",
            resource,
            pointsAwarded: pointInfo.pointsAwarded || 0,
            userBadge: pointInfo.badge
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// =========================
// SEARCH & LIST RESOURCES (RES-F1, F3, F4)
// =========================
exports.getResources = async (req, res) => {
    try {
        const { search, subject, type, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (subject) filter.subject = new RegExp(subject, "i");
        if (type) filter.type = type;
        if (search) {
            filter.$or = [
                { title: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
                { subject: new RegExp(search, "i") }
            ];
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        const total = await Resource.countDocuments(filter);

        const resources = await Resource.find(filter)
            .populate("uploadedBy", "name college photo photoUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Fetch user's bookmarks to tag each resource
        const userBookmarks = await Bookmark.find({ userId: req.user._id }).select("resourceId");
        const bookmarkedIds = new Set(userBookmarks.map((b) => b.resourceId.toString()));

        const formattedResources = resources.map((r) => {
            const rObj = r.toObject();
            rObj.isUpvoted = r.upvotedBy.some((id) => id.toString() === req.user._id.toString());
            rObj.isBookmarked = bookmarkedIds.has(r._id.toString());
            return rObj;
        });

        res.json({
            resources: formattedResources,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// TOGGLE UPVOTE ON RESOURCE (TC21: upvote toggle)
// =========================
exports.toggleUpvote = async (req, res) => {
    try {
        const resourceId = req.params.id;
        const userId = req.user._id;

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        const alreadyUpvoted = resource.upvotedBy.some((id) => id.toString() === userId.toString());

        if (alreadyUpvoted) {
            // Remove upvote (toggle off)
            resource.upvotedBy = resource.upvotedBy.filter((id) => id.toString() !== userId.toString());
        } else {
            // Add upvote
            resource.upvotedBy.push(userId);
        }

        resource.upvoteCount = resource.upvotedBy.length;
        await resource.save();

        res.json({
            message: alreadyUpvoted ? "Upvote removed" : "Upvoted resource",
            isUpvoted: !alreadyUpvoted,
            upvoteCount: resource.upvoteCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// TOGGLE BOOKMARK ON RESOURCE
// =========================
exports.toggleBookmark = async (req, res) => {
    try {
        const resourceId = req.params.id;
        const userId = req.user._id;

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        const existing = await Bookmark.findOne({ userId, resourceId });

        if (existing) {
            await Bookmark.deleteOne({ _id: existing._id });
            return res.json({ message: "Bookmark removed", isBookmarked: false });
        } else {
            await Bookmark.create({ userId, resourceId });
            return res.json({ message: "Resource bookmarked", isBookmarked: true });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =========================
// GET USER'S BOOKMARKED RESOURCES
// =========================
exports.getBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ userId: req.user._id })
            .populate({
                path: "resourceId",
                populate: { path: "uploadedBy", select: "name college photo photoUrl" }
            })
            .sort({ createdAt: -1 });

        const savedResources = bookmarks
            .filter((b) => b.resourceId)
            .map((b) => {
                const rObj = b.resourceId.toObject();
                rObj.isBookmarked = true;
                rObj.isUpvoted = rObj.upvotedBy.some((id) => id.toString() === req.user._id.toString());
                return rObj;
            });

        res.json({ bookmarks: savedResources });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
