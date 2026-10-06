import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function CreateSession() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState(null);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Academic",
        subject: "",
        topic: "",
        difficulty: "Beginner",
        date: "",
        startTime: "",
        endTime: "",
        meetingPlatform: "Google Meet",
        meetingLink: "",
        maxStudents: 30,
        tags: ""
    });

    useEffect(() => {
        const checkRole = async () => {
            try {
                const response = await api.get("/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRole(response.data.user.role);
            } catch (error) {
                setMessage("Failed to verify your account");
            }
        };

        if (token) checkRole();
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post(
                "/sessions",
                {
                    ...formData,
                    maxStudents: Number(formData.maxStudents),
                    tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t !== "")
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(response.data.message);
            navigate("/my-sessions");

        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to create session");
        }
    };

    if (role === null) {
        return <p>{message || "Loading..."}</p>;
    }

    if (role !== "senior") {
        return <p>Only senior students can create sessions.</p>;
    }

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>Create a Learning Session</h2>

            <form onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="Session Title" value={formData.title} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />

                <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="Academic">Academic</option>
                    <option value="Career Preparation">Career Preparation</option>
                </select>

                <input type="text" name="subject" placeholder="Subject (e.g. DBMS)" value={formData.subject} onChange={handleChange} required />
                <input type="text" name="topic" placeholder="Topic (e.g. Normalization)" value={formData.topic} onChange={handleChange} />

                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>

                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />

                <select name="meetingPlatform" value={formData.meetingPlatform} onChange={handleChange}>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Other">Other</option>
                </select>

                <input type="text" name="meetingLink" placeholder="Meeting Link" value={formData.meetingLink} onChange={handleChange} required />
                <input type="number" name="maxStudents" min="1" value={formData.maxStudents} onChange={handleChange} required />
                <input type="text" name="tags" placeholder="Tags separated by commas" value={formData.tags} onChange={handleChange} />

                <button type="submit">Create Session</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default CreateSession;