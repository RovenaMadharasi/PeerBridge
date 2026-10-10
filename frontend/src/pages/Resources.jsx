import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
    FolderGit2,
    Search,
    Share2,
    ThumbsUp,
    Bookmark,
    ExternalLink,
    FileText,
    Video,
    Code,
    BookOpen
} from "lucide-react";
import ShareResourceModal from "../components/ShareResourceModal";

function Resources() {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'bookmarks'

    const [resources, setResources] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState("");

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (search) query.append("search", search);
            if (subject) query.append("subject", subject);
            if (type) query.append("type", type);

            const [resData, bmarkData] = await Promise.all([
                api.get(`/resources?${query.toString()}`),
                api.get("/resources/bookmarks")
            ]);

            setResources(resData.data.resources || []);
            setBookmarks(bmarkData.data.bookmarks || []);
        } catch (err) {
            console.error("Fetch resources error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [subject, type, activeTab]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchResources();
    };

    // Toggle Upvote (TC21)
    const handleToggleUpvote = async (resourceId) => {
        try {
            const res = await api.post(`/resources/${resourceId}/upvote`);
            setResources((prev) =>
                prev.map((r) => {
                    if (r._id === resourceId) {
                        return {
                            ...r,
                            isUpvoted: res.data.isUpvoted,
                            upvoteCount: res.data.upvoteCount
                        };
                    }
                    return r;
                })
            );
        } catch (err) {
            console.error("Upvote toggle error:", err);
        }
    };

    // Toggle Bookmark
    const handleToggleBookmark = async (resourceId) => {
        try {
            const res = await api.post(`/resources/${resourceId}/bookmark`);
            setResources((prev) =>
                prev.map((r) => {
                    if (r._id === resourceId) {
                        return { ...r, isBookmarked: res.data.isBookmarked };
                    }
                    return r;
                })
            );
            fetchResources();
        } catch (err) {
            console.error("Bookmark toggle error:", err);
        }
    };

    const getTypeIcon = (t) => {
        switch (t) {
            case "PDF": return <FileText size={18} className="text-red-500" />;
            case "VIDEO": return <Video size={18} className="text-blue-500" />;
            case "GITHUB": return <Code size={18} className="text-purple-500" />;
            default: return <BookOpen size={18} className="text-indigo-500" />;
        }
    };

    const displayList = activeTab === "bookmarks" ? bookmarks : resources;

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>Central Resource Hub</h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Access shared lecture notes, PDFs, code repos, and study materials (+3 Pts for sharing)
                    </p>
                </div>

                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Share2 size={18} /> Share Study Material
                </button>
            </div>

            {alertMessage && (
                <div className={`alert alert-${alertMessage.type}`}>
                    {alertMessage.text}
                </div>
            )}

            {/* Navigation Tabs & Filter Bar */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <button
                    onClick={() => setActiveTab("all")}
                    style={{
                        padding: "12px 20px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "all" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "all" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    All Shared Resources ({resources.length})
                </button>

                <button
                    onClick={() => setActiveTab("bookmarks")}
                    style={{
                        padding: "12px 20px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: activeTab === "bookmarks" ? "#4f46e5" : "#64748b",
                        borderBottom: activeTab === "bookmarks" ? "3px solid #4f46e5" : "3px solid transparent"
                    }}
                >
                    🔖 My Saved Bookmarks ({bookmarks.length})
                </button>
            </div>

            {activeTab === "all" && (
                <div className="card" style={{ marginBottom: "28px", padding: "18px" }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "end" }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Search Materials</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by title, description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Filter by Subject</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Operating Systems"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Material Type</label>
                            <select
                                className="form-control"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="PDF">PDF Documents</option>
                                <option value="NOTES">Notes & Cheatsheets</option>
                                <option value="VIDEO">Video Tutorials</option>
                                <option value="GITHUB">GitHub Repositories</option>
                                <option value="OTHER">Other Links</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <Search size={18} /> Search Hub
                        </button>
                    </form>
                </div>
            )}

            {/* Display Resource Cards Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>Loading study resources...</div>
            ) : displayList.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                    {activeTab === "bookmarks"
                        ? "You haven't bookmarked any resources yet."
                        : "No study materials match your search filters."}
                </div>
            ) : (
                <div className="grid">
                    {displayList.map((res) => {
                        return (
                            <div key={res._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                                            {getTypeIcon(res.type)} {res.type}
                                        </span>

                                        <button
                                            onClick={() => handleToggleBookmark(res._id)}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", color: res.isBookmarked ? "#f59e0b" : "#94a3b8" }}
                                            title="Bookmark Resource"
                                        >
                                            <Bookmark size={20} fill={res.isBookmarked ? "#f59e0b" : "none"} />
                                        </button>
                                    </div>

                                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                                        {res.title}
                                    </h3>

                                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px", minHeight: "40px" }}>
                                        {res.description || `Subject: ${res.subject}`}
                                    </p>

                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
                                        Uploaded by <strong>{res.uploadedBy?.name || "Student"}</strong> ({res.uploadedBy?.college || "Campus"})
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                                    <button
                                        onClick={() => handleToggleUpvote(res._id)}
                                        className="btn btn-outline"
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: "0.85rem",
                                            borderColor: res.isUpvoted ? "#4f46e5" : "#e2e8f0",
                                            background: res.isUpvoted ? "#eef2ff" : "transparent",
                                            color: res.isUpvoted ? "#4f46e5" : "#475569"
                                        }}
                                    >
                                        <ThumbsUp size={16} fill={res.isUpvoted ? "#4f46e5" : "none"} /> {res.upvoteCount || 0} Upvotes
                                    </button>

                                    <a
                                        href={res.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-secondary"
                                        style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                                    >
                                        Open Material <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Share Resource Modal */}
            {isShareModalOpen && (
                <ShareResourceModal
                    onClose={() => setIsShareModalOpen(false)}
                    onResourceShared={(data) => {
                        setAlertMessage({
                            type: "success",
                            text: `Material shared successfully! ${data.pointsAwarded ? `+${data.pointsAwarded} Reward Points Earned! ⭐` : ""}`
                        });
                        fetchResources();
                    }}
                />
            )}
        </div>
    );
}

export default Resources;
