import { useState } from "react";
import api from "../api/axios";
import { X, Share2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ShareResourceModal({ onClose, onResourceShared }) {
    const { refreshUser } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState("NOTES");
    const [link, setLink] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !subject.trim() || !link.trim()) {
            setError("Title, Subject, and Link URL are required.");
            return;
        }

        if (!/^https?:\/\/.+/i.test(link.trim())) {
            setError("Resource link must be a valid URL starting with http:// or https://");
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post("/resources", {
                title: title.trim(),
                description: description.trim(),
                subject: subject.trim(),
                type,
                link: link.trim()
            });

            if (refreshUser) refreshUser();
            if (onResourceShared) onResourceShared(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to share resource.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "550px", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Share Study Resource</h2>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: "6px" }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Resource Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Operating Systems Complete Lecture Notes PDF"
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div className="form-group">
                            <label>Subject / Course</label>
                            <input
                                type="text"
                                className="form-control"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Computer Science"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Resource Type</label>
                            <select
                                className="form-control"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="PDF">PDF Document</option>
                                <option value="NOTES">Notes / Cheatsheet</option>
                                <option value="VIDEO">Video Tutorial</option>
                                <option value="GITHUB">GitHub Repository</option>
                                <option value="OTHER">Other Material</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Direct Resource URL (http / https link)</label>
                        <input
                            type="url"
                            className="form-control"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description / Overview</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this resource covers..."
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            <Share2 size={18} /> {submitting ? "Sharing..." : "Share Link (+3 Pts)"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ShareResourceModal;
