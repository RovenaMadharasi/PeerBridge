# PeerBridge — Design Decisions & Open Issues Status

This document records the design choices, architectural decisions, and open issues tracking for the **PeerBridge** intercollege peer-learning platform.

---

## 1. Architectural & Design Decisions Made

Where the initial requirements left room for implementation design, the team agreed upon the following technical decisions (referenced from HLD/LLD Section 1.3):

| No. | Decision | Technical Rationale | Status |
| :--- | :--- | :--- | :--- |
| **D1** | **Server-Derived Roles**<br>Role is computed on the server based on year of study (`Year 1–2` = junior, `Year 3–4` = senior). Any client-supplied role in request body is strictly ignored. | Prevents students from falsely assigning themselves mentor privileges (`AUTH-F3`). Ensures role integrity. | **Implemented & Enforced** |
| **D2** | **Layered MERN Architecture**<br>Routes &rarr; Controllers &rarr; Services &rarr; Models &rarr; Database. | Allows each team member to own functional modules independently without merge conflicts (`SYS-7`). | **Implemented** |
| **D3** | **Single UTC DateTime for Sessions**<br>Session start times are stored as a single UTC `startsAt` DateTime field and converted to user's local timezone (IST) in the UI. | Eliminates timezone drift and simplifies MongoDB comparison queries for upcoming vs past sessions. | **Implemented** |
| **D4** | **Atomic MongoDB Seat Reservation**<br>Seat registration uses a single `findOneAndUpdate` query with `$expr: { $lt: [{ $size: '$registeredStudents' }, '$maxSeats'] }` and `$addToSet`. | Completely eliminates race conditions and overbooking when multiple students click "Register" simultaneously (`SESS-N1`). | **Implemented** |
| **D5** | **Single Quiz & Single Attempt**<br>Each session allows at most one quiz, and each registered student is restricted to one attempt. | Prevents gamification point farming by re-attempting identical quizzes repeatedly. | **Implemented** |
| **D6** | **Server-Side Quiz Timer & Auto-Close**<br>`startedAt` and `deadlineAt` are computed on the server. The client shows a synced timer, and attempts are automatically marked `AUTO_SUBMITTED` once expired. | Refreshing or manipulating local browser clocks cannot extend quiz time. Solves free-tier background job limitations. | **Implemented** |
| **D7** | **Immutable Point Transaction Log**<br>Every point addition is written to a `point_transactions` collection with a unique index on `(userId + action + refId)`. | Full audit trail and bulletproof prevention of double awards for the same session or quiz (`LEAD-N1`). | **Implemented** |
| **D8** | **Centralized Points & Badge Config**<br>All point values and badge thresholds reside in a single configuration file (`pointsConfig.js`). | Point values can be tuned or balanced instantly without changing business logic across controllers (`OI-6`). | **Implemented** |
| **D9** | **Mentor Leaderboard Threshold**<br>Mentors must receive at least 3 ratings (`ratingCount >= 3`) before appearing on the Mentor Leaderboard. | Prevents a single lucky 5-star rating from unfairly displacing experienced mentors (`LEAD-F4`). | **Implemented** |
| **D10**| **Post-Session Rating Activation**<br>Rating unlocks only after `startsAt` has passed, and only for registered students (registration counts as attendance). | Prevents premature or fraudulent reviews before a session has actually occurred. | **Implemented** |
| **D11**| **External Resource Link Isolation**<br>Study resources store URL links (`http://` or `https://`). The backend never downloads or executes external files. | Broken, slow, or unsafe external files cannot crash the application or exhaust server storage (`RES-N2`). | **Implemented** |
| **D12**| **Scope Boundaries for Version 1**<br>Admin panel, live video streaming inside the app, and AI chatbots are designated as future extensions. | Focuses Version 1 on rock-solid peer-learning, quiz evaluation, and gamification deliverables. | **Documented** |

---

## 2. Tracking of Open Issues (SRS Appendix A)

| ID | Issue / Question | Resolution / Decision | Implementation Details |
| :--- | :--- | :--- | :--- |
| **OI-1** | *Is an Admin Panel included in Version 1, or future scope?* | **Future Scope (v2.0)** | Role-based permissions currently allow seniors to self-moderate sessions and quizzes. System-wide admin dashboard is deferred to v2.0. |
| **OI-2** | *Is the AI doubt-clearing chatbot included in Version 1, or future scope?* | **Future Scope (v2.0)** | Version 1 focuses on human peer-to-peer learning. AI assistant integration is slated for the roadmap. |
| **OI-3** | *Is an in-app Notifications system included in Version 1, or future scope?* | **Resolved (In-App Action Alerts)** | In-app contextual alert banners highlight post-meeting quizzes and ratings. External web-push / SMS notifications deferred to v2.0. |
| **OI-4** | *Will the project be deployed online (Render/Vercel) or demoed on localhost?* | **Supported on Both** | Codebase is fully structured for free-tier cloud deployment: React on **Vercel**, Node/Express on **Render**, database on **MongoDB Atlas**, while remaining 100% executable on localhost. |
| **OI-5** | *Document Control: Team member responsibilities across stack.* | **Resolved** | All 3 team members contributed across full-stack layers (Frontend React components & Backend Express/Mongoose modules). Documented in `work_split.md` and `developer contract.md`. |
| **OI-6** | *Exact point values for each gamified action to be finalized.* | **Resolved & Locked** | Fixed in `backend/config/pointsConfig.js`: <br>• `SESSION_ATTENDED`: **+5 pts**<br>• `QUIZ_COMPLETE`: **+10 to +20 pts** (10 base + `round(percent / 10)`)<br>• `RATING_GIVEN`: **+2 pts**<br>• `RESOURCE_SHARED`: **+3 pts** (max 3/day)<br>• Badges: *Newcomer* (0-49), *Learner* (50-149), *Achiever* (150-299), *Champion* (300+). |
