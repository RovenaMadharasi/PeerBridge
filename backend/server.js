require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/attempts", require("./routes/attemptRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/mentors", require("./routes/ratingRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));

app.get("/", (req, res) => {
    res.json({
        message: "PeerBridge API is running cleanly",
        version: "1.0.0",
        docs: "/api/sessions, /api/quizzes, /api/leaderboard, /api/resources"
    });
});

// Central error handler (LLD 3.7)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`PeerBridge Server running on port ${PORT}`);
});