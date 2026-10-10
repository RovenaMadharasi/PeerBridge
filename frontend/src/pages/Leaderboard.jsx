import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Award, Star, Trophy, Users, ShieldAlert } from "lucide-react";

function Leaderboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("students"); // 'students' | 'mentors'

    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [myRankData, setMyRankData] = useState(null);

    const [loading, setLoading] = useState(true);

    const fetchLeaderboards = async () => {
        try {
            setLoading(true);
            const [stRes, mtRes, rankRes] = await Promise.all([
                api.get("/leaderboard/students"),
                api.get("/leaderboard/mentors"),
                api.get("/leaderboard/me")
            ]);

            setStudents(stRes.data.leaderboard || []);
            setMentors(mtRes.data.leaderboard || []);
            setMyRankData(rankRes.data);
        } catch (err) {
            console.error("Leaderboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboards();
    }, []);

    const getRankMedal = (rank) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    return (
        <div className="container">
            {/* User Rank Position Banner (LEAD-F6) */}
            {myRankData && (
                <div
                    style={{
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        color: "#fff",
                        borderRadius: "16px",
                        padding: "24px 32px",
                        marginBottom: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#4f46e5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "800" }}>
                            #{myRankData.studentRank}
                        </div>
                        <div>
                            <div style={{ fontSize: "0.85rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>Your Campus Position</div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: "800" }}>{user?.name}</h2>
                            <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                                {user?.college} • Year {user?.year} ({user?.role === "senior" ? "Senior Mentor" : "Junior Student"})
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Total Points</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fbbf24" }}>⭐ {user?.points || 0}</div>
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Badge Tier</div>
                            <div className={`badge-chip badge-${user?.badge || "Newcomer"}`} style={{ marginTop: "4px" }}>
                                🏆 {user?.badge || "Newcomer"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subheader & Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Campus Leaderboards</h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Recognizing top student engagement and top-rated senior mentors
                    </p>
                </div>
            </div>

            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "28px" }}>
                <button
                    onClick={() => setActiveTab("students")}
                    style={{
                        padding: "12px 24px",
                        fontWeight: "700",
                        fontSize: "1rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "students" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "students" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    🎓 Student Leaderboard (Points & Badges)
                </button>

                <button
                    onClick={() => setActiveTab("mentors")}
                    style={{
                        padding: "12px 24px",
                        fontWeight: "700",
                        fontSize: "1rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "mentors" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "mentors" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    👨‍🏫 Mentor Leaderboard (Ratings ≥ 3 Reviews)
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading leaderboard standings...</div>
            ) : activeTab === "students" ? (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student Name</th>
                                    <th>College</th>
                                    <th>Year</th>
                                    <th>Badge Tier</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                            No students found on the leaderboard.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((st) => {
                                        const isMe = user && st._id === user.id;

                                        return (
                                            <tr key={st._id} className={isMe ? "highlight" : ""}>
                                                <td style={{ fontWeight: "800", fontSize: "1.1rem" }}>
                                                    {getRankMedal(st.rank)}
                                                </td>
                                                <td style={{ fontWeight: "700", color: "#0f172a" }}>
                                                    {st.name} {isMe && <span style={{ fontSize: "0.75rem", background: "#4f46e5", color: "#fff", padding: "2px 8px", borderRadius: "9999px", marginLeft: "6px" }}>You</span>}
                                                </td>
                                                <td>{st.college}</td>
                                                <td>Year {st.year} ({st.role === "senior" ? "Senior" : "Junior"})</td>
                                                <td>
                                                    <span className={`badge-chip badge-${st.badge || "Newcomer"}`}>
                                                        🏆 {st.badge || "Newcomer"}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: "800", color: "#d97706" }}>
                                                    ⭐ {st.points || 0} pts
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Senior Mentor</th>
                                    <th>College</th>
                                    <th>Skills</th>
                                    <th>Average Rating</th>
                                    <th>Total Ratings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mentors.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                            No mentors with 3 or more ratings yet. (Mentors appear here after receiving at least 3 student ratings - Design D9)
                                        </td>
                                    </tr>
                                ) : (
                                    mentors.map((m) => {
                                        const isMe = user && m._id === user.id;

                                        return (
                                            <tr key={m._id} className={isMe ? "highlight" : ""}>
                                                <td style={{ fontWeight: "800", fontSize: "1.1rem" }}>
                                                    {getRankMedal(m.rank)}
                                                </td>
                                                <td style={{ fontWeight: "700", color: "#0f172a" }}>
                                                    {m.name} {isMe && <span style={{ fontSize: "0.75rem", background: "#4f46e5", color: "#fff", padding: "2px 8px", borderRadius: "9999px", marginLeft: "6px" }}>You</span>}
                                                </td>
                                                <td>{m.college}</td>
                                                <td>
                                                    {m.skills && m.skills.length > 0
                                                        ? m.skills.slice(0, 3).join(", ")
                                                        : "Mentorship"}
                                                </td>
                                                <td style={{ fontWeight: "800", color: "#f59e0b" }}>
                                                    ⭐ {m.avgRating || m.averageRating || 0} / 5
                                                </td>
                                                <td>
                                                    <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: "600" }}>
                                                        {m.ratingCount || m.totalRatings || 0} reviews
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Leaderboard;
