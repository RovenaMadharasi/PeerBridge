# 🎓 PeerBridge — Intercollege Peer Learning and Mentorship Platform

> A modern, gamified web application that formalizes senior-to-junior peer learning across campus. Senior students conduct learning sessions, publish quizzes, and share study materials, while junior students discover sessions, take timed quizzes, earn reward points, climb leaderboards, and rate mentors.

---

## 🌟 Key Features

### 1. 🔐 Role-Based Access & Auto-Role Assignment
- **Server-Derived Roles**: A student's role is automatically determined by the server from their year of study:
  - **Year 1 & 2** &rarr; `Junior Student` (Registers for sessions, attempts timed quizzes, rates mentors, earns points).
  - **Year 3 & 4** &rarr; `Senior Mentor` (Creates & hosts learning sessions, authors quizzes, views attendee rosters, earns mentor ratings).
- Client-supplied role selections are strictly ignored to prevent privilege escalation.
- Passwords are securely hashed with `bcryptjs`, and sessions are protected using JSON Web Tokens (JWT).

### 2. 📅 Atomic Session Reservation & Management
- **Atomic MongoDB Seat Booking**: Employs a single `findOneAndUpdate` query with `$expr` seat comparison to guarantee zero double-registrations or overbookings under simultaneous user clicks.
- **Session Explorer**: Real-time keyword search with filters for subject, category (*Academic*, *Career Preparation*, *Coding & Tech*, *Soft Skills*), difficulty (*Beginner*, *Intermediate*, *Advanced*), and timeline (*Upcoming* vs *Past*).
- **Host Controls**: Senior mentors can manage created sessions, inspect registered student rosters, and link external meeting URLs (Google Meet, Zoom, Teams).

### 3. 📝 Timed Quiz Engine & Server-Side Scoring
- **Quiz Authoring**: Mentors can author multiple-choice quizzes (2 to 6 options per question), assign mark values, set countdown limits (minutes), and provide post-submission explanations.
- **Server-Synced Countdown Timer**: Safe on page reload; browser clock tampering cannot alter remaining time.
- **Real-Time Autosaving**: Student choices autosave seamlessly via `PATCH /api/attempts/:id/answer`. Quizzes auto-submit when the countdown expires.
- **Answer Obfuscation**: Correct answers and mentor explanations are withheld from the client until after submission, when a full scorecard review is revealed.

### 4. 🏆 Gamification, Badges & Dual Leaderboards
- **Audited Points Engine**: Every point grant is recorded in an immutable `point_transactions` collection with unique constraints to prevent double awards.
  - `SESSION_ATTENDED`: **+5 pts** (awarded on quiz start or rating).
  - `QUIZ_COMPLETE`: **+10 to +20 pts** (10 base + score performance bonus).
  - `RATING_GIVEN`: **+2 pts**.
  - `RESOURCE_SHARED`: **+3 pts** (capped at 3 rewarded shares/day).
- **Badge Tiers**: Automatically promotes students across tiers:
  - 🏆 **Newcomer** (0–49 pts)
  - 🏆 **Learner** (50–149 pts)
  - 🏆 **Achiever** (150–299 pts)
  - 🏆 **Champion** (300+ pts)
- **Dual Campus Leaderboards**:
  - **Student Leaderboard**: Ranked by total reward points with row highlighting for the logged-in user.
  - **Mentor Leaderboard**: Ranks senior mentors with at least 3 reviews by their average 5-star ratings.

### 5. ⭐ 5-Star Mentor Evaluations
- Evaluates mentors across 5 metrics: Subject Knowledge, Explanation Quality, Communication, Usefulness, and Overall Rating.
- Ratings unlock only after the session start time has passed, ensuring feedback reflects actual participation.
- Aggregates mentor average scores and review counts via MongoDB `$avg`.

