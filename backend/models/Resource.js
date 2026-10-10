const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["PDF", "NOTES", "VIDEO", "GITHUB", "OTHER"],
            default: "OTHER"
        },
        link: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/i.test(v);
                },
                message: "Resource link must be a valid http or https URL"
            }
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        upvotedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        upvoteCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Text index on title, description, subject for search (LLD 3.3)
resourceSchema.index({ title: "text", description: "text", subject: "text" });

module.exports = mongoose.model("Resource", resourceSchema);
