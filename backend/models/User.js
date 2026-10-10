const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getBadgeForPoints } = require("../config/pointsConfig");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },
        role: {
            type: String,
            enum: ["junior", "senior"],
            required: true
        },
        college: {
            type: String,
            required: true,
            trim: true
        },
        year: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },
        bio: {
            type: String,
            default: "",
            maxlength: 500
        },
        skills: {
            type: [String],
            default: []
        },
        photo: {
            type: String,
            default: ""
        },
        photoUrl: {
            type: String,
            default: ""
        },
        socialLinks: {
            github: { type: String, default: "" },
            linkedin: { type: String, default: "" },
            twitter: { type: String, default: "" }
        },
        points: {
            type: Number,
            default: 0
        },
        badge: {
            type: String,
            default: "Newcomer"
        },
        avgRating: {
            type: Number,
            default: 0
        },
        ratingCount: {
            type: Number,
            default: 0
        },
        // Alias fields for backward compatibility
        averageRating: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    // Keep badge in sync with points
    this.badge = getBadgeForPoints(this.points);

    // Keep legacy averageRating & totalRatings in sync with avgRating & ratingCount
    if (this.isModified("avgRating") || this.isModified("ratingCount")) {
        this.averageRating = this.avgRating;
        this.totalRatings = this.ratingCount;
    }

    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);