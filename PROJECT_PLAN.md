# Real-time Collaborative Code Editor - Development Plan

**Developer:** [Your Name]  
**Year:** 2nd Year CSE  
**Tech Stack:** React, Node.js, Express, Supabase (PostgreSQL), Socket.io, Yjs  
**Authentication:** Supabase Auth (Email + Google OAuth)  
**AI Integration:** Gemini API (Free Tier)  
**Code Execution:** Judge0 CE (Self-hosted via Docker)  
**Total Cost:** ₹0 — 100% Free & Open Source

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Schema Design](#database-schema-design)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [Socket.io Events](#socketio-events)
5. [Frontend Pages & Components](#frontend-pages--components)
6. [Required Packages](#required-packages)
7. [Project Structure](#project-structure)
8. [Development Phases](#development-phases)
9. [Environment Variables](#environment-variables)
10. [Deployment Plan](#deployment-plan)

---

## Project Overview

A real-time collaborative code editor where multiple users can write code together simultaneously — like Google Docs but for code. Built for students and developers who can't afford expensive tools like CoderPad or Replit Pro.

**What it does:**
- Users create a room and share a link — anyone with the link can join
- All users in the room see each other's code changes in real time
- Live colored cursors show where each user is typing
- Built-in chat sidebar for communication
- AI (Gemini) reviews your code and suggests fixes
- Run code directly in the browser (40+ languages via Judge0)
- Voice chat so collaborators can talk while coding (WebRTC — no third party)
- Embedded whiteboard (Excalidraw) for drawing diagrams alongside code
- Interview mode with a timer, problem statement, and AI evaluation at the end

**Core Value Proposition:**
- Students: Free alternative to HackerRank, CoderPad, Replit Pro
- Developers: Pair program without needing VS Code Live Share installed
- Interviewers: Conduct technical interviews with AI evaluation — free forever
- Open Source: Full code available on GitHub

**Competitors and why this wins:**

| Platform | Price | Missing |
|---|---|---|
| CoderPad | $150/month | No whiteboard, no voice |
| Replit Pro | $20/month | No interview mode, no AI review |
| HackerRank | $100+/month | No real-time collab, no whiteboard |
| VS Code Live Share | Free but needs install | No AI, no interview mode |
| **This Project** | ₹0 forever | Has everything above |

---

## Database Schema Design

> Using **Supabase PostgreSQL** — all tables created via Supabase SQL Editor

### 1. Users Table
> Managed by Supabase Auth — auto-created on register

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 2. Rooms Table

```sql
CREATE TABLE rooms (
  id                TEXT PRIMARY KEY,   -- nanoid generated e.g. "abc123xyz"
  name              TEXT NOT NULL,
  language          TEXT DEFAULT 'javascript',
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  is_interview_mode BOOLEAN DEFAULT FALSE,
  problem_statement TEXT DEFAULT '',
  expires_at        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

Indexes:
- created_by
- created_at
```

### 3. Room Participants Table

```sql
CREATE TABLE room_participants (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

Indexes:
- room_id
- user_id
```

### 4. Messages Table (Chat)

```sql
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

Indexes:
- room_id
- created_at
```

### 5. Snippets Table (Saved Code)

```sql
CREATE TABLE snippets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  code       TEXT NOT NULL,
  language   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

Indexes:
- room_id
- user_id
```

### 6. Interview Sessions Table

```sql
CREATE TABLE interview_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  host_id           UUID REFERENCES users(id),
  problem_statement TEXT NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 45,
  final_code        TEXT DEFAULT '',
  ai_evaluation     TEXT DEFAULT '',
  status            TEXT DEFAULT 'active',   -- active | completed
  started_at        TIMESTAMP DEFAULT NOW(),
  ended_at          TIMESTAMP
);

Indexes:
- room_id
- host_id
- status
```

---

## Backend API Endpoints

### Auth Routes `/api/auth`
> Supabase handles auth — backend only verifies tokens via middleware

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/auth/me` | Get current logged-in user | ✅ Yes |

### Room Routes `/api/rooms`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/rooms` | Create a new room | ✅ Yes |
| GET | `/api/rooms/:id` | Get room details by ID | ✅ Yes |
| DELETE | `/api/rooms/:id` | Delete a room (creator only) | ✅ Yes |
| GET | `/api/rooms/:id/participants` | Get all users in a room | ✅ Yes |
| POST | `/api/rooms/:id/join` | Join a room | ✅ Yes |

### Snippet Routes `/api/snippets`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/snippets` | Save a code snippet | ✅ Yes |
| GET | `/api/snippets/room/:roomId` | Get all snippets for a room | ✅ Yes |
| GET | `/api/snippets/user` | Get all snippets by current user | ✅ Yes |
| DELETE | `/api/snippets/:id` | Delete a snippet | ✅ Yes |

### AI Routes `/api/ai`
> All Gemini API calls happen here — NEVER from frontend (protects API key)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/ai/review` | Send code to Gemini for review | ✅ Yes |
| POST | `/api/ai/fix` | Send code + error to Gemini for fix | ✅ Yes |
| POST | `/api/ai/evaluate` | Evaluate interview solution at end of session | ✅ Yes |

### Execution Routes `/api/execute`
> Calls self-hosted Judge0 CE

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/execute` | Submit code for execution | ✅ Yes |
| GET | `/api/execute/:token` | Poll for execution result | ✅ Yes |

### Interview Routes `/api/interview`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/interview/start` | Start interview session for a room | ✅ Yes |
| POST | `/api/interview/end` | End session and trigger AI evaluation | ✅ Yes |
| GET | `/api/interview/:roomId` | Get interview session details | ✅ Yes |

---

## Socket.io Events

### Connection Events
```
connect              → Client connects to server
disconnect           → Client disconnects
join-room            → User joins a specific room
leave-room           → User leaves a room
```

### User Presence Events
```
user-joined          → Broadcast when new user joins room
user-left            → Broadcast when user leaves room
get-room-users       → Get list of all users currently in room
```

### Chat Events
```
send-message         → User sends a chat message
receive-message      → Broadcast message to all users in room
```

### Interview Mode Events
```
start-interview      → Host starts interview mode
timer-sync           → Sync countdown timer to all users in room
end-interview        → Host ends interview session
interview-started    → Broadcast interview started to all in room
interview-ended      → Broadcast interview ended to all in room
```

### Voice Chat Events (WebRTC Signaling)
```
voice-join           → User wants to join voice
voice-leave          → User leaves voice
voice-offer          → WebRTC offer signal
voice-answer         → WebRTC answer signal
voice-ice-candidate  → WebRTC ICE candidate exchange
```

> Note: Real-time code sync and live cursors are handled by **Yjs + y-websocket** — not Socket.io

---

## Frontend Pages & Components

### Pages

| Page | Route | Description |
|---|---|---|
| `Home.jsx` | `/` | Landing — create room or join with room ID |
| `Login.jsx` | `/login` | Login with email or Google OAuth |
| `Register.jsx` | `/register` | Register with email and password |
| `EditorPage.jsx` | `/room/:roomId` | Main editor page |
| `NotFound.jsx` | `*` | 404 page |

### Components

#### Editor Components
| Component | Description |
|---|---|
| `Editor.jsx` | Monaco Editor wrapper — language, theme, Yjs binding |
| `LiveCursors.jsx` | Renders other users' cursors with name labels via Yjs Awareness |
| `OutputPanel.jsx` | stdin input, stdout/stderr output, Run button — Judge0 |
| `LanguageSwitcher.jsx` | Dropdown to switch programming language |
| `ThemeSwitcher.jsx` | Toggle dark / light theme |

#### Collaboration Components
| Component | Description |
|---|---|
| `Sidebar.jsx` | Container for users list and chat |
| `UsersList.jsx` | Active users in room with colored avatars |
| `Chat.jsx` | Real-time chat with message input and scrollable list |
| `VoiceChat.jsx` | Join/leave voice, mute/unmute, speaking indicators |
| `Whiteboard.jsx` | Excalidraw embedded with show/hide toggle |

#### AI Components
| Component | Description |
|---|---|
| `AIReview.jsx` | Review Code button + loading state + review panel |
| `AIFix.jsx` | Paste error → AI suggests fix inline |

#### Interview Components
| Component | Description |
|---|---|
| `InterviewMode.jsx` | Toggle interview mode (host only) + problem statement |
| `InterviewTimer.jsx` | Countdown timer synced for all users via Socket.io |
| `InterviewReport.jsx` | AI evaluation after session ends + PDF download |

#### Shared / UI Components
| Component | Description |
|---|---|
| `Navbar.jsx` | Top bar with room name, share button, user avatar |
| `ShareButton.jsx` | Copy shareable room link to clipboard |
| `LoadingSpinner.jsx` | Generic loading state |
| `ProtectedRoute.jsx` | Redirect to login if not authenticated |

### Custom Hooks

| Hook | Description |
|---|---|
| `useRoom.js` | Room creation, joining, fetching details |
| `useYjs.js` | Initialize Y.Doc, Y.Text, bind to Monaco |
| `useVoice.js` | WebRTC peer connection logic, mute/unmute |
| `useSocket.js` | Initialize and export socket connection |
| `useAI.js` | Call AI review and fix endpoints |

---

## Required Packages

### Frontend (`/client`)
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@supabase/supabase-js": "^2",
    "@monaco-editor/react": "^4",
    "yjs": "^13",
    "y-monaco": "^0.1",
    "y-websocket": "^1",
    "socket.io-client": "^4",
    "simple-peer": "^9",
    "@excalidraw/excalidraw": "^0.17",
    "axios": "^1",
    "jspdf": "^2",
    "nanoid": "^5",
    "tailwindcss": "^3",
    "react-hot-toast": "^2"
  }
}
```

### Backend (`/server`)
```json
{
  "dependencies": {
    "express": "^4",
    "socket.io": "^4",
    "y-websocket": "^1",
    "@supabase/supabase-js": "^2",
    "@google/generative-ai": "^0.3",
    "nanoid": "^5",
    "dotenv": "^16",
    "cors": "^2",
    "helmet": "^7",
    "axios": "^1"
  }
}
```

---

## Project Structure

```
realtime-code-editor/
│
├── client/                               # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── Editor.jsx
│   │   │   │   ├── LiveCursors.jsx
│   │   │   │   ├── OutputPanel.jsx
│   │   │   │   ├── LanguageSwitcher.jsx
│   │   │   │   └── ThemeSwitcher.jsx
│   │   │   ├── collaboration/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── UsersList.jsx
│   │   │   │   ├── Chat.jsx
│   │   │   │   ├── VoiceChat.jsx
│   │   │   │   └── Whiteboard.jsx
│   │   │   ├── ai/
│   │   │   │   ├── AIReview.jsx
│   │   │   │   └── AIFix.jsx
│   │   │   ├── interview/
│   │   │   │   ├── InterviewMode.jsx
│   │   │   │   ├── InterviewTimer.jsx
│   │   │   │   └── InterviewReport.jsx
│   │   │   └── shared/
│   │   │       ├── Navbar.jsx
│   │   │       ├── ShareButton.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── EditorPage.jsx
│   │   │   └── NotFound.jsx
│   │   ├── hooks/
│   │   │   ├── useRoom.js
│   │   │   ├── useYjs.js
│   │   │   ├── useVoice.js
│   │   │   ├── useSocket.js
│   │   │   └── useAI.js
│   │   ├── lib/
│   │   │   ├── supabase.js               # Supabase client init
│   │   │   └── socket.js                 # Socket.io client init
│   │   ├── App.jsx
│   │   └── index.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                               # Node.js Backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   ├── snippets.js
│   │   ├── ai.js
│   │   ├── execute.js
│   │   └── interview.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── middleware/
│   │   └── auth.js                       # Verify Supabase JWT
│   ├── lib/
│   │   └── supabase.js
│   └── index.js
│
├── judge0/
│   └── docker-compose.yml                # Self-hosted Judge0 CE
│
├── docker-compose.yml                    # Spins up entire project
├── .env                                  # NEVER commit this
├── .gitignore
└── README.md
```

---

## Development Phases

### Phase 0 — Project Setup (Day 1)
**Goal:** Everything installed, repo created, accounts ready.

- [ ] Create GitHub repo `realtime-code-editor` with `.gitignore` (Node template)
- [ ] Clone locally, create `.env` — add to `.gitignore` immediately
- [ ] Install: Node.js v20 LTS, Docker Desktop, VS Code
- [ ] Create accounts: Supabase, aistudio.google.com, Vercel, Render
- [ ] Install VS Code extensions: ES7 Snippets, Tailwind IntelliSense, Prettier, ESLint, GitLens, Docker
- [ ] Initialize React app in `/client` and Node app in `/server`
- [ ] Install all packages listed above

---

### Phase 1 — Supabase Setup (Day 2)
**Goal:** All database tables created and connected.

- [ ] Create new Supabase project
- [ ] Run SQL to create all 6 tables in Supabase SQL editor
- [ ] Enable Google OAuth in Supabase Auth settings
- [ ] Copy API keys to `.env`
- [ ] Create `lib/supabase.js` in both client and server
- [ ] Test connection with a simple select query

**Test:** All 6 tables visible in Supabase table editor.

---

### Phase 2 — Authentication (Days 3-4)
**Goal:** Register, login, logout working.

- [ ] Build `Register.jsx` — `supabase.auth.signUp()`
- [ ] Build `Login.jsx` — email + password + Google OAuth
- [ ] Build `ProtectedRoute.jsx` — redirect to `/login` if not authenticated
- [ ] Build auth middleware in backend — verify Supabase JWT
- [ ] Handle session persistence — stays logged in on refresh

**Test:** Register → Supabase dashboard shows user → Login → Refresh → Still logged in → Logout.

---

### Phase 3 — Room Creation & Joining (Days 5-6)
**Goal:** Create rooms and join via shareable link.

- [ ] Build `Home.jsx` — create room button + join room input
- [ ] Build `POST /api/rooms` — nanoid room ID, save to Supabase
- [ ] Build `GET /api/rooms/:id` — fetch room details
- [ ] Build `POST /api/rooms/:id/join` — add to `room_participants`
- [ ] Build `ShareButton.jsx` — copy room URL to clipboard
- [ ] Build `Navbar.jsx`

**Test:** Create room → copy link → open incognito tab → both in same room.

---

### Phase 4 — Monaco Editor (Days 7-8)
**Goal:** Code editor loads and works.

- [ ] Build `Editor.jsx` — render Monaco with `vs-dark` theme
- [ ] Build `LanguageSwitcher.jsx` — JS, Python, C++, Java, Go
- [ ] Build `ThemeSwitcher.jsx` — dark/light toggle
- [ ] Load saved code from Supabase on room open
- [ ] Auto-save code to Supabase every 30 seconds

**Test:** Type code → switch language → refresh → code reloads.

---

### Phase 5 — Socket.io Foundation (Days 9-10)
**Goal:** Real-time user presence in room.

- [ ] Setup Socket.io server — `join-room`, `leave-room`, `user-joined`, `user-left`
- [ ] Create `lib/socket.js` in client
- [ ] Build `UsersList.jsx` — active users with colored avatars
- [ ] Real-time update on join/leave

**Test:** Two browser tabs → both see each other → close one → it disappears.

---

### Phase 6 — Real-time Code Sync (Days 11-14)
**Goal:** Multiple users type together with no conflicts.

- [ ] Create `useYjs.js` — initialize `Y.Doc` and `Y.Text`
- [ ] Setup `y-websocket` server alongside Express
- [ ] Bind Yjs to Monaco using `y-monaco`
- [ ] Handle user reconnection — code state restores on rejoin

**Test:** 3 tabs → type simultaneously in each → all in sync with zero conflicts.

> ⚠️ Hardest mandatory feature. Read Yjs docs first. Budget 4 days.

---

### Phase 7 — Chat Sidebar (Days 15-16)
**Goal:** Real-time chat inside the room.

- [ ] Build `Chat.jsx` — messages list + input
- [ ] Socket.io events: `send-message`, `receive-message`
- [ ] Save messages to Supabase, load last 50 on join

**Test:** Two tabs → message from one → appears in both → refresh → messages reload.

---

### Phase 8 — Live Cursors (Days 17-19)
**Goal:** See other users' named cursors in real time.

- [ ] Use Yjs Awareness API (no extra install)
- [ ] Broadcast cursor position + username + unique color
- [ ] Build `LiveCursors.jsx` — render cursor widget per user
- [ ] Remove cursor on disconnect

**Test:** Two tabs → move cursor → labeled colored cursor appears in other tab.

---

### Phase 9 — AI Code Review (Days 20-22)
**Goal:** Get Gemini AI feedback on code with one click.

- [ ] Build `POST /api/ai/review` — send code to Gemini, return review
- [ ] Build `POST /api/ai/fix` — send code + error, return fix
- [ ] Build `AIReview.jsx` — Review button, loading state, result panel
- [ ] Build `AIFix.jsx` — error input + Fix button
- [ ] Handle rate limits gracefully (15 req/min free tier)

**Gemini System Prompt:**
```
You are a senior code reviewer. Analyze the code and provide:
1. Bugs and errors
2. Performance issues
3. Best practices violations
4. Actionable improvement suggestions
Keep feedback concise and developer-friendly.
```

**Test:** Write buggy code → Review → detailed feedback → paste error → Fix → corrected code.

---

### Phase 10 — Code Execution (Days 23-25)
**Goal:** Run code and see output inside browser.

- [ ] Self-host Judge0 CE via Docker
- [ ] Build `POST /api/execute` — submit to Judge0
- [ ] Build `GET /api/execute/:token` — poll for result
- [ ] Build `OutputPanel.jsx` — stdin, stdout, stderr, Run button

**Language ID Mapping:**
```javascript
const LANGUAGE_IDS = {
  javascript: 63,
  python:     71,
  cpp:        54,
  java:       62,
  go:         60
}
```

**Test:** Hello World in each language → correct output → broken code → error in stderr.

---

### Phase 11 — Voice Chat / WebRTC (Days 26-29)
**Goal:** Talk while coding — no third-party service.

- [ ] Read WebRTC MDN docs first (1 hour)
- [ ] Use Socket.io as signaling server
- [ ] Handle: `voice-offer`, `voice-answer`, `voice-ice-candidate`
- [ ] Build `VoiceChat.jsx` — join voice, mute/unmute, speaking indicator

**Test:** Two actual devices → same room → Join Voice → hear each other → test mute.

> ⚠️ Test on two real devices — not two tabs on same machine.

---

### Phase 12 — Whiteboard (Day 30)
**Goal:** Draw diagrams alongside code.

- [ ] Embed `@excalidraw/excalidraw` in `Whiteboard.jsx`
- [ ] Toggle show/hide from navbar
- [ ] Save whiteboard JSON to Supabase (debounced, every 5s)
- [ ] Load state on room open

**Test:** Draw something → refresh → drawing persists.

---

### Phase 13 — Interview Mode (Days 31-34)
**Goal:** Full mock interview with timer, AI evaluation and PDF report.

- [ ] Build `InterviewMode.jsx` — host toggle + problem statement
- [ ] Build `InterviewTimer.jsx` — 30/45/60 min countdown, synced via Socket.io
- [ ] Build `POST /api/interview/start` and `/end`
- [ ] Build `POST /api/ai/evaluate` — Gemini evaluates solution
- [ ] Build `InterviewReport.jsx` — AI feedback + PDF download via `jsPDF`

**Gemini Evaluation Prompt:**
```
You are a technical interviewer. Evaluate this solution:
Problem: {problem}
Language: {language}
Code: {code}
Time taken: {time} minutes

Provide:
1. Correctness score (out of 10)
2. Code quality score (out of 10)
3. Time complexity analysis
4. What was done well
5. What to improve
6. Recommendation: Hire / Maybe / No Hire
```

**Test:** Start interview → 30 min timer → write code → end → download PDF with full AI report.

---

### Phase 14 — Docker (Days 35-36)
**Goal:** Full project runs with one command.

- [ ] Write `Dockerfile` for backend
- [ ] Write `Dockerfile` for frontend
- [ ] Write `docker-compose.yml` — frontend, backend, judge0 services
- [ ] Test: `docker-compose up` → full app at localhost

---

### Phase 15 — Deployment (Days 37-38)
**Goal:** Live public URL.

- [ ] Frontend → Vercel (connect GitHub, add env vars)
- [ ] Backend → Render (connect GitHub, add env vars)
- [ ] Update `CLIENT_URL` to Vercel URL
- [ ] Test all features on production

---

### Phase 16 — Polish & Documentation (Days 39-40)
**Goal:** Presentable, documented, bug-free.

- [ ] Write `README.md` — description, GIF demo, features, tech stack, setup, live link
- [ ] Add error handling — network, auth, API failures
- [ ] Add loading states — spinners, skeleton screens
- [ ] Final end-to-end testing
- [ ] Tag `v1.0.0` release on GitHub

---

## Timeline Summary

| Days | Phase | Deliverable |
|---|---|---|
| Day 1 | Setup | Repo + accounts + packages ready |
| Day 2 | Supabase | All 6 tables created and connected |
| Days 3-4 | Auth | Login + Register + Google OAuth |
| Days 5-6 | Rooms | Create room + shareable link |
| Days 7-8 | Monaco | Code editor loading |
| Days 9-10 | Socket.io | Active users list in real time |
| Days 11-14 | Real-time Sync | Multiple users typing together |
| Days 15-16 | Chat | Real-time chat |
| Days 17-19 | Live Cursors | Colored named cursors |
| Days 20-22 | AI Review | Gemini code review + fix |
| Days 23-25 | Code Execution | Run code, see output |
| Days 26-29 | Voice Chat | WebRTC voice working |
| Day 30 | Whiteboard | Excalidraw embedded and saving |
| Days 31-34 | Interview Mode | Timer + AI evaluation + PDF |
| Days 35-36 | Docker | One command startup |
| Days 37-38 | Deploy | Live Vercel + Render URL |
| Days 39-40 | Polish | README, error handling, v1.0.0 tag |

**Total: 40 Days at 2-3 hours/day**

---

## Environment Variables

### Backend `.env`
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Judge0
JUDGE0_API_URL=http://localhost:2358

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend `.env`
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

> ⚠️ Add `.env` to `.gitignore` BEFORE your first commit. Never push API keys to GitHub.

---

## Deployment Plan

### Frontend — Vercel (Free)
- Connect GitHub repo
- Add all `REACT_APP_` env vars in Vercel dashboard
- Auto-deploys on every push to `main`

### Backend — Render (Free)
- Connect GitHub repo
- Add all backend env vars in Render dashboard
- Free tier spins down after inactivity — fine for portfolio

### Database — Supabase (Free)
- Already cloud hosted
- Free tier: 500MB storage, 2 projects

### Judge0 — Self-hosted on Render (Free)
- Deploy `judge0/docker-compose.yml` to Render free tier

---

## Golden Rules

```
1. Never skip testing a phase before moving to the next
2. Commit to GitHub after every completed feature
3. Never hardcode API keys — always use .env
4. Always test real-time features with multiple browser tabs
5. When stuck — read official docs first, then Google, then ask
6. Done is better than perfect
7. Build each phase fully before starting the next
```

---

## Key Resources

| Resource | URL |
|---|---|
| Supabase Docs | docs.supabase.com |
| Gemini API | aistudio.google.com |
| Yjs Docs | docs.yjs.dev |
| Monaco Editor | microsoft.github.io/monaco-editor |
| Socket.io Docs | socket.io/docs |
| WebRTC MDN | developer.mozilla.org/en-US/docs/Web/API/WebRTC_API |
| simple-peer | github.com/feross/simple-peer |
| Judge0 | judge0.com |
| Excalidraw | github.com/excalidraw/excalidraw |
| jsPDF | github.com/parallax/jsPDF |

---

## Future Enhancements (Post v1.0)

1. Multiple file tabs — full IDE experience
2. Version history — see past code versions per room
3. GitHub integration — push code directly to a repo
4. Mobile app — React Native version
5. Screen sharing alongside code
6. Public snippet library
7. Custom room themes

---

**Last Updated:** March 2026  
**Version:** 1.0  
**Status:** Ready for Development 🚀  
**Total Cost:** ₹0