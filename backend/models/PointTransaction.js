const mongoose = require("mongoose");

const pointTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        action: {
            type: String,
            enum: ["SESSION_ATTENDED", "QUIZ_COMPLETE", "RATING_GIVEN", "RESOURCE_SHARED"],
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        refType: {
            type: String,
            enum: ["Session", "Quiz", "Resource", "System"],
            default: "System"
        },
        refId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Ensure unique award per user + action + refId to prevent double awards (D7, LEAD-N1, 3.5.4)
pointTransactionSchema.index({ userId: 1, action: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model("PointTransaction", pointTransactionSchema);
