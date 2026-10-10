import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { UserPlus, Sparkles, ShieldCheck } from "lucide-react";

function Signup() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        college: "",
        year: 1
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

    const computedRole = Number(formData.year) <= 2 ? "junior" : "senior";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);
            const response = await api.post("/auth/register", {
                ...formData,
                year: Number(formData.year)
            });

            login(response.data.token, response.data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: "520px", paddingTop: "40px" }}>
            <div className="card" style={{ padding: "36px" }}>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ display: "inline-flex", padding: "12px", background: "#eef2ff", borderRadius: "16px", color: "#4f46e5", marginBottom: "12px" }}>
                        <Sparkles size={32} />
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Join PeerBridge</h1>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "4px" }}>
                        Connect, Learn & Mentor on your Campus
                    </p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>College Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="john@college.edu"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password (min 6 characters)</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>College / University Name</label>
                        <input
                            type="text"
                            name="college"
                            className="form-control"
                            placeholder="ABC Institute of Technology"
                            value={formData.college}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Year of Study (1 to 4)</label>
                        <select
                            name="year"
                            className="form-control"
                            value={formData.year}
                            onChange={handleChange}
                            required
                        >
                            <option value={1}>1st Year (Junior Student)</option>
                            <option value={2}>2nd Year (Junior Student)</option>
                            <option value={3}>3rd Year (Senior Mentor)</option>
                            <option value={4}>4th Year (Senior Mentor)</option>
                        </select>
                    </div>

                    {/* Server Role Preview Badge (Design D1) */}
                    <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <ShieldCheck size={20} className="text-indigo-600" />
                        <div>
                            <strong>Assigned Platform Role:</strong>{" "}
                            <span style={{ color: "#4f46e5", fontWeight: "700", textTransform: "capitalize" }}>
                                {computedRole}
                            </span>
                            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                                {computedRole === "junior"
                                    ? "Years 1-2 can register for sessions, take timed quizzes, and rate mentors."
                                    : "Years 3-4 can create & host sessions, build quizzes, and rank on Mentor Leaderboard."}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "12px" }}
                    >
                        <UserPlus size={18} /> {loading ? "Creating Account..." : "Create Free Account"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "#64748b" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;