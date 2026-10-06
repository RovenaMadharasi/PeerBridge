const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
            maxlength: 300
        },

        skills: {
            type: [String],
            default: []
        },

        photo: {
            type: String,
            default: ""
        },

        points: {
            type: Number,
            default: 0
        },

        averageRating: {          // ADD THIS
            type: Number,
            default: 0
        },

        totalRatings: {           // ADD THIS
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);