# 🌓 Dark Mode - Quick Reference Guide

## 🎯 Quick Start

### Using the Theme Toggle
- **Location**: Top navigation (all pages) and dashboard header
- **Icon**: 🌙 Moon (switches to dark) or ☀️ Sun (switches to light)
- **Persistence**: Automatically saves your preference

## 🔧 For Developers

### Import and Use Theme
```javascript
import { useTheme } from '../../contexts/ThemeContext';

function MyComponent() {
    const { theme, toggleTheme, isDark } = useTheme();
    
    // Check current theme
    console.log(theme); // 'light' or 'dark'
    console.log(isDark); // boolean
    
    // Toggle theme
    <button onClick={toggleTheme}>Toggle</button>
}
```

### CSS Variables (Recommended Approach)
```css
/* Your component automatically works in both modes */
.my-component {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

/* Available CSS variables:
   Background: --bg-primary, --bg-secondary, --bg-card
   Text: --text-primary, --text-secondary, --text-muted
   Colors: --primary-purple, --accent-pink, --accent-teal
   Neutrals: --neutral-50 through --neutral-900
   Shadows: --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
   Borders: --border-color
*/
```

### Dark Mode Specific Styles (If Needed)
```css
/* Light mode */
.button {
    background: #fff;
    color: #000;
}

/* Dark mode override */
.dark .button {
    background: #222;
    color: #fff;
}

/* Or use data attribute */
[data-theme="dark"] .button {
    background: #222;
    color: #fff;
}
```

## 🎨 Available Theme Variables

### Light Mode→ Dark Mode
```
Background:
  #ffffff → #1a1a1a (bg-primary)
  #fafafa → #111111 (bg-secondary)
  #ffffff → #222222 (bg-card)

Text:
  #171717 → #f5f5f5 (text-primary)
  #525252 → #a3a3a3 (text-secondary)
  #737373 → #737373 (text-muted)

Borders:
  #e5e5e5 → rgba(255,255,255,0.1)
```

## 🧩 Example Components

### Card Component
```javascript
function Card({ children }) {
    return (
        <div className="card"> {/* Auto adapts! */}
            {children}
        </div>
    );
}
```

### Button with Theme Awareness
```javascript
import { useTheme } from '../../contexts/ThemeContext';

function ThemedButton() {
    const { isDark } = useTheme();
    
    return (
        <button className="btn btn-primary">
            {isDark ? '🌙' : '☀️'} Themed Button
        </button>
    );
}
```

### Adding Theme Toggle Anywhere
```javascript
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';

function MyPage() {
    return (
        <div>
            <ThemeToggle /> {/* That's it! */}
        </div>
    );
}
```

## 🔍 Debugging

### Check if Theme is Applied
```javascript
// In browser console:
document.documentElement.classList.contains('dark') // Should be true in dark mode
document.documentElement.getAttribute('data-theme') // Should be 'dark' or 'light'
localStorage.getItem('theme') // Should be 'dark' or 'light'
```

### Force Theme (For Testing)
```javascript
// In browser console:
localStorage.setItem('theme', 'dark');
location.reload(); // Reload to see changes
```

### Clear Theme (Use System Preference)
```javascript
// In browser console:
localStorage.removeItem('theme');
location.reload(); // Will use system preference
```

## ⚡ Performance Tips

1. **Always use CSS variables** - They're faster than conditional rendering
2. **Avoid inline styles** - Use classes that reference CSS variables
3. **Don't toggle on every render** - Only when user clicks

❌ **Bad:**
```javascript
<div style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
```

✅ **Good:**
```javascript
<div className="card"> {/* Uses var(--bg-card) */}
```

## 🎭 Accessibility Checklist

- ✅ SR-only labels on toggle
- ✅ Aria-label describes action
- ✅ Keyboard accessible (Tab + Enter)
- ✅ Focus indicators visible
- ✅ High contrast in both modes
- ✅ Icons + text (not color alone)

## 🐞 Common Issues

### Issue: Theme doesn't persist
**Solution:** Check if localStorage is enabled

### Issue: Flicker on page load
**Solution:** Theme is applied in ThemeContext before render - should not flicker

### Issue: Some elements don't change
**Solution:** Check if they use CSS variables or hardcoded colors

### Issue: Wrong icons showing
**Solution:** Clear browser cache and localStorage

## 📱 Mobile Testing
- ✅ Toggle in hamburger menu
- ✅ Tap toggles theme
- ✅ Theme persists on app close

## 🔐 Security Note
Theme preference is stored in localStorage (client-side only). It's not sent to the server unless you explicitly implement teacher preference saving.

---

**Last Updated:** 2026-01-21  
**Status:** ✅ Production Ready
