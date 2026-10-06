import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function MySessions() {
    const { token } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [message, setMessage] = useState("");
    const [ratedSessionIds, setRatedSessionIds] = useState([]);
    const [ratingForms, setRatingForms] = useState({});

    const loadMySessions = async () => {
        try {
            const response = await api.get("/sessions/my", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(response.data.sessions);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to load sessions");
        }
    };

    useEffect(() => {
        if (token) loadMySessions();
    }, [token]);

    const openRatingForm = (sessionId) => {
        setRatingForms({
            ...ratingForms,
            [sessionId]: {
                subjectKnowledge: 5,
                explanationQuality: 5,
                communication: 5,
                usefulness: 5,
                overallRating: 5,
                feedback: ""
            }
        });
    };

    const handleRatingChange = (sessionId, field, value) => {
        setRatingForms({
            ...ratingForms,
            [sessionId]: { ...ratingForms[sessionId], [field]: value }
        });
    };

    const submitRating = async (sessionId) => {
        try {
            const response = await api.post(
                "/ratings",
                { sessionId, ...ratingForms[sessionId] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(response.data.message);
            setRatedSessionIds([...ratedSessionIds, sessionId]);

        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to submit rating");
        }
    };

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>My Sessions</h2>

            {message && <p>{message}</p>}
            {sessions.length === 0 && <p>No sessions yet.</p>}

            {sessions.map((session) => (
                <div key={session._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
                    <h3>{session.title}</h3>
                    <p>Subject: {session.subject} | Status: {session.status}</p>
                    <p>Date: {new Date(session.date).toLocaleDateString()} | {session.startTime} - {session.endTime}</p>
                    <p>Seats: {session.registeredStudents.length} / {session.maxStudents}</p>
                    <a href={session.meetingLink} target="_blank" rel="noreferrer">Join Meeting</a>

                    {!ratedSessionIds.includes(session._id) && !ratingForms[session._id] && (
                        <div>
                            <button onClick={() => openRatingForm(session._id)}>Rate this session</button>
                        </div>
                    )}

                    {ratingForms[session._id] && !ratedSessionIds.includes(session._id) && (
                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #ccc" }}>
                            <h4>Rate the Mentor</h4>

                            {["subjectKnowledge", "explanationQuality", "communication", "usefulness", "overallRating"].map((field) => (
                                <div key={field}>
                                    <label>{field} (1-5): </label>
                                    <select
                                        value={ratingForms[session._id][field]}
                                        onChange={(e) => handleRatingChange(session._id, field, Number(e.target.value))}
                                    >
                                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            ))}

                            <textarea
                                placeholder="Feedback (optional)"
                                value={ratingForms[session._id].feedback}
                                onChange={(e) => handleRatingChange(session._id, "feedback", e.target.value)}
                            />

                            <button onClick={() => submitRating(session._id)}>Submit Rating</button>
                        </div>
                    )}

                    {ratedSessionIds.includes(session._id) && <p><em>You rated this session.</em></p>}
                </div>
            ))}
        </div>
    );
}

export default MySessions;