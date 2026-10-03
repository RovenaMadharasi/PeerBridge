import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Profile() {
    const { token, logout } = useAuth();

    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        bio: "",
        skills: "",
        photo: ""
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        const getProfile = async () => {
            try {
                const response = await api.get(
                    "/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const profile = response.data.user;

                setUser(profile);

                setFormData({
                    bio: profile.bio || "",
                    skills: profile.skills?.join(", ") || "",
                    photo: profile.photo || ""
                });

            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Failed to load profile"
                );
            }
        };

        if (token) {
            getProfile();
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.put(
                "/auth/profile",
                {
                    bio: formData.bio,
                    skills: formData.skills
                        .split(",")
                        .map(skill => skill.trim())
                        .filter(skill => skill !== ""),
                    photo: formData.photo
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUser(response.data.user);
            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update profile"
            );
        }
    };

    if (!user) {
        return <p>{message || "Loading profile..."}</p>;
    }

    return (
        <div>
            <h1>PeerBridge</h1>

            <h2>My Profile</h2>

            <button onClick={logout}>
                Logout
            </button>

            <p>
                <strong>Name:</strong> {user.name}
            </p>

            <p>
                <strong>Email:</strong> {user.email}
            </p>

            <p>
                <strong>Role:</strong> {user.role}
            </p>

            <p>
                <strong>College:</strong> {user.college}
            </p>

            <p>
                <strong>Year:</strong> {user.year}
            </p>

            <h3>Edit Profile</h3>

            <form onSubmit={handleSubmit}>
                <textarea
                    name="bio"
                    placeholder="Bio"
                    value={formData.bio}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="skills"
                    placeholder="Skills separated by commas"
                    value={formData.skills}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="photo"
                    placeholder="Photo URL"
                    value={formData.photo}
                    onChange={handleChange}
                />

                <button type="submit">
                    Save Profile
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Profile;