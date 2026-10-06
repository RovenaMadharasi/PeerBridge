import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Sessions from "./pages/Sessions";
import CreateSession from "./pages/CreateSession";
import MySessions from "./pages/MySessions";
import RegisteredStudents from "./pages/RegisteredStudents";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar"; 

function App() {
    return (
        <BrowserRouter>
            <Navbar /> 
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
                <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
                <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
                <Route path="/sessions/:id/students" element={<ProtectedRoute><RegisteredStudents /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;