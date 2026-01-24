# Comprehensive Icon Usage Audit Report
**Project:** edu-maths  
**Date:** January 22, 2026  
**Analyzed Folders:** frontend/src, mobile/app, mobile/components, my-react-app/src

---

## Summary

### Icon Libraries Installed:
1. **Mobile App:** `@expo/vector-icons` (Ionicons) - Version 15.0.3
2. **Frontend:** No icon library installed - Uses Unicode Emojis & Inline SVG
3. **My-React-App:** No icon library installed - Uses Unicode Emojis only

### Total Icon Types:
- **Ionicons (React Native):** 8 unique icons
- **Inline SVG Icons:** 2 unique icons (Sun and Moon for theme toggle)
- **Unicode Emoji Icons:** 35+ unique emojis

---

## 1. MOBILE APP (React Native)

### Icon Library: @expo/vector-icons (Ionicons)

#### Import Locations:
- [mobile/app/(auth)/(tabs)/home.tsx](mobile/app/(auth)/(tabs)/home.tsx#L6)
- [mobile/app/(auth)/(tabs)/_layout.tsx](mobile/app/(auth)/(tabs)/_layout.tsx#L3)

#### Icons Used:

1. **school** - Academy/Education indicator
   - [mobile/app/(auth)/(tabs)/home.tsx:128](mobile/app/(auth)/(tabs)/home.tsx#L128)
   - Purpose: Academy badge icon
   - Usage: `<Ionicons name="school" size={14} color="#007AFF" />`

2. **chevron-forward** - Navigation arrow
   - [mobile/app/(auth)/(tabs)/home.tsx:146](mobile/app/(auth)/(tabs)/home.tsx#L146)
   - Purpose: Next exam card arrow
   - Usage: `<Ionicons name="chevron-forward" size={20} color="#999" />`

3. **time-outline** - Time/Duration indicator
   - [mobile/app/(auth)/(tabs)/home.tsx:151](mobile/app/(auth)/(tabs)/home.tsx#L151)
   - Purpose: Exam end time display
   - Usage: `<Ionicons name="time-outline" size={16} color="#666" />`

4. **bar-chart-outline** - Statistics/Difficulty indicator
   - [mobile/app/(auth)/(tabs)/home.tsx:157](mobile/app/(auth)/(tabs)/home.tsx#L157)
   - Purpose: Exam difficulty display
   - Usage: `<Ionicons name="bar-chart-outline" size={16} color="#666" />`

5. **calendar-outline** - Calendar/Schedule
   - [mobile/app/(auth)/(tabs)/home.tsx:169](mobile/app/(auth)/(tabs)/home.tsx#L169)
   - Purpose: Empty state for no upcoming exams
   - Usage: `<Ionicons name="calendar-outline" size={32} color="#ccc" />`

6. **person-circle-outline** - User profile/account
   - [mobile/app/(auth)/(tabs)/_layout.tsx:45](mobile/app/(auth)/(tabs)/_layout.tsx#L45)
   - Purpose: Account actions button in header
   - Usage: `<Ionicons name="person-circle-outline" size={28} color="#fff" />`

7. **home-outline** - Home navigation
   - [mobile/app/(auth)/(tabs)/_layout.tsx:65](mobile/app/(auth)/(tabs)/_layout.tsx#L65)
   - Purpose: Tab bar home icon
   - Usage: `<Ionicons name="home-outline" size={size} color={color} />`

8. **document-text-outline** - Exams/Documents
   - [mobile/app/(auth)/(tabs)/_layout.tsx:75](mobile/app/(auth)/(tabs)/_layout.tsx#L75)
   - Purpose: Tab bar exams icon
   - Usage: `<Ionicons name="document-text-outline" size={size} color={color} />`

#### Duplicates Found:
**None** - Each Ionicons icon is used only once

#### Icons Grouped by Purpose:

**Navigation Icons:**
- chevron-forward (1 usage)
- home-outline (1 usage)
- document-text-outline (1 usage)

**Status/Information Icons:**
- school (1 usage)
- time-outline (1 usage)
- bar-chart-outline (1 usage)
- calendar-outline (1 usage)

**User Interface Icons:**
- person-circle-outline (1 usage)

---

## 2. FRONTEND (React Web App)

### Icon Library: Inline SVG + Unicode Emojis

### A. Inline SVG Icons

#### SVG Icons Used:

1. **Sun Icon** (Light Mode Toggle)
   - [frontend/src/components/ThemeToggle/ThemeToggle.jsx:16-37](frontend/src/components/ThemeToggle/ThemeToggle.jsx#L16-L37)
   - [frontend/src/components/FloatingThemeToggle/FloatingThemeToggle.jsx:16-37](frontend/src/components/FloatingThemeToggle/FloatingThemeToggle.jsx#L16-L37)
   - Purpose: Theme toggle button (light mode)
   - **Duplicate:** Used in 2 components

2. **Moon Icon** (Dark Mode Toggle)
   - [frontend/src/components/ThemeToggle/ThemeToggle.jsx:39-51](frontend/src/components/ThemeToggle/ThemeToggle.jsx#L39-L51)
   - [frontend/src/components/FloatingThemeToggle/FloatingThemeToggle.jsx:39-51](frontend/src/components/FloatingThemeToggle/FloatingThemeToggle.jsx#L39-L51)
   - Purpose: Theme toggle button (dark mode)
   - **Duplicate:** Used in 2 components

### B. Unicode Emoji Icons

#### Navigation & Brand Icons:

1. **📚 (Book)** - Brand/Logo
   - [frontend/src/common/Navbar/Navbar.jsx:22](frontend/src/common/Navbar/Navbar.jsx#L22)
   - [frontend/src/common/Footer/Footer.jsx:21](frontend/src/common/Footer/Footer.jsx#L21)
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:96](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L96)
   - [frontend/src/pages/Landing/Landing.jsx:19](frontend/src/pages/Landing/Landing.jsx#L19)
   - [frontend/src/exam/ExamPage/ExamResult.jsx:20](frontend/src/exam/ExamPage/ExamResult.jsx#L20)
   - [frontend/src/dashboard/StudentsList.jsx:303](frontend/src/dashboard/StudentsList.jsx#L303)
   - Purpose: EduMaths logo/branding
   - **Duplicate:** Used 6 times

2. **🏠 (House)** - Dashboard/Home
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:42](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L42)
   - [frontend/src/common/NotFound/NotFound.jsx:53](frontend/src/common/NotFound/NotFound.jsx#L53)
   - Purpose: Dashboard navigation, "Go Back Home" button
   - **Duplicate:** Used 2 times

3. **👥 (People)** - Students
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:47](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L47)
   - [frontend/src/dashboard/StudentsList.jsx:251](frontend/src/dashboard/StudentsList.jsx#L251)
   - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:243](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L243)
   - Purpose: Students section navigation and stats
   - **Duplicate:** Used 3 times

4. **📝 (Memo)** - Exams/Tests
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:52](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L52)
   - [frontend/src/exam/ExamPage.jsx:417](frontend/src/exam/ExamPage.jsx#L417)
   - [frontend/src/exam/ExamPage.jsx:717](frontend/src/exam/ExamPage.jsx#L717)
   - [frontend/src/dashboard/TeacherExamMonitoring.jsx:229](frontend/src/dashboard/TeacherExamMonitoring.jsx#L229)
   - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:286](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L286)
   - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:392](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L392)
   - [frontend/src/dashboard/StudentPerformanceDetails.jsx:229](frontend/src/dashboard/StudentPerformanceDetails.jsx#L229)
   - Purpose: Exams navigation and exam-related displays
   - **Duplicate:** Used 7 times

5. **📊 (Bar Chart)** - Results/Analytics
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:57](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L57)
   - [frontend/src/pages/Landing/Landing.jsx:85](frontend/src/pages/Landing/Landing.jsx#L85)
   - [frontend/src/dashboard/StudentsPerformance.jsx:151](frontend/src/dashboard/StudentsPerformance.jsx#L151)
   - [frontend/src/dashboard/StudentsPerformance.jsx:229](frontend/src/dashboard/StudentsPerformance.jsx#L229)
   - [frontend/src/dashboard/TeacherExamMonitoring.jsx:149](frontend/src/dashboard/TeacherExamMonitoring.jsx#L149)
   - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:329](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L329)
   - Purpose: Results/performance navigation and stats
   - **Duplicate:** Used 6 times

6. **⚙️ (Gear)** - Settings
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:62](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L62)
   - Purpose: Settings navigation
   - **Duplicate:** None

7. **🚪 (Door)** - Logout
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:144](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L144)
   - Purpose: Logout button
   - **Duplicate:** None (appears twice in same line for display)

8. **👤 (User Silhouette)** - User Avatar/Profile
   - [frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx:104](frontend/src/dashboard/DashboardLayout/DashboardLayout.jsx#L104)
   - [frontend/src/dashboard/StudentExamDetails.jsx:149](frontend/src/dashboard/StudentExamDetails.jsx#L149)
   - Purpose: User avatar display
   - **Duplicate:** Used 2 times

#### Action & Status Icons:

9. **✓ (Check Mark)** - Correct/Completed
   - [frontend/src/exam/ExamPage.jsx:552](frontend/src/exam/ExamPage.jsx#L552)
   - [frontend/src/exam/ExamPage.jsx:568](frontend/src/exam/ExamPage.jsx#L568)
   - [frontend/src/exam/ExamPage.jsx:807](frontend/src/exam/ExamPage.jsx#L807)
   - [frontend/src/dashboard/StudentExamDetails.jsx:272](frontend/src/dashboard/StudentExamDetails.jsx#L272)
   - [frontend/src/dashboard/StudentExamDetails.jsx:301](frontend/src/dashboard/StudentExamDetails.jsx#L301)
   - [frontend/src/dashboard/StudentExamDetails.jsx:311](frontend/src/dashboard/StudentExamDetails.jsx#L311)
   - Purpose: Answered/correct indicators
   - **Duplicate:** Used 6 times

10. **✗ (X Mark)** - Incorrect
    - [frontend/src/dashboard/StudentExamDetails.jsx:272](frontend/src/dashboard/StudentExamDetails.jsx#L272)
    - [frontend/src/dashboard/StudentExamDetails.jsx:306](frontend/src/dashboard/StudentExamDetails.jsx#L306)
    - Purpose: Incorrect answer indicator
    - **Duplicate:** Used 2 times

11. **× (Multiplication X)** - Close/Dismiss
    - [frontend/src/components/ErrorAlert.jsx:59](frontend/src/components/ErrorAlert.jsx#L59)
    - [frontend/src/components/ErrorAlert.jsx:122](frontend/src/components/ErrorAlert.jsx#L122)
    - [frontend/src/components/ErrorAlert.jsx:185](frontend/src/components/ErrorAlert.jsx#L185)
    - [frontend/src/dashboard/StudentsList.jsx:577](frontend/src/dashboard/StudentsList.jsx#L577)
    - Purpose: Close/dismiss alerts and modals
    - **Duplicate:** Used 4 times

12. **⏱️ (Stopwatch)** - Timer/Duration
    - [frontend/src/exam/ExamPage.jsx:772](frontend/src/exam/ExamPage.jsx#L772)
    - [frontend/src/exam/ExamPage/ExamPage.jsx:46](frontend/src/exam/ExamPage/ExamPage.jsx#L46)
    - Purpose: Exam timer display
    - **Duplicate:** Used 2 times

13. **🔍 (Magnifying Glass)** - Not Found
    - [frontend/src/common/NotFound/NotFound.jsx:11](frontend/src/common/NotFound/NotFound.jsx#L11)
    - Purpose: 404 page icon
    - **Duplicate:** None

14. **🎉 (Party Popper)** - Success/Celebration
    - [frontend/src/exam/ExamPage/ExamResult.jsx:20](frontend/src/exam/ExamPage/ExamResult.jsx#L20)
    - Purpose: Exam passed celebration
    - **Duplicate:** None

15. **🚀 (Rocket)** - Submit Action
    - [frontend/src/exam/ExamPage.jsx:968](frontend/src/exam/ExamPage.jsx#L968)
    - Purpose: Submit exam button
    - **Duplicate:** None

16. **👋 (Waving Hand)** - Greeting
    - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:139](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L139)
    - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:204](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L204)
    - [frontend/src/academy/AcademyStuff/AcademyPage.jsx:193](frontend/src/academy/AcademyStuff/AcademyPage.jsx#L193)
    - Purpose: Welcome message
    - **Duplicate:** Used 3 times

17. **☰ (Hamburger Menu)** - Mobile Menu Toggle
    - [frontend/src/common/Navbar/Navbar.jsx:54](frontend/src/common/Navbar/Navbar.jsx#L54)
    - Purpose: Mobile menu toggle
    - **Duplicate:** None (used with ✕ in conditional)

18. **✕ (Heavy X)** - Close Mobile Menu
    - [frontend/src/common/Navbar/Navbar.jsx:54](frontend/src/common/Navbar/Navbar.jsx#L54)
    - Purpose: Close mobile menu
    - **Duplicate:** None

19. **🔒 (Lock)** - Security/Locked
    - [frontend/src/pages/Landing/Landing.jsx:109](frontend/src/pages/Landing/Landing.jsx#L109)
    - Purpose: Security feature icon
    - **Duplicate:** None

20. **➕ (Plus)** - Add/Create
    - [frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:367](frontend/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L367)
    - [frontend/src/dashboard/CreateExam.jsx:158](frontend/src/dashboard/CreateExam.jsx#L158)
    - Purpose: Create exam button
    - **Duplicate:** Used 2 times

21. **📋 (Clipboard)** - Default Empty State
    - [frontend/src/components/EmptyState.jsx:8](frontend/src/components/EmptyState.jsx#L8)
    - Purpose: Default icon for empty state component
    - **Duplicate:** None

#### Console/Debug Icons (Not visible to users):
- 📊, 📄, 🔄, 📦, ➕ (used in console.log statements in TeacherDashboard.jsx)

---

## 3. MY-REACT-APP (React Web App)

### Icon Library: Unicode Emojis Only

#### Icons Used:

1. **📚 (Book)** - Brand/Logo
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:63](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L63)
   - [my-react-app/src/exam/ExamPage/ExamResult.jsx:20](my-react-app/src/exam/ExamPage/ExamResult.jsx#L20)
   - Purpose: Brand logo, exam failed state
   - **Duplicate:** Used 2 times

2. **🏠 (House)** - Dashboard
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:22](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L22)
   - [my-react-app/src/common/NotFound/NotFound.jsx:53](my-react-app/src/common/NotFound/NotFound.jsx#L53)
   - Purpose: Dashboard navigation
   - **Duplicate:** Used 2 times

3. **👥 (People)** - Students
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:27](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L27)
   - [my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:47](my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L47)
   - Purpose: Students navigation and stats
   - **Duplicate:** Used 2 times

4. **📝 (Memo)** - Exams
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:32](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L32)
   - [my-react-app/src/exam/ExamPage.jsx:423](my-react-app/src/exam/ExamPage.jsx#L423)
   - [my-react-app/src/exam/ExamPage.jsx:723](my-react-app/src/exam/ExamPage.jsx#L723)
   - [my-react-app/src/dashboard/TeacherExamMonitoring.jsx:280](my-react-app/src/dashboard/TeacherExamMonitoring.jsx#L280)
   - [my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:90](my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L90)
   - [my-react-app/src/academy/AcademyStuff/AcademyPage.jsx:147](my-react-app/src/academy/AcademyStuff/AcademyPage.jsx#L147)
   - [my-react-app/src/academy/AcademyStuff/AcademyPage.jsx:227](my-react-app/src/academy/AcademyStuff/AcademyPage.jsx#L227)
   - Purpose: Exams navigation and display
   - **Duplicate:** Used 7 times

5. **📊 (Bar Chart)** - Results
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:37](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L37)
   - [my-react-app/src/dashboard/TeacherExamMonitoring.jsx:165](my-react-app/src/dashboard/TeacherExamMonitoring.jsx#L165)
   - [my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:133](my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L133)
   - Purpose: Results navigation and stats
   - **Duplicate:** Used 3 times

6. **⚙️ (Gear)** - Settings
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:42](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L42)
   - Purpose: Settings navigation
   - **Duplicate:** None

7. **🚪 (Door)** - Logout
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:96](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L96)
   - Purpose: Logout button
   - **Duplicate:** None

8. **👤 (User Silhouette)** - User Avatar
   - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:70](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L70)
   - [my-react-app/src/dashboard/StudentExamDetails.jsx:138](my-react-app/src/dashboard/StudentExamDetails.jsx#L138)
   - Purpose: User avatar display
   - **Duplicate:** Used 2 times

9. **✓ (Check Mark)** - Correct/Done
   - [my-react-app/src/exam/ExamPage.jsx:558](my-react-app/src/exam/ExamPage.jsx#L558)
   - [my-react-app/src/exam/ExamPage.jsx:574](my-react-app/src/exam/ExamPage.jsx#L574)
   - [my-react-app/src/exam/ExamPage.jsx:813](my-react-app/src/exam/ExamPage.jsx#L813)
   - [my-react-app/src/dashboard/StudentExamDetails.jsx:261](my-react-app/src/dashboard/StudentExamDetails.jsx#L261)
   - [my-react-app/src/dashboard/StudentExamDetails.jsx:291](my-react-app/src/dashboard/StudentExamDetails.jsx#L291)
   - [my-react-app/src/dashboard/StudentExamDetails.jsx:301](my-react-app/src/dashboard/StudentExamDetails.jsx#L301)
   - Purpose: Answered/correct indicators
   - **Duplicate:** Used 6 times

10. **✗ (X Mark)** - Incorrect
    - [my-react-app/src/dashboard/StudentExamDetails.jsx:261](my-react-app/src/dashboard/StudentExamDetails.jsx#L261)
    - [my-react-app/src/dashboard/StudentExamDetails.jsx:296](my-react-app/src/dashboard/StudentExamDetails.jsx#L296)
    - Purpose: Incorrect answer indicator
    - **Duplicate:** Used 2 times

11. **⏱️ (Stopwatch)** - Timer
    - [my-react-app/src/exam/ExamPage.jsx:778](my-react-app/src/exam/ExamPage.jsx#L778)
    - [my-react-app/src/exam/ExamPage/ExamPage.jsx:46](my-react-app/src/exam/ExamPage/ExamPage.jsx#L46)
    - [my-react-app/src/academy/AcademyStuff/AcademyPage.jsx:226](my-react-app/src/academy/AcademyStuff/AcademyPage.jsx#L226)
    - Purpose: Exam timer and duration display
    - **Duplicate:** Used 3 times

12. **🔍 (Magnifying Glass)** - Not Found
    - [my-react-app/src/common/NotFound/NotFound.jsx:11](my-react-app/src/common/NotFound/NotFound.jsx#L11)
    - Purpose: 404 page icon
    - **Duplicate:** None

13. **🎉 (Party Popper)** - Success
    - [my-react-app/src/exam/ExamPage/ExamResult.jsx:20](my-react-app/src/exam/ExamPage/ExamResult.jsx#L20)
    - Purpose: Exam passed celebration
    - **Duplicate:** None

14. **🚀 (Rocket)** - Submit
    - [my-react-app/src/exam/ExamPage.jsx:975](my-react-app/src/exam/ExamPage.jsx#L975)
    - Purpose: Submit exam button
    - **Duplicate:** None

15. **👋 (Waving Hand)** - Greeting
    - [my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx:21](my-react-app/src/dashboard/TeacherDashboard/TeacherDashboard.jsx#L21)
    - Purpose: Welcome message
    - **Duplicate:** None

16. **☰ (Hamburger Menu)** - Mobile Menu
    - [my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx:58](my-react-app/src/dashboard/DashboardLayout/DashboardLayout.jsx#L58)
    - Purpose: Mobile menu toggle
    - **Duplicate:** None

---

## 4. MOBILE APP - ADDITIONAL EMOJI ICONS

### Unicode Emojis in Mobile:

1. **👋 (Waving Hand)** - Greeting
   - [mobile/app/(auth)/(tabs)/home.tsx:126](mobile/app/(auth)/(tabs)/home.tsx#L126)
   - Purpose: Welcome message
   - **Duplicate:** None

2. **📝 (Memo)** - Empty Exams State
   - [mobile/app/(auth)/(tabs)/exam.tsx:401](mobile/app/(auth)/(tabs)/exam.tsx#L401)
   - Purpose: Empty exams list icon
   - **Duplicate:** None

3. **⏱️ (Stopwatch)** - Timer
   - [mobile/app/(auth)/exam-taking.tsx:51](mobile/app/(auth)/exam-taking.tsx#L51)
   - Purpose: Exam timer display
   - **Duplicate:** None

4. **✓ (Check Mark)** - Synced/Completed
   - [mobile/app/(auth)/exam-taking.tsx:564](mobile/app/(auth)/exam-taking.tsx#L564)
   - [mobile/app/(auth)/result.tsx:141](mobile/app/(auth)/result.tsx#L141)
   - Purpose: Sync status, exam completion
   - **Duplicate:** Used 2 times

5. **🎉 (Party Popper)** - Success
   - [mobile/app/(auth)/exam-taking.tsx:613](mobile/app/(auth)/exam-taking.tsx#L613)
   - Purpose: Exam submitted successfully
   - **Duplicate:** None

6. **🏆 (Trophy)** - Outstanding Achievement
   - [mobile/app/(auth)/result.tsx:101](mobile/app/(auth)/result.tsx#L101)
   - Purpose: 95%+ score message
   - **Duplicate:** None

7. **🌟 (Star)** - Great Performance
   - [mobile/app/(auth)/result.tsx:102](mobile/app/(auth)/result.tsx#L102)
   - Purpose: 85-94% score message
   - **Duplicate:** None

8. **🚀 (Rocket)** - Progress
   - [mobile/app/(auth)/result.tsx:103](mobile/app/(auth)/result.tsx#L103)
   - Purpose: 70-84% score message
   - **Duplicate:** None

9. **👍 (Thumbs Up)** - Good Job
   - [mobile/app/(auth)/result.tsx:104](mobile/app/(auth)/result.tsx#L104)
   - Purpose: 60-69% score message
   - **Duplicate:** None

10. **💪 (Flexed Biceps)** - Keep Trying
    - [mobile/app/(auth)/result.tsx:105](mobile/app/(auth)/result.tsx#L105)
    - [mobile/app/(auth)/result.tsx:141](mobile/app/(auth)/result.tsx#L141)
    - Purpose: Encouragement for <60% score
    - **Duplicate:** Used 2 times

11. **⏰ (Alarm Clock)** - Auto-submit
    - [mobile/app/(auth)/result.tsx:121](mobile/app/(auth)/result.tsx#L121)
    - Purpose: Time expired indicator
    - **Duplicate:** None

12. **🔄 (Sync)** - Syncing/Retrying (Console logs)
    - [mobile/app/_layout.tsx:61](mobile/app/_layout.tsx#L61)
    - [mobile/app/(auth)/exam-taking.tsx:385](mobile/app/(auth)/exam-taking.tsx#L385)
    - [mobile/app/(auth)/exam-taking.tsx:543](mobile/app/(auth)/exam-taking.tsx#L543)
    - Purpose: Debug/user feedback
    - **Duplicate:** Used 3 times

---

## Icons Grouped by Purpose (All Projects Combined)

### Navigation Icons:
- 🏠 (House) - Dashboard/Home - 6 usages
- 👥 (People) - Students - 7 usages
- 📝 (Memo) - Exams - 21 usages
- 📊 (Bar Chart) - Results/Analytics - 12 usages
- ⚙️ (Gear) - Settings - 3 usages
- 🚪 (Door) - Logout - 3 usages
- Ionicons: home-outline, document-text-outline - 2 usages

### User Interface Icons:
- 👤 (User) - Avatar - 6 usages
- ☰ (Hamburger) - Menu - 2 usages
- × / ✕ (Close) - Dismiss - 5 usages
- 📚 (Books) - Brand/Logo - 8 usages
- Ionicons: person-circle-outline, chevron-forward - 2 usages

### Status/Action Icons:
- ✓ (Check) - Correct/Done - 14 usages
- ✗ (X Mark) - Incorrect - 4 usages
- 🎉 (Party) - Success/Celebration - 3 usages
- 🚀 (Rocket) - Submit/Progress - 3 usages
- ➕ (Plus) - Add/Create - 2 usages
- 👋 (Wave) - Greeting - 4 usages

### Information Icons:
- ⏱️ (Stopwatch) - Timer/Duration - 5 usages
- 🔍 (Search) - Not Found - 2 usages
- 🔒 (Lock) - Security - 1 usage
- 📋 (Clipboard) - Empty State - 1 usage
- Ionicons: time-outline, bar-chart-outline, calendar-outline, school - 4 usages

### Feedback/Achievement Icons:
- 🏆 (Trophy) - Outstanding - 1 usage
- 🌟 (Star) - Great - 1 usage
- 👍 (Thumbs) - Good - 1 usage
- 💪 (Biceps) - Keep Trying - 3 usages
- ⏰ (Alarm) - Time Up - 1 usage
- 🔄 (Sync) - Syncing - 4 usages

### Theme Toggle Icons (SVG):
- Sun (Light Mode) - 2 usages
- Moon (Dark Mode) - 2 usages

---

## Most Used Icons (Top 10):

1. **📝 (Memo)** - 21 usages (Exams)
2. **✓ (Check Mark)** - 14 usages (Correct/Done)
3. **📊 (Bar Chart)** - 12 usages (Results/Analytics)
4. **📚 (Books)** - 8 usages (Brand/Logo)
5. **👥 (People)** - 7 usages (Students)
6. **🏠 (House)** - 6 usages (Dashboard/Home)
7. **👤 (User)** - 6 usages (Avatar)
8. **⏱️ (Stopwatch)** - 5 usages (Timer)
9. **× / ✕ (Close)** - 5 usages (Dismiss)
10. **🔄 (Sync)** - 4 usages (Syncing)

---

## Recommendations:

### 1. **Consistency Issues:**
   - Frontend and My-React-App use almost identical emoji sets but no formal icon system
   - Mobile uses Ionicons professionally, but web apps rely on emojis
   - Consider standardizing on a single icon library across all platforms

### 2. **Potential Icon Library Options:**
   - **For Web (Frontend + My-React-App):** 
     - lucide-react (lightweight, consistent with existing SVG style)
     - react-icons (includes Ionicons for cross-platform consistency)
     - heroicons (modern, clean design)
   
   - **For Mobile:** 
     - Continue with @expo/vector-icons (already installed, works well)

### 3. **Duplicate Icon Usage:**
   - Many icons (especially navigation icons) are used repeatedly
   - Consider creating reusable icon components with consistent sizing/styling

### 4. **Accessibility Concerns:**
   - Emoji icons may not work well with screen readers
   - Consider adding proper ARIA labels and alt text
   - Professional icon libraries offer better accessibility support

### 5. **Visual Consistency:**
   - Mixing emojis, SVGs, and Ionicons creates inconsistent visual language
   - Emojis render differently across platforms (iOS, Android, Windows)
   - Professional icon library would provide consistent appearance

### 6. **Maintenance:**
   - Current approach scatters icon definitions across many files
   - Centralized icon system would improve maintainability
   - Consider creating an Icon component wrapper

---

## End of Report
