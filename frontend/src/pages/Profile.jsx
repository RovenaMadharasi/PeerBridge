import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
    User,
    Award,
    Star,
    Save,
    CheckCircle2,
    Calendar,
    Globe,
    Code,
    Share2
} from "lucide-react";

function Profile() {
    const { user, refreshUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [bio, setBio] = useState("");
    const [skillsText, setSkillsText] = useState("");
    const [socialLinks, setSocialLinks] = useState({
        github: "",
        linkedin: "",
        twitter: ""
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users/me");
            const u = res.data.user;
            setProfileData(res.data);

            setBio(u.bio || "");
            setSkillsText(u.skills ? u.skills.join(", ") : "");
            setSocialLinks(u.socialLinks || { github: "", linkedin: "", twitter: "" });
        } catch (err) {
            console.error("Fetch profile error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMessage(null);

        try {
            setSaving(true);
            const skillsArray = skillsText.split(",").map((s) => s.trim()).filter(Boolean);

            await api.put("/auth/profile", {
                bio,
                skills: skillsArray,
                socialLinks
            });

            setMessage({ type: "success", text: "Profile updated successfully!" });
            if (refreshUser) refreshUser();
            fetchProfile();
        } catch (err) {
            setMessage({ type: "danger", text: err.response?.data?.message || "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const userData = profileData?.user || user;

    return (
        <div className="container" style={{ maxWidth: "900px" }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Student Profile & Settings</h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    Manage your bio, skills, campus achievements, and view point transaction history
                </p>
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading profile...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px" }}>
                    {/* Left Column: User Summary Card */}
                    <div>
                        <div className="card" style={{ textAlign: "center", padding: "28px", marginBottom: "24px" }}>
                            <div
                                style={{
                                    width: "84px",
                                    height: "84px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                                    color: "#fff",
                                    fontSize: "2.2rem",
                                    fontWeight: "800",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px"
                                }}
                            >
                                {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
                            </div>

                            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a" }}>{userData?.name}</h2>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px" }}>
                                {userData?.email}
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                                <span className={`badge-chip badge-${userData?.badge || "Newcomer"}`}>
                                    🏆 {userData?.badge || "Newcomer"}
                                </span>
                                <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "700" }}>
                                    ⭐ {userData?.points || 0} pts
                                </span>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "left", fontSize: "0.85rem" }}>
                                <div style={{ marginBottom: "6px" }}>
                                    <strong>College:</strong> {userData?.college}
                                </div>
                                <div style={{ marginBottom: "6px" }}>
                                    <strong>Year of Study:</strong> Year {userData?.year} ({userData?.role === "senior" ? "Senior Mentor" : "Junior Student"})
                                </div>
                                <div>
                                    <strong>Student Rank:</strong> #{profileData?.rank || 1}
                                </div>
                                {userData?.role === "senior" && (
                                    <div style={{ marginTop: "6px", color: "#b45309" }}>
                                        <strong>Mentor Rating:</strong> ⭐ {userData?.avgRating || userData?.averageRating || 0} ({userData?.ratingCount || userData?.totalRatings || 0} reviews)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Edit Bio, Skills, Social Links & Points Audit Log */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div className="card" style={{ padding: "28px" }}>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "20px", color: "#0f172a" }}>
                                Edit Bio & Skills
                            </h3>

                            <form onSubmit={handleSaveProfile}>
                                <div className="form-group">
                                    <label>Bio / About Yourself</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Share a brief overview of your academic interests, subjects, or mentorship areas..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Skills & Expertise (Comma separated)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={skillsText}
                                        onChange={(e) => setSkillsText(e.target.value)}
                                        placeholder="Python, Data Structures, Web Development, SQL"
                                    />
                                </div>

                                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginTop: "20px", marginBottom: "12px", color: "#334155" }}>
                                    Social & Online Profiles
                                </h4>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="form-group">
                                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Code size={16} /> GitHub Username
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={socialLinks.github}
                                            onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                                            placeholder="octocat"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Globe size={16} /> LinkedIn Username
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={socialLinks.linkedin}
                                            onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                            placeholder="in/john-doe"
                                        />
                                    </div>
                                </div>

                                <div style={{ textAlign: "right", marginTop: "16px" }}>
                                    <button type="submit" disabled={saving} className="btn btn-primary">
                                        <Save size={18} /> {saving ? "Saving Changes..." : "Save Profile"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Points Audit Log Table */}
                        {profileData?.transactions && (
                            <div className="card" style={{ padding: "24px" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>
                                    Point Transactions Audit Log
                                </h3>

                                <div className="table-responsive">
                                    <table className="table" style={{ fontSize: "0.85rem" }}>
                                        <thead>
                                            <tr>
                                                <th>Action</th>
                                                <th>Points Awarded</th>
                                                <th>Date & Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profileData.transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                                                        No point transactions recorded yet. Take quizzes, attend sessions, rate mentors, or share study materials to earn points!
                                                    </td>
                                                </tr>
                                            ) : (
                                                profileData.transactions.map((tx) => (
                                                    <tr key={tx._id}>
                                                        <td style={{ fontWeight: "600", color: "#334155" }}>
                                                            {tx.action.replace("_", " ")}
                                                        </td>
                                                        <td style={{ fontWeight: "800", color: "#059669" }}>
                                                            +{tx.points} pts
                                                        </td>
                                                        <td style={{ color: "#64748b" }}>
                                                            {new Date(tx.createdAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;