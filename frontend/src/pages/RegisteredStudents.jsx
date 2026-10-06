import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function RegisteredStudents() {
    const { id } = useParams();
    const { token } = useAuth();
    const [students, setStudents] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const response = await api.get(`/sessions/${id}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(response.data.students);
            } catch (error) {
                setMessage(error.response?.data?.message || "Failed to load students");
            }
        };

        if (token) loadStudents();
    }, [token, id]);

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>Registered Students</h2>

            {message && <p>{message}</p>}
            {students.length === 0 && <p>No students registered yet.</p>}

            <table border="1" cellPadding="8">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>College</th>
                        <th>Year</th>
                        <th>Registered On</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((entry) => (
                        <tr key={entry.student._id}>
                            <td>{entry.student.name}</td>
                            <td>{entry.student.college}</td>
                            <td>{entry.student.year}</td>
                            <td>{new Date(entry.registeredAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default RegisteredStudents;