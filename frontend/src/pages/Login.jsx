import { useState } from "react";
import { useNavigate } from "react-router-dom";   // ADD THIS LINE
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post(
                "/auth/login",
                formData
            );

            login(
                response.data.token,
                response.data.user
            );

            setMessage(response.data.message);
            navigate("/sessions"); 

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Login failed"
            );
        }
    };

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                />

                <button type="submit">
                    Login
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;