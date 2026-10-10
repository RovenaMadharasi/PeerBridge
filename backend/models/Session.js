const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        category: {
            type: String,
            enum: ["Academic", "Career Preparation", "Coding & Tech", "Soft Skills", "Other"],
            default: "Academic"
        },
        subject: { type: String, required: true, trim: true },
        topic: { type: String, default: "", trim: true },
        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },
        startsAt: { type: Date, required: true },
        // Legacy display fields fallback
        date: { type: Date },
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        meetingPlatform: {
            type: String,
            enum: ["Google Meet", "Zoom", "Microsoft Teams", "Other"],
            default: "Google Meet"
        },
        meetingLink: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/i.test(v);
                },
                message: "Meeting link must be a valid http or https URL"
            }
        },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        maxSeats: { type: Number, required: true, min: 1 },
        maxStudents: { type: Number }, // Alias
        registeredStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        tags: { type: [String], default: [] },
        status: {
            type: String,
            enum: ["upcoming", "completed", "cancelled"],
            default: "upcoming"
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

sessionSchema.pre("save", function () {
    if (this.maxSeats && !this.maxStudents) {
        this.maxStudents = this.maxSeats;
    } else if (this.maxStudents && !this.maxSeats) {
        this.maxSeats = this.maxStudents;
    }
    if (this.startsAt && !this.date) {
        this.date = this.startsAt;
    }
});

// Virtual for seats left
sessionSchema.virtual("seatsLeft").get(function () {
    const seats = this.maxSeats || this.maxStudents || 0;
    const registered = this.registeredStudents ? this.registeredStudents.length : 0;
    return Math.max(0, seats - registered);
});

module.exports = mongoose.model("Session", sessionSchema);