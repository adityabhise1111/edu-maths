import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

/**
 * Get initial theme based on priority:
 * 1. localStorage (if exists)
 * 2. System preference (prefers-color-scheme)
 * 3. Default to 'light'
 */
const getInitialTheme = () => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    // Default to light
    return 'light';
};

/**
 * Apply theme to DOM immediately (before React mounts)
 * This prevents flicker on initial load
 */
const applyThemeToDOM = (theme) => {
    const root = document.documentElement;

    // Add/remove 'dark' class for CSS-based dark mode
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // Also set data-bs-theme for Bootstrap compatibility
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-theme', theme);
};

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or system preference
    const [theme, setThemeState] = useState(() => {
        const initialTheme = getInitialTheme();
        // Apply theme immediately to prevent flicker
        applyThemeToDOM(initialTheme);
        return initialTheme;
    });

    // Apply theme to DOM whenever it changes
    useEffect(() => {
        applyThemeToDOM(theme);

        // Persist to localStorage (using 'theme' as the key)
        localStorage.setItem('theme', theme);

        // Also keep Bootstrap theme in sync
        localStorage.setItem('bs-theme', theme);
    }, [theme]);

    // Listen for system theme changes (optional enhancement)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    const toggleTheme = () => {
        setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            setThemeState(newTheme);
        }
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
