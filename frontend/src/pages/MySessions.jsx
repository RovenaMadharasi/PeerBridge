import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function MySessions() {
    const { token } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
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

        if (token) loadMySessions();
    }, [token]);

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
                </div>
            ))}
        </div>
    );
}

export default MySessions;