import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
    Award,
    BookOpen,
    Calendar,
    FolderGit2,
    PlusCircle,
    Star,
    CheckCircle2,
    Clock,
    TrendingUp,
    Users
} from "lucide-react";
import QuizAttemptModal from "../components/QuizAttemptModal";
import RatingModal from "../components/RatingModal";

function Dashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [mySessions, setMySessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [ratingSession, setRatingSession] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [meRes, sessRes, mySessRes] = await Promise.all([
                api.get("/users/me"),
                api.get("/sessions?limit=4"),
                api.get("/sessions/mine")
            ]);

            setStats(meRes.data);
            setUpcomingSessions(sessRes.data.sessions || []);
            setMySessions(mySessRes.data.sessions || []);
        } catch (err) {
            console.error("Dashboard data load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const userRole = user?.role || "junior";
    const badgeProgress = stats?.badgeProgress;

    return (
        <div className="container">
            {/* Hero Welcome Banner */}
            <div
                style={{
                    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
                    color: "#fff",
                    borderRadius: "20px",
                    padding: "32px",
                    marginBottom: "32px",
                    boxShadow: "0 15px 30px -10px rgba(49, 46, 129, 0.4)",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase" }}>
                            {userRole === "senior" ? "👨‍🏫 Senior Mentor" : "🎓 Junior Student"}
                        </span>
                        <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Year {user?.year} • {user?.college}</span>
                    </div>

                    <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "8px" }}>
                        Welcome back, {user?.name}! 👋
                    </h1>

                    <p style={{ color: "#c7d2fe", maxWidth: "600px", fontSize: "0.95rem", marginBottom: "20px" }}>
                        {userRole === "senior"
                            ? "Empower juniors through peer-learning sessions, publish quizzes, and climb the Mentor Leaderboard."
                            : "Explore peer learning sessions, complete timed quizzes, earn reward points, and rate your mentors."}
                    </p>

                    {/* Badge Tier Progress Bar */}
                    {badgeProgress && (
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", maxWidth: "550px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                                <span>Current Tier: 🏆 {user?.badge || "Newcomer"}</span>
                                <span>Next: {badgeProgress.nextBadge}</span>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.2)", height: "8px", borderRadius: "9999px", overflow: "hidden", marginBottom: "6px" }}>
                                <div
                                    style={{
                                        width: `${Math.min(100, Math.round(((user?.points || 0) / badgeProgress.targetPoints) * 100))}%`,
                                        background: "#fbbf24",
                                        height: "100%",
                                        borderRadius: "9999px",
                                        transition: "width 0.4s ease"
                                    }}
                                />
                            </div>

                            <div style={{ fontSize: "0.75rem", color: "#e0e7ff", textAlign: "right" }}>
                                {badgeProgress.pointsNeeded > 0
                                    ? `${badgeProgress.pointsNeeded} points needed for ${badgeProgress.nextBadge}`
                                    : "Maximum Tier Reached!"}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "36px" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Award size={26} />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>REWARD POINTS</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{user?.points || 0} pts</div>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TrendingUp size={26} />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>STUDENT RANK</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>#{stats?.rank || 1}</div>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={26} />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
                            {userRole === "senior" ? "SESSIONS CREATED" : "ENROLLED SESSIONS"}
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{mySessions.length}</div>
                    </div>
                </div>

                {userRole === "senior" && (
                    <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Star size={26} />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>MENTOR RATING</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>
                                {user?.avgRating || user?.averageRating || 0} ⭐ ({user?.ratingCount || user?.totalRatings || 0})
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions & Navigation Cards */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Quick Actions</h2>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "40px" }}>
                {userRole === "senior" && (
                    <Link to="/create-session" className="card" style={{ textDecoration: "none", background: "#4f46e5", color: "#fff" }}>
                        <PlusCircle size={28} style={{ marginBottom: "12px" }} />
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Create New Session</h3>
                        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>Schedule a learning session & set up meeting link</p>
                    </Link>
                )}

                <Link to="/sessions" className="card" style={{ textDecoration: "none" }}>
                    <BookOpen size={28} className="text-indigo-600" style={{ marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Browse Sessions</h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Discover upcoming peer sessions & register seats</p>
                </Link>

                <Link to="/leaderboard" className="card" style={{ textDecoration: "none" }}>
                    <Award size={28} style={{ color: "#f59e0b", marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Leaderboards</h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Check top students & mentor star ratings</p>
                </Link>

                <Link to="/resources" className="card" style={{ textDecoration: "none" }}>
                    <FolderGit2 size={28} style={{ color: "#0ea5e9", marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Resource Hub</h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Share & download notes, PDFs & study repos</p>
                </Link>
            </div>

            {/* Upcoming Sessions Preview */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Upcoming Learning Sessions</h2>
                <Link to="/sessions" style={{ fontSize: "0.9rem", color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
                    View All Sessions →
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>Loading sessions...</div>
            ) : upcomingSessions.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No upcoming sessions available right now.
                </div>
            ) : (
                <div className="grid">
                    {upcomingSessions.map((sess) => {
                        const startsAtDate = new Date(sess.startsAt);
                        const isRegistered = mySessions.some((s) => s._id === sess._id);
                        const hasStarted = startsAtDate <= new Date();

                        return (
                            <div key={sess._id} className="card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                        {sess.category}
                                    </span>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Clock size={14} /> {startsAtDate.toLocaleDateString()} {startsAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "8px", color: "#0f172a" }}>
                                    {sess.title}
                                </h3>

                                <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "16px" }}>
                                    <strong>Mentor:</strong> {sess.mentorId?.name || "Senior Mentor"} ({sess.mentorId?.college})
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#059669" }}>
                                        Seats Left: {sess.seatsLeft !== undefined ? sess.seatsLeft : Math.max(0, (sess.maxSeats || 30) - (sess.registeredStudents?.length || 0))}
                                    </span>

                                    {isRegistered ? (
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <a href={sess.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                                                Join Meeting
                                            </a>
                                            {hasStarted && (
                                                <button onClick={() => setRatingSession(sess)} className="btn btn-outline" style={{ padding: "6px 10px", fontSize: "0.8rem" }}>
                                                    Rate
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <Link to="/sessions" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                                            View Details
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quiz Attempt Modal */}
            {selectedQuizId && (
                <QuizAttemptModal
                    quizId={selectedQuizId}
                    onClose={() => setSelectedQuizId(null)}
                    onComplete={() => fetchDashboardData()}
                />
            )}

            {/* Rating Modal */}
            {ratingSession && (
                <RatingModal
                    session={ratingSession}
                    onClose={() => setRatingSession(null)}
                    onRatingSubmitted={() => fetchDashboardData()}
                />
            )}
        </div>
    );
}

export default Dashboard;
