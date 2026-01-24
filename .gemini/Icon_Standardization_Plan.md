# 🎨 Lucide Icons Standardization Plan

**Date:** 2026-01-22  
**Status:** Ready to Implement  
**Package:** lucide-react@0.562.0 ✅ INSTALLED

---

## 📋 FILES TO UPDATE

Based on our previous work, here are all files with emojis/icons:

### **Priority 1: Dashboard Layout & Navigation**
1. ✅ `DashboardLayout.jsx` - Sidebar navigation icons
2. ✅ `TeacherDashboard.jsx` - Dashboard page icons
3. ✅ `StudentsList.jsx` - Student management icons
4. ✅ `StudentsPerformance.jsx` - Performance icons
5. ✅ `CreateExam.jsx` - Exam creation icons

### **Priority 2: Exam & Monitoring**
6. ✅ `TeacherExamMonitoring.jsx` - Monitoring icons
7. ✅ `StudentExamDetails.jsx` - Detail view icons
8. ✅ `StudentPerformanceDetails.jsx` - Performance icons
9. ✅ `ExamPage.jsx` - All exam phases

### **Priority 3: Public Pages**
10. ✅ `AcademyPage.jsx` - Academy page icons
11. ✅ `Navbar.jsx` - Navigation icons

### **Priority 4: Components**
12. ✅ `ThemeToggle.jsx` - Theme switch icons (CRITICAL)
13. ✅ `LoadingSpinner.jsx` - Loading icon
14. ✅ `Skeleton.jsx` - Skeleton loaders

---

## 🎯 ICON MAPPING REFERENCE

### **Navigation Icons (Size: 20px, Stroke: 2)**
```jsx
import {
  LayoutDashboard,  // 🏠 Dashboard
  Users,            // 👥 Students
  FileText,         // 📝 Exams
  ChartNoAxesCombined, // 📊 Results/Analytics
  Settings,         // ⚙️ Settings
  LogOut            // 🚪 Logout
} from 'lucide-react';
```

### **User Interface Icons**
```jsx
import {
  UserRound,        // 👤 Avatar/User
  Logs,             // ☰ Menu/Hamburger
  X,                // ✕ Close
  SquareUserRound,  // User Profile Circle
  ArrowRightToLine  // → Forward/Next
} from 'lucide-react';
```

### **Status/Action Icons (Size: 18-20px)**
```jsx
import {
  Check,            // ✓ Correct/Done
  SendHorizontal,   // Submit
  Loader,          // Loading/Progress
  UserRoundPlus,   // Add User
  Plus             // Create
} from 'lucide-react';
```

### **Information Icons**
```jsx
import {
  History,          // ⏱️ Timer/Duration
  UserRoundSearch,  // Search User
  Search,           // Search
  UserLock,         // Security
  Clipboard,        // Empty State
  CalendarDays,     // Calendar
  GraduationCap     // 📚 Academy/School
} from 'lucide-react';
```

### **Feedback Icons**
```jsx
import {
  CircleStar,       // Outstanding
  Star,             // Great
  ThumbsUp,         // Good
  AlarmClock,       // Time Up
  RefreshCw         // Syncing
} from 'lucide-react';
```

### **Theme Toggle Icons (Size: 22px)**
```jsx
import {
  Flashlight,       // ☀️ Light Mode
  FlashlightOff     // 🌙 Dark Mode
} from 'lucide-react';
```

---

## 🎨 STYLING STANDARDS

### **CSS Classes Pattern**

```jsx
// Navigation Icons
<LayoutDashboard 
  size={20} 
  strokeWidth={2}
  className="text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
/>

// Active Navigation
<LayoutDashboard 
  size={20} 
  strokeWidth={2}
  className="text-indigo-600 dark:text-indigo-400"
/>

// Table Action Icons
<UserRoundSearch 
  size={18} 
  strokeWidth={1.75}
  className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
/>

// Button Icons (inherit from parent)
<Plus 
  size={20} 
  strokeWidth={2}
  className="text-current"
/>

// Theme Toggle
<Flashlight 
  size={22} 
  strokeWidth={2}
  className="text-yellow-500 hover:scale-110 transition-transform duration-300"
/>
<FlashlightOff 
  size={22} 
  strokeWidth={2}
  className="text-indigo-400 hover:scale-110 transition-transform duration-300"
/>
```

---

## 📝 REPLACEMENT CHECKLIST

### **Emojis to Replace:**
- 🏠 → LayoutDashboard
- 👥 → Users
- 📝 → FileText
- 📊 → ChartNoAxesCombined
- ⚙️ → Settings
- 🚪 → LogOut
- 👤 → UserRound / SquareUserRound
- 📚 → GraduationCap
- ✓ → Check
- ✗ → X
- ⏱️ → History
- 📅 → CalendarDays
- ⭐ → Star / CircleStar
- 👍 → ThumbsUp
- ⏰ → AlarmClock
- ☀️ → Flashlight
- 🌙 → FlashlightOff

---

## 🚀 IMPLEMENTATION ORDER

1. **Phase 1: Core Navigation** (CRITICAL)
   - DashboardLayout.jsx
   - Navbar.jsx

2. **Phase 2: Theme Toggle** (HIGH PRIORITY)
   - ThemeToggle.jsx

3. **Phase 3: Dashboard Pages**
   - TeacherDashboard.jsx
   - StudentsList.jsx
   - StudentsPerformance.jsx

4. **Phase 4: Exam Pages**
   - CreateExam.jsx
   - ExamPage.jsx
   - TeacherExamMonitoring.jsx

5. **Phase 5: Detail Pages**
   - StudentExamDetails.jsx
   - StudentPerformanceDetails.jsx

6. **Phase 6: Public Pages**
   - AcademyPage.jsx

---

## ⚠️ CRITICAL RULES

1. ❌ NO hard-coded colors (#fff, #000, specific hex)
2. ✅ USE Tailwind classes with dark: variants
3. ✅ USE text-current for button icons
4. ✅ ADD aria-label to all icon buttons
5. ✅ ENSURE smooth transitions (0.3s)
6. ✅ TEST in both light AND dark mode

---

**Ready to implement!** 🚀
