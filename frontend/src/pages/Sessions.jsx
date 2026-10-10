import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
    Search,
    Calendar,
    Clock,
    User,
    Video,
    CheckCircle,
    Star,
    Award,
    HelpCircle,
    Filter
} from "lucide-react";
import QuizAttemptModal from "../components/QuizAttemptModal";
import RatingModal from "../components/RatingModal";

function Sessions() {
    const { user, refreshUser } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [mySessionsMap, setMySessionsMap] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [status, setStatus] = useState("upcoming");

    const [alertMessage, setAlertMessage] = useState(null); // { type: 'success'|'danger', text: '' }

    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [ratingSession, setRatingSession] = useState(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (search) query.append("search", search);
            if (category) query.append("category", category);
            if (difficulty) query.append("difficulty", difficulty);
            if (status) query.append("status", status);

            const [sessRes, mySessRes] = await Promise.all([
                api.get(`/sessions?${query.toString()}`),
                api.get("/sessions/mine")
            ]);

            setSessions(sessRes.data.sessions || []);

            const myRegistered = (mySessRes.data.sessions || mySessRes.data.registeredSessions || []).map((s) => s._id);
            setMySessionsMap(new Set(myRegistered));
        } catch (err) {
            console.error("Fetch sessions error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [category, difficulty, status]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchSessions();
    };

    // Atomic seat registration (SESS-F6, F7, N1, D4)
    const handleRegister = async (sessionId) => {
        try {
            setAlertMessage(null);
            const res = await api.post(`/sessions/${sessionId}/register`);
            setAlertMessage({ type: "success", text: res.data.message || "Successfully registered for session!" });
            if (refreshUser) refreshUser();
            fetchSessions();
        } catch (err) {
            setAlertMessage({
                type: "danger",
                text: err.response?.data?.message || "Failed to register for session."
            });
        }
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Explore Peer Sessions</h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Discover live learning sessions hosted by senior mentors across campus
                    </p>
                </div>
            </div>

            {alertMessage && (
                <div className={`alert alert-${alertMessage.type}`}>
                    {alertMessage.text}
                </div>
            )}

            {/* Search & Filter Header Bar */}
            <div className="card" style={{ marginBottom: "32px", padding: "20px" }}>
                <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Search Keyword</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by title or subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Category</label>
                        <select
                            className="form-control"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="Academic">Academic</option>
                            <option value="Career Preparation">Career Preparation</option>
                            <option value="Coding & Tech">Coding & Tech</option>
                            <option value="Soft Skills">Soft Skills</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Difficulty Level</label>
                        <select
                            className="form-control"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="">All Difficulties</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Timeline Status</label>
                        <select
                            className="form-control"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="upcoming">Upcoming Sessions</option>
                            <option value="past">Past / Completed Sessions</option>
                            <option value="all">All Sessions</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary">
                        <Search size={18} /> Search Sessions
                    </button>
                </form>
            </div>

            {/* Session Cards Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading sessions...</div>
            ) : sessions.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                    No peer learning sessions matched your filter criteria.
                </div>
            ) : (
                <div className="grid">
                    {sessions.map((sess) => {
                        const startsAtDate = new Date(sess.startsAt);
                        const isMentor = user && sess.mentorId?._id === user.id;
                        const isRegistered = mySessionsMap.has(sess.id) || mySessionsMap.has(sess._id);
                        const seatsLeft = sess.seatsLeft !== undefined ? sess.seatsLeft : Math.max(0, (sess.maxSeats || 30) - (sess.registeredStudents?.length || 0));
                        const isFull = seatsLeft <= 0;
                        const hasStarted = startsAtDate <= new Date();

                        return (
                            <div key={sess._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                        <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                            {sess.category}
                                        </span>
                                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                                            {sess.difficulty}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                                        {sess.title}
                                    </h3>

                                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px", minHeight: "40px" }}>
                                        {sess.description || `Subject: ${sess.subject}`}
                                    </p>

                                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.85rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", marginBottom: "6px" }}>
                                            <Calendar size={16} className="text-indigo-600" />
                                            <strong>Time:</strong> {startsAtDate.toLocaleDateString()} {startsAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                                            <User size={16} className="text-indigo-600" />
                                            <strong>Mentor:</strong> {sess.mentorId?.name} ({sess.mentorId?.college})
                                            {sess.mentorId?.avgRating > 0 && (
                                                <span style={{ color: "#f59e0b", fontWeight: "700", marginLeft: "auto" }}>
                                                    ⭐ {sess.mentorId?.avgRating}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {/* Seat availability bar */}
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px" }}>
                                        <span>Seats Available</span>
                                        <span style={{ color: isFull ? "#dc2626" : "#059669" }}>
                                            {seatsLeft} / {sess.maxSeats || 30} left
                                        </span>
                                    </div>

                                    <div style={{ background: "#e2e8f0", height: "6px", borderRadius: "9999px", overflow: "hidden", marginBottom: "16px" }}>
                                        <div
                                            style={{
                                                width: `${Math.min(100, Math.round(((sess.registeredStudents?.length || 0) / (sess.maxSeats || 30)) * 100))}%`,
                                                background: isFull ? "#ef4444" : "#10b981",
                                                height: "100%"
                                            }}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {isMentor ? (
                                            <div style={{ fontSize: "0.85rem", color: "#4f46e5", fontWeight: "600", padding: "8px 0" }}>
                                                👨‍🏫 You are the host of this session
                                            </div>
                                        ) : isRegistered ? (
                                            <>
                                                <a
                                                    href={sess.meetingLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-secondary"
                                                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                                                >
                                                    <Video size={16} /> Join Link
                                                </a>

                                                {hasStarted && (
                                                    <button
                                                        onClick={() => setRatingSession(sess)}
                                                        className="btn btn-outline"
                                                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                                        title="Rate Mentor (+2 Pts)"
                                                    >
                                                        <Star size={16} style={{ color: "#f59e0b" }} /> Rate
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleRegister(sess._id)}
                                                disabled={isFull || hasStarted}
                                                className="btn btn-primary"
                                                style={{ width: "100%", padding: "10px" }}
                                            >
                                                {hasStarted ? "Session Closed" : isFull ? "Session Full" : "Register Seat"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Rating Modal */}
            {ratingSession && (
                <RatingModal
                    session={ratingSession}
                    onClose={() => setRatingSession(null)}
                    onRatingSubmitted={() => fetchSessions()}
                />
            )}
        </div>
    );
}

export default Sessions;