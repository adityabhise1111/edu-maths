# 🎨 EduMaths Professional Layout Plan

## Design Theme Overview

**Primary Colors:** Purple (#6366f1) & Pink (#ec4899)  
**Style:** Modern, Clean, Gradient-focused  
**Typography:** Inter Font Family  
**Layout:** Card-based, Spacious, White backgrounds

---

## 📐 LAYOUT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL WRAPPER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PUBLIC LAYOUT (Marketing/Auth)                       │  │
│  │  • Navbar (Sticky)                                    │  │
│  │  • Content (Full Width/Contained)                     │  │
│  │  • Footer                                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DASHBOARD LAYOUT (Teacher)                           │  │
│  │  • Top Header (Fixed, 64px)                           │  │
│  │  • Sidebar (260px → 70px collapsed)                   │  │
│  │  • Main Content (Fluid)                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EXAM LAYOUT (Student)                                │  │
│  │  • Fixed Timer Bar (Sticky)                           │  │
│  │  • Scrollable Question Area                           │  │
│  │  • Navigation Controls                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏠 1. LANDING PAGE LAYOUT

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR (Sticky, White BG, Shadow)                       │
│  📚 EduMaths    [Features] [About]    [Login] [Sign Up] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              HERO SECTION (Full Height)                  │
│         Background: Gradient (Purple → Pink)             │
│                                                          │
│            📚 EduMaths                                   │
│     Your Gateway to Excellence                           │
│     Comprehensive exam management platform               │
│                                                          │
│     [Get Started Free]  [Teacher Login]                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│           FEATURES SECTION (White BG)                    │
│         Why Choose EduMaths?                             │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │    🎓     │  │    📊     │  │    🚀     │        │
│  │  Easy     │  │ Analytics │  │  Fast     │        │
│  │  Creation │  │ Real-time │  │  Setup    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  FOOTER (Gray BG)                                        │
│  © 2026 EduMaths | Privacy | Terms | Contact            │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.hero-section {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  min-height: 100vh;
  color: white;
  text-align: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(to right, white, rgba(255,255,255,0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
```

---

## 🔐 2. TEACHER LOGIN/SIGNUP PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│                  (Centered Layout)                       │
│                                                          │
│              ┌────────────────────┐                      │
│              │   CARD CONTAINER   │                      │
│              │                    │                      │
│              │    📚 EduMaths    │                      │
│              │   Teacher Login    │                      │
│              │                    │                      │
│              │  ┌──────────────┐  │                      │
│              │  │  Clerk Auth  │  │                      │
│              │  │  Component   │  │                      │
│              │  │              │  │                      │
│              │  │ Email Input  │  │                      │
│              │  │ Password     │  │                      │
│              │  │ [Sign In]    │  │                      │
│              │  └──────────────┘  │                      │
│              │                    │                      │
│              └────────────────────┘                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #fafafa);
}

.auth-card {
  width: 100%;
  max-width: 480px;
  padding: 3rem;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## 🏢 3. TEACHER DASHBOARD LAYOUT

### Visual Structure
```
┌──────────────────────────────────────────────────────────────────┐
│  TOP HEADER (Fixed, White BG, 64px height)                       │
│  [☰] 📚 EduMaths              academy-name      👤              │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│ SIDEBAR  │  MAIN CONTENT AREA (Scrollable)                      │
│ (260px)  │                                                       │
│          │  ┌─────────────────────────────────────────────────┐ │
│ ───────  │  │  PAGE HEADER (Gradient BG)                      │ │
│          │  │  Welcome, Teacher! 👋                           │ │
│ 🏠 Dash  │  │  Managing: Academy Name                         │ │
│ 👥 Stud  │  └─────────────────────────────────────────────────┘ │
│ 📝 Exam  │                                                       │
│ 📊 Resu  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│ ⚙️ Sett  │  │  120    │  │   45    │  │   890   │             │
│          │  │Students │  │  Exams  │  │Attempts │             │
│ ───────  │  └─────────┘  └─────────┘  └─────────┘             │
│          │                                                       │
│ 🚪 Exit  │  ┌─────────────────────────────────────────────────┐ │
│          │  │  RECENT EXAMS (Card)                            │ │
│          │  │  [Create New Exam]                              │ │
│          │  │                                                 │ │
│          │  │  📝 Math Test 1        🟢 Active    [View]      │ │
│          │  │  📝 Algebra Quiz       🔴 Ended     [View]      │ │
│          │  └─────────────────────────────────────────────────┘ │
│          │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

### Key Components

#### Sidebar Navigation
```jsx
<aside className="dashboard-sidebar">
  <div className="sidebar-logo">📚 EduMaths</div>
  
  <nav className="sidebar-nav">
    <Link to="/dashboard" className="nav-item active">
      <span className="nav-icon">🏠</span>
      <span className="nav-label">Dashboard</span>
    </Link>
    {/* More nav items */}
  </nav>
  
  <button className="logout-btn">
    <span className="nav-icon">🚪</span>
    <span className="nav-label">Logout</span>
  </button>
</aside>
```

#### Stats Cards
```jsx
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon">👥</div>
    <div className="stat-value">120</div>
    <div className="stat-label">Total Students</div>
  </div>
  {/* More stat cards */}
</div>
```

### CSS Classes
```css
.dashboard-main {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.dashboard-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.dashboard-sidebar--collapsed {
  width: 70px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #525252;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #6366f1;
}

.nav-item--active {
  background: #f5f5f5;
  color: #6366f1;
  border-right: 3px solid #6366f1;
  font-weight: 600;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
}

.page-header {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  padding: 3rem 2rem;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: -2rem 2rem 2rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #6366f1;
  margin: 0.5rem 0;
}
```

---

## 📝 4. CREATE EXAM PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│  [Dashboard Layout Wrapper]                              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PAGE HEADER                                       │  │
│  │  Create New Exam                                   │  │
│  │  Set up your exam parameters                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  FORM CARD                                         │  │
│  │                                                    │  │
│  │  Exam Title                                        │  │
│  │  [_________________________________]               │  │
│  │                                                    │  │
│  │  Difficulty Level                                  │  │
│  │  ○ Easy  ● Medium  ○ Hard                         │  │
│  │                                                    │  │
│  │  Number of Questions                               │  │
│  │  [__________]                                      │  │
│  │                                                    │  │
│  │  Duration (minutes)                                │  │
│  │  [__________]                                      │  │
│  │                                                    │  │
│  │  Start Time                                        │  │
│  │  [____________________]                            │  │
│  │                                                    │  │
│  │  [Cancel]  [Create Exam]                          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.form-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.form-card {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #404040;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d4d4d4;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #6366f1;
}
```

---

## 👥 5. STUDENTS LIST PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│  [Dashboard Layout]                                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PAGE HEADER                                       │  │
│  │  Students                                          │  │
│  │  Manage your academy students                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ACTIONS BAR                                       │  │
│  │  [🔍 Search students...]   [+ Add Student]        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  STUDENTS TABLE                                    │  │
│  │  ┌──────┬───────────┬──────────┬──────────┐       │  │
│  │  │ Name │ Username  │ Joined   │ Actions  │       │  │
│  │  ├──────┼───────────┼──────────┼──────────┤       │  │
│  │  │ John │ john123   │ Jan 2026 │ [View]   │       │  │
│  │  │ Jane │ jane456   │ Jan 2026 │ [View]   │       │  │
│  │  └──────┴───────────┴──────────┴──────────┘       │  │
│  │                                                    │  │
│  │  ← Previous    Page 1 of 5    Next →             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d4d4d4;
  border-radius: 0.5rem;
  background-image: url("data:image/svg+xml...");
  background-position: 0.75rem center;
  background-repeat: no-repeat;
}

.data-table {
  width: 100%;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.data-table th {
  background: #f5f5f5;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #404040;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 1rem;
  border-top: 1px solid #e5e5e5;
  color: #525252;
}

.data-table tr:hover {
  background: #fafafa;
}

.table-action-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #d4d4d4;
  border-radius: 0.375rem;
  color: #6366f1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action-btn:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
```

---

## 📊 6. EXAM MONITORING PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│  [Dashboard Layout]                                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  EXAM HEADER                                       │  │
│  │  Mathematics Test 1                                │  │
│  │  📅 Jan 15, 2026 | ⏱️ 60 mins | 🎓 Medium        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │    45     │  │    38     │  │   84.2%   │           │
│  │ Attempts  │  │Submitted  │  │  Average  │           │
│  └───────────┘  └───────────┘  └───────────┘           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  STUDENT ATTEMPTS                                  │  │
│  │  [Sort by: Score ▼]  [Filter: All ▼]             │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ 👤 John Doe     Score: 18/20   ⭐ 90%       │ │  │
│  │  │    Submitted: 2:35 PM          [View Details]│ │  │
│  │  ├──────────────────────────────────────────────┤ │  │
│  │  │ 👤 Jane Smith   Score: 16/20   ⭐ 80%       │ │  │
│  │  │    Submitted: 2:42 PM          [View Details]│ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📱 7. STUDENT EXAM TAKING PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│  FIXED TIMER BAR (Sticky, always visible)                │
│  Mathematics Test 1    Question 5/20    ⏱️ 45:30        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SCROLLABLE CONTENT                                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [Question 5 Badge]                                │  │
│  │                                                    │  │
│  │  What is the value of x in 2x + 5 = 15?          │  │
│  │                                                    │  │
│  │  ○  A. x = 5                                      │  │
│  │  ●  B. x = 10                                     │  │
│  │  ○  C. x = 15                                     │  │
│  │  ○  D. x = 20                                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  NAVIGATION                                        │  │
│  │  [◄ Previous]         [Next ►]     [Submit Exam]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  QUESTION PALETTE (Optional)                       │  │
│  │  [1✓][2✓][3✓][4✓][5●][6][7][8]...[20]           │  │
│  │  ✓ Answered  ● Current  Empty: Not visited        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.exam-timer-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 2px solid #e5e5e5;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: #f5f5f5;
  border-radius: 0.5rem;
}

.timer-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
  font-variant-numeric: tabular-nums;
}

.question-card {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin: 2rem auto;
  max-width: 800px;
}

.question-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: white;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.question-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #171717;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #fafafa;
  border: 2px solid #e5e5e5;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.1);
}

.option-item--selected {
  border-color: #6366f1;
  background: #f0f0ff;
}

.option-radio {
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 1rem;
  accent-color: #6366f1;
}

.option-label {
  font-weight: 600;
  margin-right: 1rem;
  color: #6366f1;
}

.option-text {
  font-size: 1rem;
  color: #404040;
}

.question-palette {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  margin: 2rem auto;
  max-width: 800px;
}

.palette-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #d4d4d4;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.palette-item--answered {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.palette-item--current {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.palette-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## 🎯 8. EXAM RESULT PAGE

### Visual Structure
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│           CENTERED RESULT CARD                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │              🎉                                    │  │
│  │         Exam Completed!                            │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │          SCORE DISPLAY                       │ │  │
│  │  │                                              │ │  │
│  │  │            18/20                             │ │  │
│  │  │            90%                               │ │  │
│  │  │         ⭐⭐⭐⭐⭐                          │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  Time Taken: 42 minutes                           │  │
│  │  Accuracy: 90%                                     │  │
│  │  Correct: 18 | Wrong: 2                           │  │
│  │                                                    │  │
│  │  [View Detailed Results]  [Back to Dashboard]    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.result-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #fafafa);
  padding: 2rem;
}

