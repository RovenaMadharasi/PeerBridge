import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
    Award,
    Clock,
    CheckCircle2,
    FileText,
    HelpCircle,
    Play,
    RotateCcw,
    BookOpen,
    Users
} from "lucide-react";
import QuizAttemptModal from "../components/QuizAttemptModal";
import QuizResultModal from "../components/QuizResultModal";

function Quizzes() {
    const { user } = useAuth();
    const isSenior = user?.role === "senior";

    const [activeTab, setActiveTab] = useState("available"); // 'available' | 'completed' | 'managed'
    const [loading, setLoading] = useState(true);

    const [registeredSessions, setRegisteredSessions] = useState([]);
    const [quizList, setQuizList] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);

    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [viewResultId, setViewResultId] = useState(null);
    const [viewResultData, setViewResultData] = useState(null);

    const fetchQuizHubData = async () => {
        try {
            setLoading(true);

            // Fetch user's registered sessions and created sessions
            const mySessRes = await api.get("/sessions/mine");
            const regSessions = mySessRes.data.registeredSessions || mySessRes.data.sessions || [];
            setRegisteredSessions(regSessions);

            // For each registered session, fetch its quiz status
            const quizPromises = regSessions.map(async (sess) => {
                try {
                    const res = await api.get(`/quizzes/session/${sess._id}`);
                    return {
                        session: sess,
                        quiz: res.data.quiz,
                        attemptStatus: res.data.attemptStatus || "NOT_STARTED",
                        attemptId: res.data.attemptId
                    };
                } catch (err) {
                    return null;
                }
            });

            const results = (await Promise.all(quizPromises)).filter(Boolean);
            setQuizList(results);

            // If senior, fetch quizzes created for mentor's sessions
            if (isSenior) {
                const created = mySessRes.data.createdSessions || [];
                const mentorQuizPromises = created.map(async (sess) => {
                    try {
                        const qRes = await api.get(`/quizzes/session/${sess._id}`);
                        const rRes = await api.get(`/quizzes/${qRes.data.quiz._id}/results`).catch(() => null);
                        return {
                            session: sess,
                            quiz: qRes.data.quiz,
                            resultsData: rRes ? rRes.data : null
                        };
                    } catch (err) {
                        return null;
                    }
                });
                const mResults = (await Promise.all(mentorQuizPromises)).filter(Boolean);
                setCreatedQuizzes(mResults);
            }
        } catch (err) {
            console.error("Fetch quiz hub data error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizHubData();
    }, []);

    const handleViewCompletedResult = async (attemptId) => {
        try {
            const res = await api.get(`/attempts/${attemptId}/result`);
            setViewResultData(res.data);
        } catch (err) {
            console.error("View result error:", err);
        }
    };

    const availableQuizzes = quizList.filter((q) => q.attemptStatus !== "SUBMITTED" && q.attemptStatus !== "AUTO_SUBMITTED");
    const completedQuizzes = quizList.filter((q) => q.attemptStatus === "SUBMITTED" || q.attemptStatus === "AUTO_SUBMITTED");

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Post-Session Quizzes & Assessments</h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Complete quizzes after meeting completion to test your knowledge, earn bonus reward points ⭐ and climb badge tiers
                    </p>
                </div>
            </div>

            {/* Hub Navigation Tabs */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "28px" }}>
                <button
                    onClick={() => setActiveTab("available")}
                    style={{
                        padding: "12px 20px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "available" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "available" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    📝 Available Post-Meeting Quizzes ({availableQuizzes.length})
                </button>

                <button
                    onClick={() => setActiveTab("completed")}
                    style={{
                        padding: "12px 20px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "completed" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "completed" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    ✅ Completed Quizzes & Scorecards ({completedQuizzes.length})
                </button>

                {isSenior && (
                    <button
                        onClick={() => setActiveTab("managed")}
                        style={{
                            padding: "12px 20px",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: activeTab === "managed" ? "#4f46e5" : "#64748b",
                            borderBottom: activeTab === "managed" ? "3px solid #4f46e5" : "3px solid transparent"
                        }}
                    >
                        👨‍🏫 Hosted Quizzes & Student Submissions ({createdQuizzes.length})
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading quizzes...</div>
            ) : activeTab === "available" ? (
                /* Available Quizzes List */
                availableQuizzes.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                        No pending post-meeting quizzes. When your registered session mentors publish a quiz, it will appear here!
                    </div>
                ) : (
                    <div className="grid">
                        {availableQuizzes.map((item) => {
                            const { session, quiz, attemptStatus } = item;
                            const startsAtDate = new Date(session.startsAt);
                            const hasMeetingStarted = startsAtDate <= new Date();

                            return (
                                <div key={quiz._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                                {session.category}
                                            </span>

                                            <span style={{ background: hasMeetingStarted ? "#dcfce7" : "#f1f5f9", color: hasMeetingStarted ? "#15803d" : "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                                {hasMeetingStarted ? "Meeting Finished / In Progress" : "Upcoming Session"}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                                            {quiz.title}
                                        </h3>

                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
                                            Session: <strong>{session.title}</strong> by {session.mentorId?.name}
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                            <div>
                                                <Clock size={14} className="text-indigo-600" /> <strong>Duration:</strong> {quiz.timeLimitMin || 15} Mins
                                            </div>
                                            <div>
                                                <Award size={14} className="text-amber-500" /> <strong>Total Marks:</strong> {quiz.totalMarks || 10}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            onClick={() => setSelectedQuizId(quiz._id)}
                                            className="btn btn-primary"
                                            style={{ width: "100%", padding: "10px" }}
                                        >
                                            {attemptStatus === "IN_PROGRESS" ? (
                                                <>
                                                    <RotateCcw size={18} /> Resume Timed Quiz Attempt
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={18} /> Start Post-Session Quiz (+10-20 Pts)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : activeTab === "completed" ? (
                /* Completed Quizzes List */
                completedQuizzes.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                        You haven't completed any quizzes yet. Complete a quiz to view your score breakdown and earned reward points!
                    </div>
                ) : (
                    <div className="grid">
                        {completedQuizzes.map((item) => {
                            const { session, quiz, attemptId } = item;

                            return (
                                <div key={quiz._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                                ✅ Completed
                                            </span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                {session.subject}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                                            {quiz.title}
                                        </h3>

                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
                                            Session: <strong>{session.title}</strong>
                                        </div>
                                    </div>

                                    <div>
                                        {attemptId && (
                                            <button
                                                onClick={() => handleViewCompletedResult(attemptId)}
                                                className="btn btn-secondary"
                                                style={{ width: "100%", padding: "10px" }}
                                            >
                                                <FileText size={18} /> View Score & Explanations
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* Hosted Quizzes Management for Senior Mentors */
                createdQuizzes.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                        You haven't created any quizzes for your hosted sessions yet. Go to 'My Sessions' to build quizzes!
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {createdQuizzes.map((item) => {
                            const { session, quiz, resultsData } = item;

                            return (
                                <div key={quiz._id} className="card" style={{ padding: "24px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                <span style={{ background: quiz.isPublished ? "#dcfce7" : "#fef3c7", color: quiz.isPublished ? "#166534" : "#b45309", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700" }}>
                                                    {quiz.isPublished ? "Published for Students" : "Draft"}
                                                </span>
                                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                                    {session.title}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>{quiz.title}</h3>
                                        </div>

                                        <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#64748b" }}>
                                            <div>Time Limit: {quiz.timeLimitMin} Mins</div>
                                            <div>Total Questions: {quiz.questions?.length || 0} ({quiz.totalMarks} Marks)</div>
                                        </div>
                                    </div>

                                    {/* Submissions Table */}
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px", color: "#334155" }}>
                                        Student Attempts & Scores ({resultsData?.attemptCount || 0})
                                    </h4>

                                    <div className="table-responsive">
                                        <table className="table" style={{ fontSize: "0.85rem" }}>
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>College & Year</th>
                                                    <th>Score</th>
                                                    <th>Percentage</th>
                                                    <th>Points Awarded</th>
                                                    <th>Submitted At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!resultsData || !resultsData.results || resultsData.results.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                                                            No student submissions recorded yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    resultsData.results.map((stRes) => {
                                                        const studentObj = stRes.studentId || stRes.student || {};
                                                        return (
                                                            <tr key={stRes._id}>
                                                                <td style={{ fontWeight: "700", color: "#0f172a" }}>
                                                                    {studentObj.name || "Student"}
                                                                </td>
                                                                <td>
                                                                    {studentObj.college} (Year {studentObj.year})
                                                                </td>
                                                                <td style={{ fontWeight: "700" }}>
                                                                    {stRes.score} / {quiz.totalMarks}
                                                                </td>
                                                                <td style={{ fontWeight: "700", color: stRes.percent >= 50 ? "#16a34a" : "#dc2626" }}>
                                                                    {stRes.percent}%
                                                                </td>
                                                                <td style={{ fontWeight: "700", color: "#d97706" }}>
                                                                    +{stRes.pointsAwarded || 10} pts
                                                                </td>
                                                                <td style={{ color: "#64748b" }}>
                                                                    {new Date(stRes.submittedAt || stRes.createdAt).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Quiz Attempt Modal */}
            {selectedQuizId && (
                <QuizAttemptModal
                    quizId={selectedQuizId}
                    onClose={() => setSelectedQuizId(null)}
                    onComplete={() => fetchQuizHubData()}
                />
            )}

            {/* Completed Result Review Modal */}
            {viewResultData && (
                <QuizResultModal
                    result={viewResultData}
                    onClose={() => setViewResultData(null)}
                />
            )}
        </div>
    );
}

export default Quizzes;
