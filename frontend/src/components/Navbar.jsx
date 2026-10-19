import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    BookOpen,
    Award,
    FolderGit2,
    Calendar,
    User,
    LogOut,
    Sparkles,
    ShieldCheck,
    FileText
} from "lucide-react";

function Navbar() {
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    // Hide navbar entirely on auth pages
    const authRoutes = ["/login", "/signup"];
    if (authRoutes.includes(location.pathname)) return null;

    return (
        <header className="navbar">
            <Link to={isLoggedIn ? "/dashboard" : "/login"} className="nav-brand">
                <Sparkles size={24} className="text-indigo-400" />
                <span>Peer</span>Bridge
            </Link>

            {isLoggedIn && (
                <>
                    <nav className="nav-links">
                        <Link
                            to="/dashboard"
                            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                        >
                            <Calendar size={18} /> Dashboard
                        </Link>

                        <Link
                            to="/sessions"
                            className={`nav-link ${isActive("/sessions") ? "active" : ""}`}
                        >
                            <BookOpen size={18} /> Sessions
                        </Link>

                        <Link
                            to="/quizzes"
                            className={`nav-link ${isActive("/quizzes") ? "active" : ""}`}
                        >
                            <FileText size={18} /> Quizzes
                        </Link>

                        <Link
                            to="/leaderboard"
                            className={`nav-link ${isActive("/leaderboard") ? "active" : ""}`}
                        >
                            <Award size={18} /> Leaderboards
                        </Link>

                        <Link
                            to="/resources"
                            className={`nav-link ${isActive("/resources") ? "active" : ""}`}
                        >
                            <FolderGit2 size={18} /> Resources
                        </Link>

                        <Link
                            to="/my-sessions"
                            className={`nav-link ${isActive("/my-sessions") ? "active" : ""}`}
                        >
                            <ShieldCheck size={18} /> My Sessions
                        </Link>
                    </nav>

                    <div className="nav-user">
                        {user && (
                            <>
                                <div className={`badge-chip badge-${user.badge || "Newcomer"}`}>
                                    🏆 {user.badge || "Newcomer"}
                                </div>
                                <div className="points-pill" title="Your total reward points">
                                    ⭐ {user.points || 0} pts
                                </div>
                            </>
                        )}

                        <Link
                            to="/profile"
                            className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                            title="Profile Settings"
                        >
                            <User size={20} />
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ color: "#f87171", borderColor: "#334155", padding: "6px 12px" }}
                            title="Sign Out"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </>
            )}

            {!isLoggedIn && (
                <div className="nav-links">
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/signup" className="btn btn-primary" style={{ padding: "8px 16px" }}>Sign Up</Link>
                </div>
            )}
        </header>
    );
}

export default Navbar;