### 6. 📁 Central Study Resource Hub
- Share links to lecture notes, PDFs, video tutorials, and GitHub repositories.
- Interactive upvote toggling and personal bookmark saving.
- Text search across title, description, and academic subject.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7, Axios, Lucide React, Modern CSS3 |
| **Backend** | Node.js, Express.js 5 |
| **Database** | MongoDB with Mongoose ODM (Atlas & Local Community Server) |
| **Authentication**| JWT (JSON Web Tokens) with `bcryptjs` password hashing |
| **Design System** | Dark glassmorphism header, responsive CSS cards, animated modals |

---

## 📂 Project Structure

```
PeerBridge/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection logic
│   │   └── pointsConfig.js       # Point values & badge thresholds
│   ├── controllers/
│   │   ├── authController.js     # Signup, login, profile endpoints
│   │   ├── sessionController.js  # Session CRUD & atomic seat reservation
│   │   ├── quizController.js     # Quiz authoring, attempts & grading
│   │   ├── ratingController.js   # 5-star reviews & mentor aggregations
│   │   ├── leaderboardController.js # Student & mentor rankings
│   │   └── resourceController.js # Study material search & sharing
│   ├── middleware/
│   │   ├── auth.js               # JWT protect & role authorize guards
│   │   └── errorHandler.js       # Centralized HTTP error mapper
│   ├── models/
│   │   ├── User.js               # User profile & badge schema
│   │   ├── Session.js            # Session schema with virtual seatsLeft
│   │   ├── Quiz.js               # Quiz & question schema
│   │   ├── QuizAttempt.js        # Timed student attempt & answers schema
│   │   ├── Rating.js             # 5-star mentor evaluation schema
│   │   ├── Resource.js           # Study material library schema
│   │   ├── Bookmark.js           # User saved bookmark schema
│   │   └── PointTransaction.js   # Immutable point audit log schema
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── userRoutes.js         # /api/users endpoints
│   │   ├── sessionRoutes.js      # /api/sessions endpoints
│   │   ├── quizRoutes.js         # /api/quizzes endpoints
│   │   ├── attemptRoutes.js      # /api/attempts endpoints
│   │   ├── ratingRoutes.js       # /api/ratings endpoints
│   │   ├── leaderboardRoutes.js  # /api/leaderboard endpoints
│   │   └── resourceRoutes.js     # /api/resources endpoints
│   ├── server.js                 # Express server bootstrap
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Glassmorphism header with badge & points
│   │   │   ├── ProtectedRoute.jsx# Role & login navigation guard
│   │   │   ├── QuizBuilderModal.jsx # Senior quiz creation modal
│   │   │   ├── QuizAttemptModal.jsx # Timed quiz taker with autosave
│   │   │   ├── QuizTimer.jsx     # Server-synced countdown timer
│   │   │   ├── QuizResultModal.jsx  # Score breakdown & explanations
│   │   │   ├── RatingModal.jsx   # 5-star evaluation modal
│   │   │   ├── RegisteredStudentsModal.jsx # Attendee roster modal
│   │   │   └── ShareResourceModal.jsx      # Study material upload modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state & refresh hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Welcome banner, stat widgets & actions
│   │   │   ├── Login.jsx         # Sign-in form
│   │   │   ├── Signup.jsx        # Registration with live role preview
│   │   │   ├── Sessions.jsx      # Session explorer & atomic registration
│   │   │   ├── CreateSession.jsx # Session scheduling form
│   │   │   ├── MySessions.jsx    # Enrolled vs Created session tabs
│   │   │   ├── Quizzes.jsx       # Dedicated Post-Meeting Quizzes Hub
│   │   │   ├── Leaderboard.jsx   # Student & Mentor rankings
│   │   │   ├── Resources.jsx     # Study material library & bookmarks
│   │   │   └── Profile.jsx       # Bio, skills, socials & points log
│   │   ├── App.jsx               # Route mappings
│   │   └── index.css             # Theme design system & utility styling
│   └── package.json
│
└── docs/                         # Project Documentation
    ├── Database_setup.md         # Database schema & MongoDB setup guide
    ├── decisions and open issuse.md # Architectural decisions & open issues
    ├── developer contract.md     # Full-stack developer team contract
    ├── Implementation plan.md    # Sprints roadmap & test matrix
    ├── work_split.md             # Full-stack team work division
    ├── SRS PeerBridge.pdf        # Software Requirements Specification
    └── HLD and LLD PeerBridge.pdf# High & Low Level Design Document
```

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local Community Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/RovenaMadharasi/PeerBridge.git
cd PeerBridge
```

### 2. Configure Backend Environment
Navigate to the `backend` folder and create a `.env` file:
```bash
cd backend
```

Create `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/peerbridge
JWT_SECRET=peerbridge_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h
```

### 3. Install Dependencies & Run Backend
```bash
npm install
npm run dev
```
The API server will start on `http://localhost:5000`.

