import { useTheme } from '../../contexts/ThemeContext';
import { Flashlight, FlashlightOff } from 'lucide-react';
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
                // Flashlight icon for light mode (shown when in dark mode)
                <Flashlight
                    size={22}
                    strokeWidth={2}
                    className="text-yellow-500 hover:scale-110 transition-transform duration-300"
                />
            ) : (
                // FlashlightOff icon for dark mode (shown when in light mode)
                <FlashlightOff
                    size={22}
                    strokeWidth={2}
                    className="text-indigo-600 hover:scale-110 transition-transform duration-300"
                />
            )}
        </button>
    );
};

export default ThemeToggle;
