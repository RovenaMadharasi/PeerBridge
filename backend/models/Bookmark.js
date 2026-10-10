const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Unique index: one bookmark per user per resource (LLD 3.3)
bookmarkSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
