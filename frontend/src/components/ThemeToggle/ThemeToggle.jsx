import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle ${className}`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? (
                // Sun icon — click to switch to light mode
                <Sun
                    size={22}
                    strokeWidth={2}
                    style={{ color: '#f59e0b' }}
                />
            ) : (
                // Moon icon — click to switch to dark mode
                <Moon
                    size={22}
                    strokeWidth={1.5}
                    style={{ color: '#6366f1' }}
                />
            )}
        </button>
    );
};

export default ThemeToggle;
