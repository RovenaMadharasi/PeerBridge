import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Sessions from "./pages/Sessions";
import CreateSession from "./pages/CreateSession";
import MySessions from "./pages/MySessions";
import Leaderboard from "./pages/Leaderboard";
import Resources from "./pages/Resources";
import Quizzes from "./pages/Quizzes";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function AppRoutes() {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: "1.25rem", color: "#4f46e5", fontWeight: "700" }}>PeerBridge</h2>
                    <p style={{ color: "#64748b", marginTop: "4px" }}>Loading application session...</p>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
                <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
                <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </BrowserRouter>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;