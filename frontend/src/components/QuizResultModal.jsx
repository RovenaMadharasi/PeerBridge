import { X, Award, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function QuizResultModal({ result, onClose }) {
    const { refreshUser } = useAuth();

    const handleClose = () => {
        if (refreshUser) refreshUser();
        if (onClose) onClose();
    };

    const percent = result.percent || 0;
    const isPassed = percent >= 50;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "750px", padding: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>Quiz Results & Assessment</h2>
                    <button onClick={handleClose} className="btn btn-outline" style={{ padding: "6px" }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Score Header Card */}
                <div
                    style={{
                        background: isPassed ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                        color: "#fff",
                        padding: "24px",
                        borderRadius: "16px",
                        textAlign: "center",
                        marginBottom: "28px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)"
                    }}
                >
                    <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "4px" }}>
                        {result.score} / {result.totalMarks} ({percent}%)
                    </div>
                    <div style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "16px" }}>
                        {isPassed ? "🎉 Outstanding Performance!" : "Good effort! Keep learning and practicing."}
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                        <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600" }}>
                            ⭐ +{result.pointsAwarded || 0} Reward Points Earned
                        </div>

                        {result.userBadge && (
                            <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600" }}>
                                🏆 Badge Tier: {result.userBadge}
                            </div>
                        )}
                    </div>
                </div>

                {/* Question-by-Question Review */}
                {result.review && Array.isArray(result.review) && (
                    <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
                            Question Review & Detailed Explanations
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {result.review.map((item, idx) => {
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            border: `1px solid ${item.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                                            background: item.isCorrect ? "#f0fdf4" : "#fef2f2",
                                            padding: "18px",
                                            borderRadius: "12px"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                                            {item.isCorrect ? (
                                                <CheckCircle2 size={22} style={{ color: "#16a34a", marginTop: "2px", flexShrink: 0 }} />
                                            ) : (
                                                <XCircle size={22} style={{ color: "#dc2626", marginTop: "2px", flexShrink: 0 }} />
                                            )}
                                            <div>
                                                <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a" }}>
                                                    Q{idx + 1}. {item.question}
                                                </h4>
                                                <span style={{ fontSize: "0.8rem", color: item.isCorrect ? "#15803d" : "#b91c1c", fontWeight: "600" }}>
                                                    {item.isCorrect ? `Correct (+${item.marks || 1} mark)` : `Incorrect (0 marks)`}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ paddingLeft: "32px", fontSize: "0.9rem" }}>
                                            <div style={{ marginBottom: "6px" }}>
                                                <strong>Your Answer:</strong>{" "}
                                                <span style={{ color: item.isCorrect ? "#15803d" : "#dc2626" }}>
                                                    {item.selectedIndex !== null && item.options ? item.options[item.selectedIndex] : "No answer selected"}
                                                </span>
                                            </div>

                                            {!item.isCorrect && item.options && item.correctIndex !== undefined && (
                                                <div style={{ marginBottom: "6px", color: "#15803d" }}>
                                                    <strong>Correct Answer:</strong> {item.options[item.correctIndex]}
                                                </div>
                                            )}

                                            {item.explanation && (
                                                <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)", marginTop: "10px" }}>
                                                    <strong>Mentor Explanation:</strong> {item.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: "right", marginTop: "28px" }}>
                    <button onClick={handleClose} className="btn btn-primary" style={{ padding: "10px 24px" }}>
                        Close & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizResultModal;