### 4. Install Dependencies & Run Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://localhost:5173`. Open your browser and navigate to `http://localhost:5173/login`.

---

## 📡 API Reference Overview

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new account (server sets role from year) |
| `POST` | `/api/auth/login` | Public | Sign in and receive JWT token |
| `GET` | `/api/users/me` | Protected | Get authenticated profile, points, badge, and rank |
| `PUT` | `/api/users/me` | Protected | Update user bio, skills, and social links |
| `GET` | `/api/sessions` | Protected | Browse upcoming sessions with keyword/category filters |
| `POST` | `/api/sessions` | Senior | Create a new peer-learning session |
| `POST` | `/api/sessions/:id/register` | Protected | Atomically register seat for a session |
| `GET` | `/api/sessions/mine` | Protected | List enrolled and created sessions |
| `GET` | `/api/sessions/:id/students` | Senior Owner | View attendee roster for a hosted session |
| `POST` | `/api/quizzes` | Senior Owner | Create quiz for a session |
| `POST` | `/api/quizzes/:id/start` | Registered Student | Start timed quiz attempt (obfuscates correct answers) |
| `PATCH`| `/api/attempts/:id/answer`| Attempt Owner | Autosave single answer with expiry check |
| `POST` | `/api/attempts/:id/submit`| Attempt Owner | Submit and grade attempt; award gamification points |
| `GET` | `/api/attempts/:id/result`| Attempt Owner | View score breakdown and mentor explanations |
| `POST` | `/api/sessions/:id/ratings`| Registered Student | Submit 5-star evaluation after session start time |
| `GET` | `/api/leaderboard/students`| Protected | View student leaderboard ranked by points |
| `GET` | `/api/leaderboard/mentors` | Protected | View mentor leaderboard (`ratingCount >= 3`) |
| `GET` | `/api/resources` | Protected | Search and filter study material links |
| `POST` | `/api/resources` | Protected | Share study material link (+3 pts) |
| `POST` | `/api/resources/:id/upvote` | Protected | Toggle upvote on a resource |
| `POST` | `/api/resources/:id/bookmark` | Protected | Toggle bookmark on a resource |

---

## 📖 Project Documentation

Detailed project architecture and team documents are available in the [`docs/`](./docs) directory:
- [📘 Database Setup Guide](./docs/Database_setup.md)
- [📙 Decisions & Open Issues Status](./docs/decisions%20and%20open%20issuse.md)
- [📜 Developer Contract & Team Standards](./docs/developer%20contract.md)
- [📋 Implementation Plan & Sprints Roadmap](./docs/Implementation%20plan.md)
- [👥 Team Work Split & Module Ownership](./docs/work_split.md)

---

## 👥 Full-Stack Development Team

| Member | Core Responsibilities |
| :--- | :--- |
| **Member 1** | **Authentication, Profiles & Infrastructure** (Full-Stack: React Auth UI, Express Auth APIs, JWT Middleware, User Schema, Axios Interceptor) |
| **Member 2** | **Session Management & Mentor Ratings** (Full-Stack: React Sessions Explorer, Atomic MongoDB Seat Booking, Rating Aggregations, Attendee Rosters) |
| **Member 3** | **Quiz Assessment, Gamification & Resources** (Full-Stack: React Quizzes Hub & Timer, Server Grading Engine, Points Service, Leaderboards, Resource Library) |

---

## 📄 License
This project was developed for academic peer-learning collaboration. All rights reserved.
