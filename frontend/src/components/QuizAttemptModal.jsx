import { useState, useEffect } from "react";
import api from "../api/axios";
import QuizTimer from "./QuizTimer";
import QuizResultModal from "./QuizResultModal";
import { X, CheckCircle, Save } from "lucide-react";

function QuizAttemptModal({ quizId, onClose, onComplete }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [attemptData, setAttemptData] = useState(null);
    const [answers, setAnswers] = useState({}); // { qIndex: selectedIndex }
    const [currentQIndex, setCurrentQIndex] = useState(0);

    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [resultData, setResultData] = useState(null);

    // Start or load attempt
    useEffect(() => {
        const startAttempt = async () => {
            try {
                setLoading(true);
                const res = await api.post(`/quizzes/${quizId}/start`);
                setAttemptData(res.data);

                // Populate existing saved answers
                if (res.data.answers && Array.isArray(res.data.answers)) {
                    const ansMap = {};
                    res.data.answers.forEach((a) => {
                        ansMap[a.questionIndex] = a.selectedIndex;
                    });
                    setAnswers(ansMap);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to start quiz attempt.");
            } finally {
                setLoading(false);
            }
        };

        startAttempt();
    }, [quizId]);

    // Handle Option Selection & Autosave
    const handleSelectOption = async (qIndex, oIndex) => {
        const updated = { ...answers, [qIndex]: oIndex };
        setAnswers(updated);

        // Autosave answer to server (PATCH /api/attempts/:id/answer)
        if (attemptData && attemptData.attemptId) {
            try {
                setSaving(true);
                await api.patch(`/attempts/${attemptData.attemptId}/answer`, {
                    questionIndex: qIndex,
                    selectedIndex: oIndex
                });
            } catch (err) {
                console.error("Autosave error:", err);
            } finally {
                setSaving(false);
            }
        }
    };

    // Submit Quiz Attempt
    const handleSubmitQuiz = async () => {
        if (!attemptData || !attemptData.attemptId) return;

        try {
            setSubmitting(true);

            // Format answers array
            const formattedAnswers = Object.keys(answers).map((qIdx) => ({
                questionIndex: Number(qIdx),
                selectedIndex: Number(answers[qIdx])
            }));

            const res = await api.post(`/attempts/${attemptData.attemptId}/submit`, {
                answers: formattedAnswers
            });

            setResultData(res.data);
            if (onComplete) onComplete(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Auto-submit when Timer expires
    const handleTimerExpire = () => {
        if (!resultData && !submitting) {
            handleSubmitQuiz();
        }
    };

    if (resultData) {
        return (
            <QuizResultModal
                result={resultData}
                onClose={() => {
                    setResultData(null);
                    onClose();
                }}
            />
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "800px", padding: "28px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>Starting quiz attempt...</div>
                ) : error ? (
                    <div>
                        <div className="alert alert-danger">{error}</div>
                        <div style={{ textAlign: "right", marginTop: "20px" }}>
                            <button onClick={onClose} className="btn btn-outline">Close</button>
                        </div>
                    </div>
                ) : attemptData ? (
                    <>
                        {/* Header with Title and Server Countdown Timer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{attemptData.title}</h2>
                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    Question {currentQIndex + 1} of {attemptData.questions.length}
                                </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                {saving && (
                                    <span style={{ fontSize: "0.8rem", color: "#6366f1", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Save size={14} /> Autosaving...
                                    </span>
                                )}
                                <QuizTimer deadlineAt={attemptData.deadlineAt} onExpire={handleTimerExpire} />
                                <button onClick={onClose} className="btn btn-outline" style={{ padding: "6px" }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <hr style={{ margin: "16px 0", borderColor: "#e2e8f0" }} />

                        {/* Question Navigator Pills */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                            {attemptData.questions.map((q, idx) => {
                                const isAnswered = answers[idx] !== undefined;
                                const isCurrent = currentQIndex === idx;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQIndex(idx)}
                                        style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "8px",
                                            fontWeight: "700",
                                            border: isCurrent ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                                            background: isCurrent ? "#eef2ff" : isAnswered ? "#dcfce7" : "#fff",
                                            color: isCurrent ? "#4f46e5" : isAnswered ? "#15803d" : "#475569",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Current Question Card */}
                        {attemptData.questions[currentQIndex] && (
                            <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "16px" }}>
                                    Q{currentQIndex + 1}. {attemptData.questions[currentQIndex].question}
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {attemptData.questions[currentQIndex].options.map((opt, oIdx) => {
                                        const isSelected = answers[currentQIndex] === oIdx;

                                        return (
                                            <div
                                                key={oIdx}
                                                onClick={() => handleSelectOption(currentQIndex, oIdx)}
                                                style={{
                                                    padding: "14px 18px",
                                                    borderRadius: "10px",
                                                    border: `2px solid ${isSelected ? "#4f46e5" : "#e2e8f0"}`,
                                                    background: isSelected ? "#eef2ff" : "#fff",
                                                    cursor: "pointer",
                                                    fontWeight: isSelected ? "600" : "400",
                                                    color: isSelected ? "#3730a3" : "#1e293b",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    transition: "all 0.15s ease"
                                                }}
                                            >
                                                <span>{opt}</span>
                                                {isSelected && <CheckCircle size={20} className="text-indigo-600" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Question Navigation Controls */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
                            <button
                                disabled={currentQIndex === 0}
                                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                                className="btn btn-outline"
                            >
                                Previous
                            </button>

                            {currentQIndex < attemptData.questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQIndex((prev) => Math.min(attemptData.questions.length - 1, prev + 1))}
                                    className="btn btn-primary"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitQuiz}
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ background: "#10b981" }}
                                >
                                    {submitting ? "Submitting..." : "Submit Quiz Final"}
                                </button>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default QuizAttemptModal;
