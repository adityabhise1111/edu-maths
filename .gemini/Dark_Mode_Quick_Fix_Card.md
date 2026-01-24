# 🎯 Quick Fix Reference Card - Dark Mode

## 🚨 RULE: Think in ROLES, Not COLORS

### **Semantic Color Roles**

| Role | When to Use |
|------|-------------|
| `var(--bg-primary)` | Page background |
| `var(--bg-secondary)` | Elevated surface |
| `var(--bg-card)` | Cards, tables, modals |
| `var(--text-primary)` | Main headings, body text |
| `var(--text-secondary)` | Captions, secondary info |
| `var(--text-muted)` | Timestamps, subtle hints |
| `var(--border-color)` | All borders |

---

## ✅ QUICK FIXES

### **1. Card/Table Backgrounds**

❌ **Wrong:**
```jsx
<div style={{ backgroundColor: 'white' }}>
```

✅ **Correct:**
```jsx
<div style={{ backgroundColor: 'var(--bg-card)' }}>
```

---

### **2. Page Backgrounds**

❌ **Wrong:**
```jsx
<div style={{ backgroundColor: '#fafafa' }}>
```

✅ **Correct:**
```jsx
<div style={{ backgroundColor: 'var(--bg-secondary)' }}>
```

---

### **3. Text Colors**

❌ **Wrong:**
```jsx
<h1 style={{ color: '#000' }}>Title</h1>
<p style={{ color: '#666' }}>Description</p>
```

✅ **Correct:**
```jsx
<h1 style={{ color: 'var(--text-primary)' }}>Title</h1>
<p style={{ color: 'var(--text-secondary)' }}>Description</p>
```

---

### **4. Table Headers**

❌ **Wrong (Unreadable):**
```jsx
<th style={{ 
    color: 'var(--text-secondary)',  // Too light!
    fontWeight: '400'
}}>
```

✅ **Correct (Readable):**
```jsx
<th style={{ 
    color: 'var(--text-primary)',    // Strong contrast
    fontWeight: '600'
}}>
```

---

### **5. Buttons (Context-Dependent)**

#### **Primary Button (Colored Background)**
✅ **Correct (Keep White):**
```jsx
<button style={{
    background: 'var(--primary-purple)',
    color: 'white'  // ✅ OK - white on dark brand color
}}>
```

#### **Secondary Button (Outline)**
❌ **Wrong:**
```jsx
<button style={{
    background: 'white',
    color: 'var(--primary-purple)',
    border: '1px solid var(--primary-purple)'
}}>
```

✅ **Correct:**
```jsx
<button style={{
    background: 'var(--bg-card)',  // Adapts to theme
    color: 'var(--primary-purple)',
    border: '1px solid var(--primary-purple)'
}}>
```

---

### **6. Borders**

❌ **Wrong:**
```jsx
border: '1px solid #e5e5e5'
borderColor: 'rgba(255, 255, 255, 0.1)'
```

✅ **Correct:**
```jsx
border: '1px solid var(--border-color)'
borderColor: 'var(--border-color)'
```

---

### **7. Modal/Dialog**

❌ **Wrong:**
```jsx
<div style={{
    backgroundColor: '#fff',
    border: '1px solid #ddd'
}}>
```

✅ **Correct:**
```jsx
<div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)'
}}>
```

---

## 🎨 WHEN TO KEEP HARD-CODED COLORS

### **Exceptions (These are OK):**

#### **1. Brand Gradients**
```jsx
// ✅ OK - Brand identity stays consistent
<div style={{
    background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
    color: 'white'  // White text on colored gradient
}}>
```

#### **2. Status Badges**
```jsx
// ✅ OK - Semantic colors (success/error) stay consistent
<span style={{
    backgroundColor: 'var(--success)',
    color: 'white'
}}>
    Active
</span>
```

#### **3. Fixed Brand Colors**
```jsx
// ✅ OK - Logo/branding doesn't change with theme
<Logo color="#6366f1" />
```

---

## 🧪 TESTING CHECKLIST

After fixing a component:

1. **Toggle to Dark Mode**
2. **Ask These Questions:**
   - ✔ Can I read all text clearly?
   - ✔ Are backgrounds distinguishable?
   - ✔ Are borders visible?
   - ✔ Do buttons stand out?
   - ✔ Is contrast at least 4.5:1?

3. **If ANY answer is NO:**
   - Check if using semantic variables
   - Verify text uses `--text-primary` not `--text-secondary`
   - Ensure background hierarchy (primary → secondary → card)

---

## 🚀 PRIORITY FIX ORDER

### **High Priority (Do First)**
1. **Dashboard Tables** - Headers and rows
2. **Student List** - Names and data columns
3. **Results Page** - Stats cards and tables

### **Medium Priority**
4. **Exam Pages** - Question display
5. **Modal Dialogs** - Backgrounds and borders

### **Low Priority (Test These)**
6. **Footer** - Usually has fixed colors (check anyway)
7. **Landing Page** - Often custom styled

---

## 📝 EXAMPLE: Fixing StudentsList.jsx

### **Before (Hard-Coded):**
```jsx
<div style={{
    backgroundColor: 'white',
    border: '1px solid #e5e5e5'
}}>
    <h1 style={{ color: '#171717' }}>Students</h1>
    <table>
        <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ color: '#6b7280' }}>Name</th>
            </tr>
        </thead>
    </table>
</div>
```

### **After (Semantic):**
```jsx
<div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)'
}}>
    <h1 style={{ color: 'var(--text-primary)' }}>Students</h1>
    <table>
        <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ 
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                }}>Name</th>
            </tr>
        </thead>
    </table>
</div>
```

---

## ⚡ VS Code Shortcuts

### **Find All Hard-Coded Whites:**
```
Ctrl+Shift+F
Search: backgroundColor.*['"]white['"]
```

### **Find All Hard-Coded Colors:**
```
Ctrl+Shift+F  
Search: #[0-9a-fA-F]{6}
```

### **Replace in File:**
```
Ctrl+H
Match case
Whole word
```

---

## 🎯 FINAL VALIDATION

After all fixes, test this flow:

1. Light mode → Navigate all pages → Everything readable?
2. Toggle to dark → Navigate all pages → Everything readable?
3. Compare side-by-side → Consistent look?

If yes to all → **Dark Mode Complete!** ✅

---

**Keep this card handy while fixing components!**
