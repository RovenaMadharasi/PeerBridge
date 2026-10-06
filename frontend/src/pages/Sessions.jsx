import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Sessions() {
    const { token } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [filters, setFilters] = useState({ category: "", subject: "", difficulty: "", search: "" });
    const [message, setMessage] = useState("");

    const loadSessions = async () => {
        try {
            const params = {};
            if (filters.category) params.category = filters.category;
            if (filters.subject) params.subject = filters.subject;
            if (filters.difficulty) params.difficulty = filters.difficulty;
            if (filters.search) params.search = filters.search;

            const response = await api.get("/sessions", { params });
            setSessions(response.data.sessions);

        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to load sessions");
        }
    };

    useEffect(() => {
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleRegister = async (sessionId) => {
        try {
            const response = await api.post(
                `/sessions/${sessionId}/register`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(response.data.message);
            loadSessions();

        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to register");
        }
    };

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>Explore Sessions</h2>

            <div>
                <input type="text" name="search" placeholder="Search by title" value={filters.search} onChange={handleFilterChange} />

                <select name="category" value={filters.category} onChange={handleFilterChange}>
                    <option value="">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Career Preparation">Career Preparation</option>
                </select>

                <input type="text" name="subject" placeholder="Subject" value={filters.subject} onChange={handleFilterChange} />

                <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
                    <option value="">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>

                <button onClick={loadSessions}>Apply Filters</button>
            </div>

            {message && <p>{message}</p>}
            {sessions.length === 0 && <p>No sessions found.</p>}

            {sessions.map((session) => (
                <div key={session._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
                    <h3>{session.title}</h3>
                    <p>Mentor: {session.mentorId?.name} ({session.mentorId?.college})</p>
                    <p>Subject: {session.subject} | Difficulty: {session.difficulty}</p>
                    <p>Date: {new Date(session.date).toLocaleDateString()} | {session.startTime} - {session.endTime}</p>
                    <p>Seats: {session.registeredStudents.length} / {session.maxStudents}</p>

                    <button onClick={() => handleRegister(session._id)}>Register Now</button>
                </div>
            ))}
        </div>
    );
}

export default Sessions;