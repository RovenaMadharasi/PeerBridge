import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
    Calendar,
    Clock,
    Users,
    Video,
    PlusCircle,
    FileText,
    Award,
    Star,
    CheckCircle
} from "lucide-react";
import QuizBuilderModal from "../components/QuizBuilderModal";
import QuizAttemptModal from "../components/QuizAttemptModal";
import RegisteredStudentsModal from "../components/RegisteredStudentsModal";
import RatingModal from "../components/RatingModal";

function MySessions() {
    const { user } = useAuth();
    const isSenior = user?.role === "senior";

    const [activeTab, setActiveTab] = useState(isSenior ? "created" : "registered");

    const [createdSessions, setCreatedSessions] = useState([]);
    const [registeredSessions, setRegisteredSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [builderSession, setBuilderSession] = useState(null);
    const [builderExistingQuiz, setBuilderExistingQuiz] = useState(null);

    const [viewStudentsSession, setViewStudentsSession] = useState(null);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [ratingSession, setRatingSession] = useState(null);

    const fetchMySessions = async () => {
        try {
            setLoading(true);
            const res = await api.get("/sessions/mine");
            setCreatedSessions(res.data.createdSessions || []);
            setRegisteredSessions(res.data.registeredSessions || []);
        } catch (err) {
            console.error("Fetch my sessions error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMySessions();
    }, []);

    const openQuizBuilder = async (sess) => {
        try {
            const quizRes = await api.get(`/quizzes/session/${sess._id}`);
            setBuilderExistingQuiz(quizRes.data.quiz);
        } catch (err) {
            setBuilderExistingQuiz(null);
        }
        setBuilderSession(sess);
    };

    const currentList = activeTab === "created" ? createdSessions : registeredSessions;

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>My Learning Sessions</h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Manage your enrolled sessions, host controls, quizzes, and student attendee lists
                    </p>
                </div>

                {isSenior && (
                    <button
                        onClick={() => window.location.href = "/create-session"}
                        className="btn btn-primary"
                    >
                        <PlusCircle size={18} /> Schedule New Session
                    </button>
                )}
            </div>

            {/* Tab Navigation Controls */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "28px" }}>
                {isSenior && (
                    <button
                        onClick={() => setActiveTab("created")}
                        style={{
                            padding: "12px 20px",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: activeTab === "created" ? "#4f46e5" : "#64748b",
                            borderBottom: activeTab === "created" ? "3px solid #4f46e5" : "3px solid transparent"
                        }}
                    >
                        Created & Hosted Sessions ({createdSessions.length})
                    </button>
                )}

                <button
                    onClick={() => setActiveTab("registered")}
                    style={{
                        padding: "12px 20px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "registered" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "registered" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    Registered Sessions ({registeredSessions.length})
                </button>
            </div>

            {/* Content List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading your sessions...</div>
            ) : currentList.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                    {activeTab === "created"
                        ? "You haven't created any peer learning sessions yet."
                        : "You haven't registered for any sessions yet."}
                </div>
            ) : (
                <div className="grid">
                    {currentList.map((sess) => {
                        const startsAtDate = new Date(sess.startsAt);
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

                                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
                                        {sess.description || `Subject: ${sess.subject}`}
                                    </p>

                                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.85rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", marginBottom: "6px" }}>
                                            <Calendar size={16} className="text-indigo-600" />
                                            <strong>Time:</strong> {startsAtDate.toLocaleDateString()} {startsAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                                            <Users size={16} className="text-indigo-600" />
                                            <strong>Registered:</strong> {sess.registeredStudents?.length || 0} / {sess.maxSeats || 30} students
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        <a
                                            href={sess.meetingLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-secondary"
                                            style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                                        >
                                            <Video size={16} /> Meeting Link
                                        </a>

                                        {activeTab === "created" ? (
                                            <>
                                                <button
                                                    onClick={() => setViewStudentsSession(sess)}
                                                    className="btn btn-outline"
                                                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                                    title="View Registered Students"
                                                >
                                                    <Users size={16} /> Students
                                                </button>

                                                <button
                                                    onClick={() => openQuizBuilder(sess)}
                                                    className="btn btn-outline"
                                                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                                    title="Manage Quiz"
                                                >
                                                    <FileText size={16} /> Quiz Builder
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setSelectedQuizId(sess._id)}
                                                    className="btn btn-outline"
                                                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                                >
                                                    <Award size={16} /> Take Quiz
                                                </button>

                                                {hasStarted && (
                                                    <button
                                                        onClick={() => setRatingSession(sess)}
                                                        className="btn btn-outline"
                                                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                                    >
                                                        <Star size={16} style={{ color: "#f59e0b" }} /> Rate
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quiz Builder Modal */}
            {builderSession && (
                <QuizBuilderModal
                    session={builderSession}
                    existingQuiz={builderExistingQuiz}
                    onClose={() => setBuilderSession(null)}
                    onSaveSuccess={() => fetchMySessions()}
                />
            )}

            {/* Registered Students Roster Modal */}
            {viewStudentsSession && (
                <RegisteredStudentsModal
                    sessionId={viewStudentsSession._id}
                    sessionTitle={viewStudentsSession.title}
                    onClose={() => setViewStudentsSession(null)}
                />
            )}

            {/* Quiz Attempt Modal */}
            {selectedQuizId && (
                <QuizAttemptModal
                    quizId={selectedQuizId}
                    onClose={() => setSelectedQuizId(null)}
                    onComplete={() => fetchMySessions()}
                />
            )}

            {/* Rating Modal */}
            {ratingSession && (
                <RatingModal
                    session={ratingSession}
                    onClose={() => setRatingSession(null)}
                    onRatingSubmitted={() => fetchMySessions()}
                />
            )}
        </div>
    );
}

export default MySessions;