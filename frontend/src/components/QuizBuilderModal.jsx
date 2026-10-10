import { useState, useEffect } from "react";
import api from "../api/axios";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";

function QuizBuilderModal({ session, existingQuiz, onClose, onSaveSuccess }) {
    const [title, setTitle] = useState(existingQuiz ? existingQuiz.title : `Quiz for ${session.title}`);
    const [timeLimitMin, setTimeLimitMin] = useState(existingQuiz ? existingQuiz.timeLimitMin : 15);
    const [isPublished, setIsPublished] = useState(existingQuiz ? existingQuiz.isPublished : true);
    const [questions, setQuestions] = useState(
        existingQuiz && existingQuiz.questions && existingQuiz.questions.length > 0
            ? existingQuiz.questions.map((q) => ({
                  question: q.question,
                  options: q.options || ["", ""],
                  correctIndex: q.correctIndex !== undefined ? q.correctIndex : (q.correctAnswer || 0),
                  marks: q.marks || 1,
                  explanation: q.explanation || ""
              }))
            : [
                  {
                      question: "",
                      options: ["Option 1", "Option 2"],
                      correctIndex: 0,
                      marks: 1,
                      explanation: ""
                  }
              ]
    );

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question: "",
                options: ["Option 1", "Option 2"],
                correctIndex: 0,
                marks: 1,
                explanation: ""
            }
        ]);
    };

    const removeQuestion = (qIndex) => {
        if (questions.length <= 1) {
            setError("Quiz must contain at least one question.");
            return;
        }
        setQuestions(questions.filter((_, idx) => idx !== qIndex));
    };

    const handleQuestionChange = (qIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex][field] = value;
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
    };

    const addOption = (qIndex) => {
        const updated = [...questions];
        if (updated[qIndex].options.length >= 6) return;
        updated[qIndex].options.push(`Option ${updated[qIndex].options.length + 1}`);
        setQuestions(updated);
    };

    const removeOption = (qIndex, oIndex) => {
        const updated = [...questions];
        if (updated[qIndex].options.length <= 2) return;
        updated[qIndex].options.splice(oIndex, 1);
        if (updated[qIndex].correctIndex >= updated[qIndex].options.length) {
            updated[qIndex].correctIndex = 0;
        }
        setQuestions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Quiz title is required.");
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                setError(`Question ${i + 1} is empty.`);
                return;
            }
            if (q.options.some((o) => !o.trim())) {
                setError(`Question ${i + 1} has empty option choices.`);
                return;
            }
        }

        try {
            setSubmitting(true);
            const payload = {
                sessionId: session._id,
                title: title.trim(),
                timeLimitMin: Number(timeLimitMin),
                isPublished,
                questions
            };

            if (existingQuiz && existingQuiz._id) {
                await api.put(`/quizzes/${existingQuiz._id}`, payload);
            } else {
                await api.post("/quizzes", payload);
            }

            onSaveSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "750px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                        {existingQuiz ? "Edit Quiz" : "Build Quiz"} for {session.title}
                    </h2>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: "6px" }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Quiz Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Data Structures & Algorithms Quick Assessment"
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Time Limit (Minutes)</label>
                            <input
                                type="number"
                                min="1"
                                max="180"
                                className="form-control"
                                value={timeLimitMin}
                                onChange={(e) => setTimeLimitMin(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ display: "flex", alignItems: "center", paddingTop: "28px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                    style={{ width: "18px", height: "18px" }}
                                />
                                <span style={{ fontWeight: "600" }}>Publish Quiz for Students Immediately</span>
                            </label>
                        </div>
                    </div>

                    <hr style={{ margin: "20px 0", borderColor: "#e2e8f0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>Questions ({questions.length})</h3>
                        <button type="button" onClick={addQuestion} className="btn btn-secondary" style={{ padding: "6px 12px" }}>
                            <Plus size={16} /> Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontWeight: "700", color: "#4f46e5" }}>Question {qIndex + 1}</span>
                                <button type="button" onClick={() => removeQuestion(qIndex)} className="btn btn-danger" style={{ padding: "4px 8px" }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="form-group">
                                <label>Question Text</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                                    placeholder="Enter question prompt..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Options & Select Correct Answer (Radio)</label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                        <input
                                            type="radio"
                                            name={`correct_${qIndex}`}
                                            checked={q.correctIndex === oIndex}
                                            onChange={() => handleQuestionChange(qIndex, "correctIndex", oIndex)}
                                            style={{ width: "18px", height: "18px" }}
                                            title="Mark as correct answer"
                                        />
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            required
                                        />
                                        {q.options.length > 2 && (
                                            <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="btn btn-outline" style={{ padding: "4px 8px" }}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {q.options.length < 6 && (
                                    <button type="button" onClick={() => addOption(qIndex)} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem", marginTop: "6px" }}>
                                        + Add Option
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Explanation for Correct Answer (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={q.explanation}
                                    onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                                    placeholder="Provide brief explanation why this choice is correct..."
                                />
                            </div>
                        </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            <CheckCircle2 size={18} /> {submitting ? "Saving..." : "Save Quiz"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default QuizBuilderModal;
