import axios from "axios";

const api = axios.create({
    baseURL: "https://peerbridge-backend.onrender.com/api"
});

// Request interceptor: attach Authorization header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("token");
            if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;