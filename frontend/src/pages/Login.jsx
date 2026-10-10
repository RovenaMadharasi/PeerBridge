import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Sparkles, LogIn } from "lucide-react";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        setError("");

        try {
            setLoading(true);
            const response = await api.post("/auth/login", formData);
            login(response.data.token, response.data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: "480px", paddingTop: "60px" }}>
            <div className="card" style={{ padding: "36px" }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ display: "inline-flex", padding: "12px", background: "#eef2ff", borderRadius: "16px", color: "#4f46e5", marginBottom: "12px" }}>
                        <Sparkles size={32} />
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Welcome to PeerBridge</h1>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "4px" }}>
                        College Peer-Learning & Student Mentorship Platform
                    </p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>College Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="student@college.edu"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "12px", marginTop: "8px" }}
                    >
                        <LogIn size={18} /> {loading ? "Logging in..." : "Sign In to PeerBridge"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "#64748b" }}>
                    Don't have an account?{" "}
                    <Link to="/signup" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;