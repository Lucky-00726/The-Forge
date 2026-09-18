# FORGE V2 — HOSTINGER MIGRATION PLAN

**Date:** June 14, 2026  
**Beta Launch:** June 20, 2026 (6 days)  
**Strategy:** Build V2 in parallel, migrate before production scale

---

## EXECUTIVE SUMMARY

**Why Migrate Now:**
- V2 has fundamentally different architecture (training days vs missions)
- Small user base = minimal migration complexity
- Better to migrate before large datasets exist
- Hostinger = lower costs + full SQL control

**Approach:**
- Keep V1 running on Supabase (archive only)
- Build V2 on Hostinger from scratch
- Migrate users after V2 beta validation
- V1 and V2 coexist during transition

**Content Target:** 300-400 validated SSB questions before beta

---

## PART 1: HOSTINGER ARCHITECTURE

### Infrastructure Setup

**Hostinger Plan:** Business hosting + MySQL database

**Stack:**
- **Database:** MySQL 8.0
- **API:** Node.js + Express (hosted on Hostinger)
- **Auth:** JWT tokens (custom implementation)
- **Storage:** Hostinger file storage
- **CDN:** Hostinger CDN for assets

**Endpoints:**
```
https://api.theforge.app/
├── /auth/signup
├── /auth/login
├── /auth/refresh
├── /auth/logout
├── /training/days
├── /training/sessions/:day/:session
├── /questions/submit
├── /user/profile
├── /user/progress
└── /ai/evaluate
```


### Database Schema (MySQL)

#### users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  total_xp INT DEFAULT 0,
  current_rank ENUM('Cadet', 'Officer', 'Commander') DEFAULT 'Cadet',
  current_streak INT DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_streak (current_streak DESC)
);
```

#### training_days
```sql
CREATE TABLE training_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_number SMALLINT UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  theme VARCHAR(100),
  total_xp INT NOT NULL,
  is_locked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### sessions
```sql
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  training_day_id INT NOT NULL,
  session_number SMALLINT NOT NULL,
  question_count INT NOT NULL,
  estimated_minutes INT NOT NULL,
  xp_reward INT NOT NULL,
  order_index SMALLINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (training_day_id) REFERENCES training_days(id),
  UNIQUE KEY uk_day_session (training_day_id, session_number)
);
```


#### questions
```sql
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question_type ENUM('MCQ', 'Single Word', 'Numeric', 'Rapid Response', 'Subjective') NOT NULL,
  question_text TEXT NOT NULL,
  content JSON NOT NULL,
  correct_answer VARCHAR(500),
  xp_value INT NOT NULL,
  time_limit_seconds INT,
  order_index INT NOT NULL,
  ssb_category VARCHAR(50) NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  INDEX idx_session_order (session_id, order_index)
);
```

#### question_responses
```sql
CREATE TABLE question_responses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  question_id INT NOT NULL,
  session_progress_id VARCHAR(36),
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  time_taken_seconds INT,
  xp_awarded INT DEFAULT 0,
  ai_evaluation JSON,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  UNIQUE KEY uk_user_question (user_id, question_id)
);
```


#### session_progress
```sql
CREATE TABLE session_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id INT NOT NULL,
  questions_answered INT DEFAULT 0,
  questions_total INT NOT NULL,
  xp_earned INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  UNIQUE KEY uk_user_session (user_id, session_id)
);
```

#### xp_events
```sql
CREATE TABLE xp_events (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  xp_amount INT NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_date (user_id, created_at DESC)
);
```

#### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
);
```


### Authentication Strategy

**JWT-Based Authentication:**

**Access Token:**
- Lifetime: 15 minutes
- Stored: React Native secure storage
- Contains: user_id, email, rank

**Refresh Token:**
- Lifetime: 30 days
- Stored: React Native secure storage + database
- Used to generate new access tokens

**Flow:**
```
1. User signs up/logs in → Receive access + refresh tokens
2. Store both in expo-secure-store
3. Include access token in Authorization header
4. If access token expires → Use refresh token to get new access token
5. If refresh token expires → Force re-login
```

**Password Security:**
- bcrypt hashing (10 rounds)
- Min 8 characters, 1 uppercase, 1 number

**API Authentication Middleware:**
```javascript
// Verify JWT on protected routes
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```


### API Structure (Node.js + Express)

**Project Structure:**
```
forge-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── training.routes.js
│   │   ├── questions.routes.js
│   │   ├── user.routes.js
│   │   └── ai.routes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── trainingController.js
│   │   ├── questionController.js
│   │   ├── userController.js
│   │   └── aiController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── trainingService.js
│   │   ├── questionService.js
│   │   ├── userService.js
│   │   └── aiEvaluationService.js
│   ├── models/
│   │   └── db.js
│   └── utils/
│       ├── validators.js
│       └── helpers.js
├── .env
├── package.json
└── server.js
```


**Key API Endpoints:**

**Auth Routes:**
```
POST /auth/signup
  Body: { email, password, displayName }
  Returns: { user, accessToken, refreshToken }

POST /auth/login
  Body: { email, password }
  Returns: { user, accessToken, refreshToken }

POST /auth/refresh
  Body: { refreshToken }
  Returns: { accessToken }

POST /auth/logout
  Body: { refreshToken }
  Returns: { success: true }
```

**Training Routes:**
```
GET /training/days
  Returns: [{ id, dayNumber, title, theme, totalXp, isLocked, progress }]