.result-card {
  background: white;
  padding: 4rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.result-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.result-title {
  font-size: 2rem;
  font-weight: 700;
  color: #171717;
  margin-bottom: 2rem;
}

.score-display {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  padding: 3rem 2rem;
  border-radius: 1rem;
  margin: 2rem 0;
}

.score-value {
  font-size: 4rem;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.score-percentage {
  font-size: 3rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  margin-top: 0.5rem;
}

.stars {
  font-size: 2rem;
  margin-top: 1rem;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-item {
  padding: 1rem;
  background: #fafafa;
  border-radius: 0.5rem;
}

.stat-item-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
}

.stat-item-label {
  font-size: 0.875rem;
  color: #737373;
  margin-top: 0.25rem;
}
```

---

## 🎨 COMPONENT LIBRARY

### Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: white;
  color: #6366f1;
  border: 2px solid #6366f1;
}

.btn-secondary:hover {
  background: #6366f1;
  color: white;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-full {
  width: 100%;
}
```

### Badges
```css
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--success {
  background: #dcfce7;
  color: #166534;
}

.badge--error {
  background: #fee2e2;
  color: #991b1b;
}

.badge--warning {
  background: #fef3c7;
  color: #92400e;
}

.badge--info {
  background: #dbeafe;
  color: #1e40af;
}
```

### Alerts
```css
.alert {
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
  margin-bottom: 1rem;
}

.alert--success {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.alert--error {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.alert--warning {
  background: #fef3c7;
  border-color: #eab308;
  color: #92400e;
}

.alert--info {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sidebar {
    transform: translateX(-100%);
  }
  
  .dashboard-sidebar--open {
    transform: translateX(0);
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .dashboard-academy-name {
    display: block;
  }
  
  .dashboard-mobile-toggle {
    display: none;
  }
}
```

---

## 🎭 ANIMATIONS

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Core Layouts
- [x] Landing Page Layout
- [x] Teacher Dashboard Layout
- [x] Exam Taking Layout
- [ ] Student Dashboard Layout (NEW)
- [ ] Error Boundary Layout

### Phase 2: Components
- [x] Cards
- [x] Buttons
- [x] Forms
- [ ] Modals
- [ ] Tooltips
- [ ] Breadcrumbs

### Phase 3: Responsive
- [x] Mobile Sidebar
- [x] Responsive Grid
- [ ] Mobile Navigation
- [ ] Touch Gestures

### Phase 4: Polish
- [x] Animations
- [x] Hover States
- [ ] Loading Skeletons
- [ ] Empty States

---

This layout plan follows your existing purple/pink gradient theme and provides a professional, modern interface that's consistent across all pages.
