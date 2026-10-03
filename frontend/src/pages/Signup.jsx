import { useState } from "react";
import api from "../api/axios";

function Signup() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "junior",
        college: "",
        year: 1
    });

    const [message, setMessage] = useState("");

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
                "/auth/signup",
                formData
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Signup failed"
            );
        }
    };

    return (
        <div>
            <h1>PeerBridge</h1>
            <h2>Create Account</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                />

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

                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                >
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                </select>

                <input
                    type="text"
                    name="college"
                    placeholder="College"
                    value={formData.college}
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="year"
                    min="1"
                    max="4"
                    placeholder="Year"
                    value={formData.year}
                    onChange={handleChange}
                />

                <button type="submit">
                    Sign Up
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Signup;