GET /training/sessions/:dayId
  Returns: [{ id, sessionNumber, questionCount, estimatedMinutes, xpReward, progress }]

GET /training/current
  Returns: { currentDay, currentSession, nextQuestion }
```

**Question Routes:**
```
GET /questions/session/:sessionId
  Returns: [{ id, type, text, content, xpValue, timeLimit, order }]

POST /questions/submit
  Body: { questionId, userAnswer, timeTaken }
  Returns: { isCorrect, xpAwarded, feedback, aiEvaluation }
```


**User Routes:**
```
GET /user/profile
  Returns: { id, email, displayName, totalXp, rank, streak, lastActiveDate }

PATCH /user/profile
  Body: { displayName }
  Returns: { user }

GET /user/progress
  Returns: { 
    daysCompleted, 
    questionsAnswered, 
    accuracy, 
    xpHistory,
    currentStreak 
  }
```

**AI Routes:**
```
POST /ai/evaluate
  Body: { questionId, questionText, userAnswer, criteria }
  Returns: { score, strengths, weaknesses, suggestions }
```

---

## PART 2: CONTENT REQUIREMENTS

### Target: 300-400 Validated SSB Questions

**Days 0-2 (Beta Launch): 120 questions**
- Day 0: 40 questions (SSB Orientation)
- Day 1: 40 questions (OIR + PPDT)
- Day 2: 40 questions (SRT + WAT)

**Days 3-8 (Post-Beta): 240 questions**
- Day 3: 40 questions (TAT + Interview Prep)
- Day 4: 40 questions (GTO + Leadership)
- Day 5: 40 questions (Current Affairs + OLQs)
- Day 6: 40 questions (Advanced OIR + PPDT)
- Day 7: 40 questions (Advanced SRT + WAT)
- Day 8: 40 questions (Mock Interview + Comprehensive)

**Total: 360 questions**


### Question Distribution by Type (360 total)

**MCQ: 160 questions (44%)**
- Best for: OIR, PPDT, Current Affairs, SSB Knowledge
- Difficulty: 60 Easy, 70 Medium, 30 Hard

**Single Word: 72 questions (20%)**
- Best for: WAT, Quick Recall, Terminology
- Difficulty: 30 Easy, 30 Medium, 12 Hard

**Numeric: 36 questions (10%)**
- Best for: OIR, Logical Reasoning
- Difficulty: 12 Easy, 18 Medium, 6 Hard

**Rapid Response: 54 questions (15%)**
- Best for: SRT, Decision-Making, GTO Scenarios
- Time Limit: 60 seconds each
- Difficulty: 20 Easy, 24 Medium, 10 Hard

**Subjective: 38 questions (11%)**
- Best for: TAT, Interview Prep, Leadership Analysis
- Word Limit: 50-200 words
- Difficulty: 10 Easy, 20 Medium, 8 Hard

### Question Distribution by SSB Category

**OIR (Officer Intelligence Rating): 80 questions**
- Verbal Reasoning: 30
- Non-Verbal Reasoning: 25
- Numerical Ability: 25

**PPDT (Picture Perception): 40 questions**
- Story Writing: 15
- Thematic Analysis: 15
- Discussion Points: 10


**SRT (Situation Reaction Test): 60 questions**
- Leadership Situations: 20
- Emergency Response: 15
- Ethical Dilemmas: 15
- Team Conflicts: 10

**WAT (Word Association Test): 50 questions**
- Positive Words: 20
- Neutral Words: 20
- Challenge Words: 10

**TAT (Thematic Apperception Test): 30 questions**
- Picture-Based Stories: 15
- Situational Analysis: 10
- Character Development: 5

**Interview Preparation: 50 questions**
- Personal Questions: 15
- Current Affairs: 15
- Service Knowledge: 10
- Scenario-Based: 10

**GTO (Group Testing Officer): 30 questions**
- Group Planning: 10
- Progressive Group Tasks: 10
- Command Tasks: 10

**OLQs (Officer Like Qualities): 20 questions**
- Cross-cutting themes across all categories

---


## PART 3: FILE-BY-FILE IMPLEMENTATION PLAN

### KEEP UNCHANGED (V1 Assets to Reuse)

**Design System:**
- ✅ `src/constants/tokens.ts` — Colors, fonts, spacing
- ✅ `src/components/ui/CornerMarkers.tsx`
- ✅ `src/components/ui/ScreenMeta.tsx`
- ✅ `src/components/ui/TacticalButton.tsx`

**Assets:**
- ✅ `assets/` — All icons, splash screens, fonts

**Build Configuration:**
- ✅ `babel.config.js`
- ✅ `app.config.ts`
- ✅ `.gitignore`
- ✅ `package.json` (add new dependencies only)

**Utilities:**
- ✅ `src/utils/date.ts` — Reusable date functions
- ✅ `src/utils/validation.ts` — Input validation

**Auth UI Screens (minimal changes):**
- ✅ `app/(auth)/_layout.tsx`
- ⚠️ `app/(auth)/login.tsx` — Modify API calls only
- ⚠️ `app/(auth)/signup.tsx` — Modify API calls only
- ⚠️ `app/(auth)/forgot-password.tsx` — Modify API calls only
- ✅ `app/(auth)/check-email.tsx`

---


### ARCHIVE (Move to archive/v1/)

**Supabase Infrastructure:**
- 📦 `src/services/supabase.ts`
- 📦 `supabase/migrations/*.sql`
- 📦 All Supabase-specific code

**V1 Mission System:**
- 📦 `src/services/mission.service.ts`
- 📦 `src/hooks/useMissionEngine.ts`
- 📦 `src/components/mission-types/` (entire folder)
- 📦 `src/store/mission.store.ts`

**V1 Screens:**
- 📦 `app/mission/[id].tsx`
- 📦 `app/mission/success.tsx`
- 📦 `app/mission/failure.tsx`

**V1 Documentation:**
- 📦 `DAY*.md` files
- 📦 `BUG_FIXES_APPLIED.md`
- 📦 `BUILD_LOG.md`
- 📦 `VALIDATION_*.sql`
- 📦 `COMPLETE_SCHEMA.sql`
- 📦 `docs/FORGE_CONTENT_V1.md`

**Note:** Do not delete. Keep in `archive/v1/` for reference.

---


### MODIFY (Adapt for V2)

**Type Definitions:**
- ⚠️ `src/types/index.ts`
  - Remove: Mission-related types
  - Add: Training day types, question types, session types
  - Keep: DbUser, rank system types

**Auth Store:**
- ⚠️ `src/store/auth.store.ts`
  - Keep structure
  - Modify: Remove Supabase session type
  - Add: JWT token storage

**Auth Hook:**
- ⚠️ `src/hooks/useAuth.ts`
  - Keep interface
  - Modify: Use JWT auth instead of Supabase

**Dashboard:**
- ⚠️ `app/(tabs)/index.tsx`
  - Keep UI structure
  - Modify: Display training days instead of missions
  - API calls: Use Hostinger API

**Training Library:**
- ⚠️ `app/(tabs)/missions.tsx`
  - Rename file to: `library.tsx`
  - Keep card layout
  - Modify: Display Days 0-8 with sessions
  - API calls: Use Hostinger API

**Profile:**
- ⚠️ `app/(tabs)/profile.tsx`
  - Keep UI structure
  - Modify: Display training metrics instead of missions
  - API calls: Use Hostinger API

**Bottom Navigation:**
- ⚠️ `app/(tabs)/_layout.tsx`
  - Keep structure
  - Rename tab: "Missions" → "Training"


**Root Layout:**
- ⚠️ `app/_layout.tsx`
  - Keep structure
  - Modify: Use JWT auth check instead of Supabase

**Environment Variables:**
- ⚠️ `.env` & `.env.example`
  - Remove: Supabase keys
  - Add: Hostinger API URL, JWT secret (client doesn't need this)

---

### CREATE (New Files for V2)

**API Service Layer:**
- ➕ `src/services/api.ts` — Axios instance with JWT interceptors
- ➕ `src/services/auth.service.ts` — Login, signup, token refresh
- ➕ `src/services/training.service.ts` — Fetch days, sessions
- ➕ `src/services/question.service.ts` — Submit answers, fetch questions
- ➕ `src/services/ai-evaluation.service.ts` — AI feedback integration

**Question Type Components:**
- ➕ `src/components/question-types/MCQQuestion.tsx`
- ➕ `src/components/question-types/SingleWordQuestion.tsx`
- ➕ `src/components/question-types/NumericQuestion.tsx`
- ➕ `src/components/question-types/RapidResponseQuestion.tsx`
- ➕ `src/components/question-types/SubjectiveQuestion.tsx`
- ➕ `src/components/question-types/QuestionFeedback.tsx`

**Training Components:**
- ➕ `src/components/training/DayCard.tsx`
- ➕ `src/components/training/SessionCard.tsx`
- ➕ `src/components/training/ProgressBar.tsx`


**Hooks:**
- ➕ `src/hooks/useTrainingEngine.ts` — Session flow logic
- ➕ `src/hooks/useQuestion.ts` — Question submission logic

**Screens:**
- ➕ `app/training/day/[dayId].tsx` — Day overview screen
- ➕ `app/training/session/[sessionId].tsx` — Question flow screen
- ➕ `app/training/session-summary.tsx` — Session complete screen
- ➕ `app/training/day-complete.tsx` — Day complete screen

**Backend (Node.js API):**
- ➕ `forge-api/` — Complete API folder structure (see Part 1)
- ➕ `forge-api/src/config/database.js`
- ➕ `forge-api/src/config/jwt.js`
- ➕ `forge-api/src/middleware/auth.js`
- ➕ `forge-api/src/routes/*.routes.js`
- ➕ `forge-api/src/controllers/*.controller.js`
- ➕ `forge-api/src/services/*.service.js`
- ➕ `forge-api/server.js`
- ➕ `forge-api/.env`

**Database:**
- ➕ `forge-api/database/schema.sql` — Complete MySQL schema
- ➕ `forge-api/database/seed_days_0_2.sql` — Beta content (120 questions)
- ➕ `forge-api/database/seed_days_3_8.sql` — Post-beta content (240 questions)

---


## PART 4: IMPLEMENTATION ORDER

### Phase 1: Backend Foundation (June 15, Day 1)

**Time: 8 hours**

**Tasks:**
1. Set up Hostinger MySQL database (1h)
2. Create `forge-api/` folder structure (30m)
3. Implement database schema (`schema.sql`) (2h)
4. Build auth service (JWT logic, bcrypt) (2h)
5. Build auth routes + controller (1h)
6. Test signup/login locally (1h)
7. Deploy API to Hostinger (30m)

**Deliverables:**
- ✅ MySQL database live on Hostinger
- ✅ Auth endpoints working (`/auth/signup`, `/auth/login`)
- ✅ JWT tokens generating correctly

**Founder Focus:** Backend only

**Co-founder Focus:** Begin content creation (research SSB questions)

---

### Phase 2: Training API + Content Seeding (June 16, Day 2)

**Time: 10 hours**

**Tasks:**
1. Build training service (days, sessions logic) (2h)
2. Build question service (submit, validate) (2h)
3. Build training routes + controller (1h)
4. Build question routes + controller (1h)
5. Receive Day 0-2 content from co-founder (40 questions) (0h)
6. Create seed scripts for Days 0-2 (2h)
7. Seed database with 120 questions (1h)
8. Test API endpoints with Postman (1h)


**Deliverables:**
- ✅ Training endpoints working
- ✅ Question endpoints working
- ✅ 120 questions seeded (Days 0-2)

**Founder Focus:** Backend API completion

**Co-founder Focus:** Create 120 questions for Days 0-2 (deadline: EOD June 16)

---

### Phase 3: Mobile Services Layer (June 17, Day 3)

**Time: 10 hours**

**Tasks:**
1. Archive V1 files (1h)
2. Create `src/services/api.ts` with axios + JWT interceptors (2h)
3. Build `auth.service.ts` (login, signup, refresh) (2h)
4. Build `training.service.ts` (fetch days, sessions) (2h)
5. Build `question.service.ts` (submit, fetch) (2h)
6. Update type definitions (`src/types/index.ts`) (1h)

**Deliverables:**
- ✅ Mobile services layer complete
- ✅ API integration working
- ✅ Type definitions updated

**Founder Focus:** Mobile service layer

**Co-founder Focus:** Create Days 3-4 content (80 questions)

---


### Phase 4: Auth UI + Question Components (June 18, Day 4)

**Time: 12 hours**

**Tasks:**
1. Update auth screens (login, signup) to use new API (2h)
2. Update auth store + hook for JWT (2h)
3. Build MCQQuestion component (2h)
4. Build SingleWordQuestion component (1h)
5. Build NumericQuestion component (1h)
6. Build RapidResponseQuestion component (2h)
7. Build SubjectiveQuestion component (2h)

**Deliverables:**
- ✅ Auth flow working end-to-end
- ✅ All 5 question type components ready

**Founder Focus:** Auth + Question components

**Co-founder Focus:** Create Days 5-6 content (80 questions)

---

### Phase 5: Training UI + Session Flow (June 19, Day 5)

**Time: 12 hours**

**Tasks:**
1. Update dashboard (`index.tsx`) for training days (3h)
2. Update training library (`library.tsx`) for Days 0-8 (3h)
3. Build session flow screen (`session/[sessionId].tsx`) (4h)
4. Build session summary screen (2h)

**Deliverables:**
- ✅ Dashboard shows current training day
- ✅ Training library shows Days 0-8 (0-2 unlocked)
- ✅ Session flow working


**Founder Focus:** Training UI

**Co-founder Focus:** Create Days 7-8 content (80 questions) + review all 360

---

### Phase 6: AI Integration + Testing (June 20, Day 6)

**Time: 10 hours**

**Tasks:**
1. Implement AI evaluation service (Google Gemini) (3h)
2. Add AI evaluation to question submission flow (1h)
3. Build day complete screen (1h)
4. End-to-end testing (Days 0-2 full flow) (3h)
5. Bug fixes (2h)

**Deliverables:**
- ✅ AI evaluation working for subjective questions
- ✅ Days 0-2 fully functional
- ✅ Beta ready for launch

**Founder Focus:** AI + Testing + Launch

**Co-founder Focus:** Final content validation + beta support

---

### Phase 7: Post-Beta Content Seeding (June 21-23)

**Time: 6 hours**

**Tasks:**
1. Receive Days 3-8 content from co-founder (240 questions)
2. Create seed scripts for Days 3-8 (3h)
3. Seed production database (1h)
4. Test Days 3-8 (2h)

**Deliverables:**
- ✅ All 360 questions seeded
- ✅ Days 3-8 unlocked for users


---

## PART 5: DETAILED FILE ACTIONS

### Backend Files (Create All)

**forge-api/server.js**
- Entry point
- Express app initialization
- Route mounting
- Error handling middleware

**forge-api/src/config/database.js**
- MySQL connection pool
- Connection error handling
- Query execution helpers

**forge-api/src/config/jwt.js**
- JWT secret management
- Token generation
- Token verification

**forge-api/src/middleware/auth.js**
- `authenticateToken()` — Verify JWT on protected routes
- Extract user from token
- Attach to req.user

**forge-api/src/middleware/errorHandler.js**
- Global error handler
- Log errors
- Return JSON error responses

**forge-api/src/routes/auth.routes.js**
- POST /signup
- POST /login
- POST /refresh
- POST /logout


**forge-api/src/routes/training.routes.js**
- GET /days
- GET /sessions/:dayId
- GET /current

**forge-api/src/routes/questions.routes.js**
- GET /session/:sessionId
- POST /submit

**forge-api/src/routes/user.routes.js**
- GET /profile
- PATCH /profile
- GET /progress

**forge-api/src/routes/ai.routes.js**
- POST /evaluate

**forge-api/src/controllers/authController.js**
- signup()
- login()
- refresh()
- logout()

**forge-api/src/controllers/trainingController.js**
- getTrainingDays()
- getSessions()
- getCurrentTrainingDay()

**forge-api/src/controllers/questionController.js**
- getSessionQuestions()
- submitQuestionResponse()

**forge-api/src/controllers/userController.js**
- getProfile()
- updateProfile()
- getProgress()


**forge-api/src/controllers/aiController.js**
- evaluateSubjectiveAnswer()

**forge-api/src/services/authService.js**
- createUser() — Hash password, insert to DB
- validateCredentials() — Check email/password
- generateTokens() — Create access + refresh tokens
- verifyRefreshToken() — Validate refresh token

**forge-api/src/services/trainingService.js**
- fetchAllDays() — Get training_days with user progress
- fetchSessionsByDay() — Get sessions for a day
- getUserCurrentSession() — Determine next incomplete session

**forge-api/src/services/questionService.js**
- fetchQuestionsBySession() — Get ordered questions
- validateAnswer() — Check if answer is correct
- awardXP() — Calculate and update user XP
- updateStreak() — Update daily streak

**forge-api/src/services/userService.js**
- getUserProfile() — Fetch user data
- updateUserProfile() — Update display_name
- getUserProgress() — Calculate stats

**forge-api/src/services/aiEvaluationService.js**
- callGeminiAPI() — Send question + answer to Gemini
- parseEvaluation() — Extract score, feedback
- storeEvaluation() — Save to question_responses.ai_evaluation


### Mobile Files

**MODIFY:**

**src/types/index.ts**
- Remove: All mission types
- Add: TrainingDay, Session, Question, QuestionResponse types
- Keep: DbUser, RANK_THRESHOLDS

**src/store/auth.store.ts**
- Remove: Supabase Session type
- Add: JWT token storage (accessToken, refreshToken)
- Keep: user, profile, isLoading, isInitialized

**src/hooks/useAuth.ts**
- Modify: Use auth.service.ts instead of Supabase
- Keep: Same interface (login, signup, logout functions)

**app/(auth)/login.tsx**
- Modify: Call `authService.login()` instead of Supabase
- Store JWT tokens in auth store
- Keep: UI structure unchanged

**app/(auth)/signup.tsx**
- Modify: Call `authService.signup()` instead of Supabase
- Store JWT tokens in auth store
- Keep: UI structure unchanged

**app/(auth)/forgot-password.tsx**
- Modify: Call password reset API endpoint
- Keep: UI structure unchanged


**app/_layout.tsx**
- Modify: Use JWT token check instead of Supabase session
- Keep: Navigation structure unchanged

**app/(tabs)/_layout.tsx**
- Modify: Rename "Missions" tab → "Training"
- Keep: 3-tab structure

**app/(tabs)/index.tsx** (Dashboard)
- Modify: Display current training day instead of featured mission
- API calls: Use trainingService.getCurrentTrainingDay()
- Keep: Streak/XP/rank display, tactical UI

**app/(tabs)/missions.tsx → library.tsx**
- Rename file
- Modify: Display training days (0-8) instead of missions
- Show session progress per day
- Lock Days 3-8 with "Coming Soon"
- API calls: Use trainingService.fetchAllDays()

**app/(tabs)/profile.tsx**
- Modify: Display training stats (days completed, questions answered)
- API calls: Use userService.getProgress()
- Keep: XP/rank/streak display

---


**CREATE:**

**src/services/api.ts**
- Axios instance with base URL
- Request interceptor: Add JWT to Authorization header
- Response interceptor: Handle 401 (refresh token)
- Error handling

**src/services/auth.service.ts**
```typescript
export async function signup(email, password, displayName): Promise<AuthResult>
export async function login(email, password): Promise<AuthResult>
export async function refreshAccessToken(refreshToken): Promise<string>
export async function logout(refreshToken): Promise<void>
```

**src/services/training.service.ts**
```typescript
export async function fetchTrainingDays(): Promise<TrainingDay[]>
export async function fetchSessions(dayId): Promise<Session[]>
export async function getCurrentTrainingDay(): Promise<CurrentProgress>
```

**src/services/question.service.ts**
```typescript
export async function fetchSessionQuestions(sessionId): Promise<Question[]>
export async function submitAnswer(params): Promise<QuestionResult>
```

**src/services/ai-evaluation.service.ts**
```typescript
export async function evaluateSubjectiveAnswer(questionText, userAnswer): Promise<AIFeedback>
```


**src/hooks/useTrainingEngine.ts**
```typescript
export function useTrainingEngine() {
  const loadSession = (sessionId) => { ... }
  const submitAnswer = (questionId, answer, timeTaken) => { ... }
  const nextQuestion = () => { ... }
  const completeSession = () => { ... }
  
  return { 
    currentQuestion, 
    questionNumber, 
    totalQuestions,
    isSubmitting,
    submitAnswer,
    nextQuestion 
  }
}
```

**src/components/question-types/MCQQuestion.tsx**
- Display question text
- Render 4 radio button options
- Submit button
- Show feedback (correct/incorrect + explanation)

**src/components/question-types/SingleWordQuestion.tsx**
- Text input (1 word)
- Character limit: 50
- Submit button
- Validation feedback

**src/components/question-types/NumericQuestion.tsx**
- Number input
- Unit display
- Submit button
- Validation feedback

**src/components/question-types/RapidResponseQuestion.tsx**
- Timer countdown (60s default)
- 3-4 option buttons
- Auto-submit on timeout
- Decision feedback


**src/components/question-types/SubjectiveQuestion.tsx**
- Multiline text input
- Word count display
- Min/max word limits
- Submit button
- Loading state for AI evaluation
- Display AI feedback (score, strengths, weaknesses, suggestions)

**src/components/training/DayCard.tsx**
- Day number + title
- Theme badge
- Session progress (e.g., "2/3 sessions complete")
- Total XP available
- Lock state indicator
- Tap to navigate

**src/components/training/SessionCard.tsx**
- Session number
- Question count
- Estimated time
- XP reward
- Progress indicator
- Status badge (complete/in-progress/locked)

**src/components/training/ProgressBar.tsx**
- Current question number
- Total questions
- Visual progress bar
- Percentage display

**app/training/day/[dayId].tsx**
- Day overview
- Display 3 sessions
- Session cards with progress
- "Continue" or "Start Session" button


**app/training/session/[sessionId].tsx**
- Question flow screen
- Display one question at a time
- Progress bar (e.g., "Question 5/40")
- Render appropriate question type component
- Submit → Show feedback → Next button
- On session complete → Navigate to summary

**app/training/session-summary.tsx**
- Session stats:
  - Questions answered: X/Y
  - Correct: X/Y (Z%)
  - XP earned: +X
  - Time taken: X minutes
- Review incorrect questions
- "Continue to Next Session" button

**app/training/day-complete.tsx**
- Day complete animation
- Day title
- Total XP earned
- Accuracy percentage
- Rank progress indicator
- "Next day unlocked!" (if applicable)
- "Continue Training" button

---


## PART 6: CO-FOUNDER CONTENT CREATION SCHEDULE

### June 15 (Day 1) — Research & Setup
**6 hours**
- Study SSB question formats from books (Arihant, Disha, Pathfinder)
- Research OIR, PPDT, SRT, WAT, TAT question patterns
- Set up Google Sheet template with columns:
  - training_day
  - session_number
  - order_index
  - question_type
  - ssb_category
  - question_text
  - content (JSON)
  - correct_answer
  - xp_value
  - time_limit_seconds
  - difficulty
- Write 10 sample questions for validation

**Deliverable:** Google Sheet template + 10 samples

---

### June 16 (Day 2) — Day 0 Content (40 questions)
**10 hours**

**Session 1 (15 questions): SSB Basics**
- 10 MCQ: SSB process, stages, duration, eligibility
- 3 Single Word: SSB terminology
- 2 Subjective: "Why do you want to join armed forces?"

**Session 2 (15 questions): OLQ Introduction**
- 10 MCQ: Officer-like qualities definitions
- 3 Single Word: OLQ terminology
- 2 Subjective: "Describe a situation showing leadership"


**Session 3 (10 questions): SSB Test Overview**
- 5 MCQ: Test types (OIR, PPDT, GTO, etc.)
- 2 Rapid Response: Quick decision scenarios
- 3 Subjective: "How would you prepare for SSB?"

**Deliverable:** 40 validated questions in Google Sheet

---

### June 17 (Day 3) — Day 1 & Day 2 Content (80 questions)
**12 hours**

**Day 1 Session 1 (15 questions): OIR Verbal Reasoning**
- 10 MCQ: Analogies, synonyms, antonyms
- 3 Single Word: Word meanings
- 2 Numeric: Number sequences

**Day 1 Session 2 (15 questions): OIR Non-Verbal + PPDT Intro**
- 8 MCQ: Pattern recognition
- 4 Numeric: Mathematical reasoning
- 3 Subjective: PPDT story scenarios

**Day 1 Session 3 (10 questions): PPDT Practice**
- 3 Rapid Response: Picture interpretation decisions
- 4 Subjective: Story writing based on images
- 3 MCQ: PPDT evaluation criteria

**Day 2 Session 1 (15 questions): SRT Situations**
- 10 Rapid Response: Leadership situations
- 3 Single Word: Quick reactions
- 2 Subjective: SRT scenario analysis


**Day 2 Session 2 (15 questions): WAT Practice**
- 12 Single Word: Word association responses
- 3 MCQ: WAT principles and scoring

**Day 2 Session 3 (10 questions): Leadership Scenarios**
- 5 Subjective: Leadership challenges
- 3 Rapid Response: Command decisions
- 2 MCQ: Leadership theory

**Deliverable:** 80 questions (Day 1: 40, Day 2: 40) in Google Sheet

---

### June 18 (Day 4) — Days 3-4 Content (80 questions)
**10 hours**

**Day 3 Session 1-3 (40 questions): TAT + Interview Prep**
- TAT picture stories: 15 questions
- Interview preparation: 15 questions
- Current affairs: 10 questions

**Day 4 Session 1-3 (40 questions): GTO + Leadership**
- GTO scenarios: 20 questions
- Leadership exercises: 15 questions
- Team dynamics: 5 questions

**Deliverable:** 80 questions (Days 3-4) in Google Sheet

---

### June 19 (Day 5) — Days 5-6 Content (80 questions)
**10 hours**

**Day 5 (40 questions): Current Affairs + OLQs**
**Day 6 (40 questions): Advanced OIR + PPDT**

**Deliverable:** 80 questions (Days 5-6) in Google Sheet

---


### June 20 (Day 6) — Days 7-8 Content + Final Review (80 questions)
**10 hours**

**Day 7 (40 questions): Advanced SRT + WAT**
**Day 8 (40 questions): Mock Interview + Comprehensive**

**Final Review:**
- Validate all 360 questions
- Check JSON formatting
- Verify correct answers
- Add explanations for MCQs

**Deliverable:** Complete 360 questions validated and formatted

---

### Content Quality Standards

**Every Question Must Have:**
1. Clear question text (no ambiguity)
2. Valid JSON content structure
3. Correct answer (except subjective)
4. XP value (10-30 based on difficulty)
5. SSB category tag
6. Difficulty level

**MCQ Requirements:**
- 4 options (A, B, C, D)
- Only 1 correct answer
- Explanation for correct answer
- Plausible distractors

**Subjective Requirements:**
- Clear scenario/prompt
- Word limit (50-200 words)
- Evaluation criteria hints
- Example good answer structure

**Validation Checklist:**
- [ ] No spelling/grammar errors
- [ ] SSB-relevant content
- [ ] Appropriate difficulty
- [ ] Correct JSON formatting
- [ ] All fields populated

---


## PART 7: RISK MANAGEMENT

### Critical Risks

**1. Hostinger Setup Delays**
- **Risk:** MySQL setup or API deployment issues
- **Impact:** Backend delays cascade to frontend
- **Mitigation:** Complete Hostinger setup on Day 1 morning
- **Contingency:** Use local MySQL + ngrok tunnel for testing

**2. JWT Authentication Bugs**
- **Risk:** Token refresh logic fails, users logged out
- **Impact:** Poor user experience, beta failure
- **Mitigation:** Thoroughly test token flow on Day 3
- **Contingency:** Increase token lifetime temporarily (1 hour access token)

**3. Content Creation Delay**
- **Risk:** 360 questions not ready by deadline
- **Impact:** Incomplete training days
- **Mitigation:** Set hard deadline for each day's content
- **Contingency:** Launch with Days 0-2 (120 questions), add rest post-beta

**4. AI Evaluation Service Failure**
- **Risk:** Google Gemini API slow or unavailable
- **Impact:** Subjective questions don't provide feedback
- **Mitigation:** 8-second timeout, fallback response
- **Contingency:** Queue evaluations, process async, notify user later


**5. Mobile Service Layer Integration Issues**
- **Risk:** API calls fail, network errors not handled
- **Impact:** App crashes or hangs
- **Mitigation:** Implement robust error handling in api.ts
- **Contingency:** Add retry logic with exponential backoff

**6. Database Seeding Errors**
- **Risk:** SQL insert failures, foreign key violations
- **Impact:** Missing questions, broken sessions
- **Mitigation:** Validate seed scripts locally before production
- **Contingency:** Manual SQL fixes + re-seed

**7. XP/Streak Calculation Bugs**
- **Risk:** Wrong XP awarded, streak resets incorrectly
- **Impact:** User frustration, loss of trust
- **Mitigation:** Reuse V1 streak logic, manual XP testing
- **Contingency:** Database rollback + manual XP corrections

**8. Session Flow Navigation Issues**
- **Risk:** Users stuck between questions, can't progress
- **Impact:** Beta blocker
- **Mitigation:** Extensive testing on Day 5
- **Contingency:** Add "Skip Question" button as escape hatch

**9. Mobile UI Breaks on Different Screen Sizes**
- **Risk:** Components overflow on small screens
- **Impact:** Poor UX on some devices
- **Mitigation:** Test on multiple simulators (iPhone SE, Android)
- **Contingency:** Add responsive breakpoints post-beta


**10. Time Overruns**
- **Risk:** Implementation takes longer than estimated
- **Impact:** Miss June 20 deadline
- **Mitigation:** Cut scope if Day 4 shows delays
- **Contingency Plan:**
  - Drop Days 3-8 from beta (launch with Days 0-2 only)
  - Skip AI evaluation (add post-beta)
  - Simplify UI animations

---

## PART 8: TESTING STRATEGY

### Unit Testing (Optional for Beta)
- Focus: Manual testing only
- Post-Beta: Add Jest tests for services

### Integration Testing (Day 5-6)

**Test Scenarios:**
1. **Auth Flow**
   - Signup → Login → Logout → Login again
   - Token refresh on expiry
   - Invalid credentials handling

2. **Training Day Flow**
   - Fetch Days 0-8
   - Verify Days 3-8 show "locked"
   - Tap Day 0 → View sessions

3. **Session Flow**
   - Start Session 1
   - Answer all questions in order
   - Submit answers
   - Receive XP
   - Complete session
   - View summary


4. **Question Types**
   - MCQ: Select option → Submit → See feedback
   - Single Word: Type word → Submit → Validation
   - Numeric: Enter number → Submit → Validation
   - Rapid Response: Timer starts → Choose option → Auto-submit on timeout
   - Subjective: Write answer → Submit → AI evaluation → See feedback

5. **XP & Streak**
   - Complete Day 0 Session 1 → Verify XP awarded
   - Check streak increments
   - Check rank updates at thresholds (400, 1200 XP)
   - Complete session on consecutive days → Verify streak

6. **Day Completion**
   - Complete all 3 sessions of Day 0
   - View day completion screen
   - Verify Day 1 unlocks

7. **Error Handling**
   - Network offline → Show error message
   - API timeout → Show retry option
   - Invalid answer format → Show validation error

### Performance Testing
- Session load time: < 2 seconds
- Question submit latency: < 1 second
- AI evaluation: < 8 seconds (or timeout)

---


## PART 9: DEPLOYMENT CHECKLIST

### Backend Deployment (Hostinger)

**Pre-Deployment:**
- [ ] MySQL database created on Hostinger
- [ ] Schema.sql executed successfully
- [ ] Days 0-2 seed data inserted (120 questions)
- [ ] Environment variables configured (.env)
- [ ] API tested locally with Postman

**Deployment Steps:**
1. Upload `forge-api/` to Hostinger via FTP or Git
2. Install Node.js dependencies: `npm install --production`
3. Set environment variables in Hostinger panel
4. Configure Node.js app in Hostinger control panel
5. Point domain/subdomain to API: `https://api.theforge.app`
6. Test API endpoints via Postman
7. Monitor error logs

**Environment Variables:**
```
DB_HOST=localhost
DB_USER=forge_user
DB_PASSWORD=[secure_password]
DB_NAME=forge_db
JWT_SECRET=[secure_random_string]
JWT_REFRESH_SECRET=[secure_random_string]
GEMINI_API_KEY=[google_ai_studio_key]
NODE_ENV=production
PORT=3000
```


### Mobile Deployment

**Pre-Deployment:**
- [ ] Update `.env`: `EXPO_PUBLIC_API_URL=https://api.theforge.app`
- [ ] Remove all Supabase references
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on 1 physical device

**Build Steps:**
1. Run type check: `npm run typecheck`
2. Run linter: `npm run lint`
3. Build development APK: `eas build --platform android --profile development`
4. Install on test device
5. Manual testing (full flow)
6. If tests pass → Build production APK

**Production Build:**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Beta Distribution:**
- Android: Share APK via Google Drive
- iOS: TestFlight (if configured)
- Target: 5-10 beta testers

---


## PART 10: POST-BETA ROADMAP

### Week 1 Post-Beta (June 21-27)

**Priority 1: Seed Remaining Content**
- Insert Days 3-8 (240 questions)
- Test all sessions
- Unlock Days 3-8 for users

**Priority 2: Bug Fixes**
- Address beta user feedback
- Fix critical bugs
- Improve AI evaluation quality

**Priority 3: Performance Optimization**
- Optimize API queries (add indexes)
- Reduce API response times
- Optimize mobile app bundle size

### Week 2-3 Post-Beta (June 28 - July 11)

**Features:**
- Achievement system (badges)
- Progress analytics dashboard
- Question review mode
- Bookmark difficult questions
- Daily reminders (push notifications)

**Content:**
- Add 100 more questions (total: 460)
- Expert review of existing questions
- User-reported question improvements


### Month 2 (July 12 - August 11)

**Growth:**
- Public launch (beyond beta)
- Marketing campaigns
- SSB aspirant communities
- Coaching institute partnerships

**Features:**
- Mock SSB tests (full day simulation)
- Peer comparison (anonymized)
- Expert feedback on subjective answers (human review)
- Video explanations for complex questions

**Infrastructure:**
- Scale database (optimize indexes)
- Add CDN for assets
- Implement caching (Redis)
- Monitor costs

---

## PART 11: SUCCESS METRICS

### Beta Success Criteria (June 20)

**Technical:**
- [ ] All APIs responding < 2 seconds
- [ ] Zero crashes on critical flows
- [ ] Auth flow 100% success rate
- [ ] Days 0-2 fully functional
- [ ] AI evaluation working (>80% success rate)

**User Experience:**
- [ ] 5 beta users sign up
- [ ] 3 users complete Day 0
- [ ] 1 user completes Day 1
- [ ] Collect feedback on:
  - Question clarity
  - AI feedback quality
  - UI/UX
  - XP balance


**Content:**
- [ ] 120 questions validated and working
- [ ] All 5 question types functional
- [ ] AI evaluation helpful (user feedback)

### Week 1 Post-Beta Metrics

**Engagement:**
- 10+ users signed up
- 7+ users complete Day 0
- 5+ users complete Day 1
- 3+ users complete Day 2
- Average 20+ minutes per session

**Retention:**
- Day 1 → Day 2: 70% retention
- Day 2 → Day 3: 60% retention

**Content Quality:**
- Question clarity rating: > 4.0/5.0
- AI evaluation helpfulness: > 3.5/5.0
- Zero blocking bugs reported

---

## CONCLUSION

This migration plan provides a **realistic path to June 20 beta launch** with:

✅ **Full V2 architecture** (training days, 5 question types, AI evaluation)  
✅ **Hostinger backend** (MySQL + Node.js API)  
✅ **JWT authentication** (custom auth, no Supabase dependency)  
✅ **360 validated questions** (Days 0-8 complete)  
✅ **Preserved V1 assets** (tactical UI, XP/rank/streak systems)


**Key Decisions:**
1. Build V2 from scratch on Hostinger (don't modify V1 database)
2. Archive V1 for reference (don't delete)
3. Reuse design system, UI components, tactical aesthetic
4. Focus on Days 0-2 for beta (120 questions minimum)
5. Complete Days 3-8 post-beta (240 questions)
6. AI evaluation for subjective questions only

**Team Allocation:**
- **Founder:** Backend API + Mobile integration + Testing (68 hours over 6 days)
- **Co-founder:** Content creation (360 questions over 6 days)

**Timeline:**
- June 15: Backend foundation
- June 16: API completion + content seeding
- June 17: Mobile services
- June 18: Auth + Question components
- June 19: Training UI + Session flow
- June 20: AI integration + Testing + Launch

**Risk Mitigation:**
- Contingency plans for all critical risks
- Scope reduction options if delays occur
- Fallback: Launch with Days 0-2 only

**Post-Beta:**
- Seed Days 3-8 (June 21-23)
- Bug fixes from feedback
- Performance optimization
- Feature expansion (achievements, analytics)

---

**Next Step:** Founder approval → Begin June 15 execution

---

*End of Hostinger Migration Plan*
