import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { PlusCircle, Calendar, Link as LinkIcon, Users, ArrowLeft } from "lucide-react";

function CreateSession() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Academic",
        subject: "",
        topic: "",
        difficulty: "Beginner",
        date: "",
        time: "",
        meetingPlatform: "Google Meet",
        meetingLink: "",
        maxSeats: 30,
        tags: ""
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.title || !formData.subject || !formData.date || !formData.time || !formData.meetingLink) {
            setError("Please fill in all required fields.");
            return;
        }

        if (!/^https?:\/\/.+/i.test(formData.meetingLink.trim())) {
            setError("Meeting link must be a valid URL starting with http:// or https://");
            return;
        }

        // Combine date & time into UTC ISO startsAt
        const startsAtDate = new Date(`${formData.date}T${formData.time}`);
        if (isNaN(startsAtDate.getTime())) {
            setError("Please select a valid date and time.");
            return;
        }

        if (startsAtDate <= new Date()) {
            setError("Session start time must be in the future.");
            return;
        }

        try {
            setSubmitting(true);
            await api.post("/sessions", {
                ...formData,
                startsAt: startsAtDate.toISOString(),
                maxSeats: Number(formData.maxSeats),
                maxStudents: Number(formData.maxSeats),
                tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
            });

            navigate("/my-sessions");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create session.");
        } finally {
            setSubmitting(false);
        }
    };

    if (user?.role !== "senior") {
        return (
            <div className="container" style={{ maxWidth: "600px", paddingTop: "60px", textAlign: "center" }}>
                <div className="card">
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#dc2626", marginBottom: "12px" }}>
                        Access Restricted (Senior Mentors Only)
                    </h2>
                    <p style={{ color: "#64748b", marginBottom: "20px" }}>
                        Only Year 3 and Year 4 senior students can create and host peer learning sessions.
                    </p>
                    <button onClick={() => navigate("/sessions")} className="btn btn-primary">
                        Browse Available Sessions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: "720px" }}>
            <div style={{ marginBottom: "24px" }}>
                <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: "16px", padding: "6px 12px" }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Schedule a Peer Learning Session</h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    Host a session to share your knowledge, guide juniors, and earn mentor ratings
                </p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card" style={{ padding: "32px" }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Session Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            placeholder="e.g. Master Graph Algorithms & Dynamic Programming"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Category *</label>
                            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
                                <option value="Academic">Academic</option>
                                <option value="Career Preparation">Career Preparation</option>
                                <option value="Coding & Tech">Coding & Tech</option>
                                <option value="Soft Skills">Soft Skills</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Difficulty Level *</label>
                            <select name="difficulty" className="form-control" value={formData.difficulty} onChange={handleChange}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Subject *</label>
                            <input
                                type="text"
                                name="subject"
                                className="form-control"
                                placeholder="e.g. Computer Science / Data Structures"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Specific Topic</label>
                            <input
                                type="text"
                                name="topic"
                                className="form-control"
                                placeholder="e.g. Dijkstra & BFS Traversals"
                                value={formData.topic}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                name="date"
                                className="form-control"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Time *</label>
                            <input
                                type="time"
                                name="time"
                                className="form-control"
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Max Capacity (Seats) *</label>
                            <input
                                type="number"
                                name="maxSeats"
                                min="1"
                                max="500"
                                className="form-control"
                                value={formData.maxSeats}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Meeting Platform</label>
                            <select name="meetingPlatform" className="form-control" value={formData.meetingPlatform} onChange={handleChange}>
                                <option value="Google Meet">Google Meet</option>
                                <option value="Zoom">Zoom</option>
                                <option value="Microsoft Teams">Microsoft Teams</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Meeting Link (http / https) *</label>
                            <input
                                type="url"
                                name="meetingLink"
                                className="form-control"
                                placeholder="https://meet.google.com/abc-defg-hij"
                                value={formData.meetingLink}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Session Description & Objectives</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="4"
                            placeholder="Describe what juniors will learn in this session and any prerequisites..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tags (comma separated)</label>
                        <input
                            type="text"
                            name="tags"
                            className="form-control"
                            placeholder="dsa, algorithms, python, PlacementPrep"
                            value={formData.tags}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "12px", marginTop: "12px" }}
                    >
                        <PlusCircle size={18} /> {submitting ? "Publishing Session..." : "Create & Publish Session"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateSession;