import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid #ccc",
            marginBottom: "20px"
        }}>
            <Link to="/" style={{ fontWeight: "bold" }}>PeerBridge</Link>

            {isLoggedIn ? (
                <>
                    <Link to="/sessions">Explore Sessions</Link>
                    <Link to="/create-session">Create Session</Link>
                    <Link to="/my-sessions">My Sessions</Link>
                    <Link to="/profile">Profile</Link>

                    <button
                        onClick={handleLogout}
                        style={{ marginLeft: "auto" }}
                    >
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Sign Up</Link>
                </>
            )}
        </nav>
    );
}

export default Navbar;