import { useState } from "react";
import api from "../api/axios";
import { X, Star, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function RatingModal({ session, onClose, onRatingSubmitted }) {
    const { refreshUser } = useAuth();
    const [subjectKnowledge, setSubjectKnowledge] = useState(5);
    const [explanationQuality, setExplanationQuality] = useState(5);
    const [communication, setCommunication] = useState(5);
    const [usefulness, setUsefulness] = useState(5);
    const [overall, setOverall] = useState(5);
    const [feedback, setFeedback] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const renderStarInput = (label, value, setter) => (
        <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>{label}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f59e0b" }}>{value} / 5 ⭐</span>
            </div>
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={24}
                        onClick={() => setter(star)}
                        className={`star ${star <= value ? "active" : ""}`}
                        style={{ fill: star <= value ? "#f59e0b" : "transparent" }}
                    />
                ))}
            </div>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);
            await api.post(`/sessions/${session._id}/ratings`, {
                sessionId: session._id,
                subjectKnowledge,
                explanationQuality,
                communication,
                usefulness,
                overall,
                feedback
            });

            if (refreshUser) refreshUser();
            if (onRatingSubmitted) onRatingSubmitted();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit rating.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "550px", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Rate Mentor Session</h2>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{session.title}</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: "6px" }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {renderStarInput("Subject Knowledge", subjectKnowledge, setSubjectKnowledge)}
                    {renderStarInput("Explanation Quality", explanationQuality, setExplanationQuality)}
                    {renderStarInput("Communication", communication, setCommunication)}
                    {renderStarInput("Usefulness", usefulness, setUsefulness)}
                    {renderStarInput("Overall Mentor Rating", overall, setOverall)}

                    <div className="form-group" style={{ marginTop: "20px" }}>
                        <label>Written Feedback & Testimonial (Optional)</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            maxLength="500"
                            placeholder="Share how this session helped you or any constructive feedback for the mentor..."
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            <CheckCircle size={18} /> {submitting ? "Submitting..." : "Submit Rating (+2 Pts)"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RatingModal;
