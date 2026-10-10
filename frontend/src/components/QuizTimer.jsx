import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function QuizTimer({ deadlineAt, onExpire }) {
    const [timeLeftSec, setTimeLeftSec] = useState(0);

    useEffect(() => {
        const calculateRemaining = () => {
            if (!deadlineAt) return 0;
            const now = new Date().getTime();
            const deadline = new Date(deadlineAt).getTime();
            const diff = Math.max(0, Math.floor((deadline - now) / 1000));
            return diff;
        };

        setTimeLeftSec(calculateRemaining());

        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setTimeLeftSec(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [deadlineAt, onExpire]);

    const minutes = Math.floor(timeLeftSec / 60);
    const seconds = timeLeftSec % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const isWarning = timeLeftSec < 120; // less than 2 mins

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontWeight: "700",
                fontSize: "0.95rem",
                background: isWarning ? "#fee2e2" : "#e0e7ff",
                color: isWarning ? "#dc2626" : "#4338ca",
                border: `1px solid ${isWarning ? "#fca5a5" : "#c7d2fe"}`
            }}
        >
            <Clock size={18} />
            <span>{formatted}</span>
        </div>
    );
}

export default QuizTimer;
