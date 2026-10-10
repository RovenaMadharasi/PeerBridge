import { useState, useEffect } from "react";
import api from "../api/axios";
import { X, Users, Award } from "lucide-react";

function RegisteredStudentsModal({ sessionId, sessionTitle, onClose }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/sessions/${sessionId}/students`);
                setStudents(res.data.students || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load registered students.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [sessionId]);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "600px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Registered Students</h2>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{sessionTitle}</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: "6px" }}>
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px" }}>Loading students...</div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : students.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                        No students have registered for this session yet.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {students.map((st, idx) => (
                            <div
                                key={st._id || idx}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "14px 18px",
                                    background: "#f8fafc",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            background: "#e0e7ff",
                                            color: "#4338ca",
                                            fontWeight: "700",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        {st.name ? st.name.charAt(0).toUpperCase() : "S"}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "600", color: "#0f172a" }}>{st.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            {st.college} • Year {st.year} ({st.year <= 2 ? "Junior" : "Senior"})
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span className={`badge-chip badge-${st.badge || "Newcomer"}`}>
                                        {st.badge || "Newcomer"}
                                    </span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f59e0b" }}>
                                        ⭐ {st.points || 0} pts
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ textAlign: "right", marginTop: "24px" }}>
                    <button onClick={onClose} className="btn btn-outline">Close</button>
                </div>
            </div>
        </div>
    );
}

export default RegisteredStudentsModal;
