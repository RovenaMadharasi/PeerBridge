// Centralized error handling middleware (LLD Section 3.7)
const errorHandler = (err, req, res, next) => {
    console.error("API Error:", err);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "record";
        return res.status(409).json({
            message: `A ${field} with this value already exists.`
        });
    }

    // Validation error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((el) => el.message);
        return res.status(400).json({
            message: errors.join(", ")
        });
    }

    // Cast error (invalid ObjectId)
    if (err.name === "CastError") {
        return res.status(404).json({
            message: `Invalid ID format for ${err.path}.`
        });
    }

    res.status(statusCode).json({
        message: err.message || "Internal server error. Please try again later."
    });
};

module.exports = errorHandler;
