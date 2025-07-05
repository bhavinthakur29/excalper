import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'var(--color-text)',
                marginLeft: '1rem',
            }}
        >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
    );
} 