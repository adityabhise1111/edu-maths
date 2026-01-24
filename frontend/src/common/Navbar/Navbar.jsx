import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import './Navbar.css';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Helper to check if link is active
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    📚 EduMaths
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`navbar-link ${isActive('/') ? 'navbar-link--active' : ''}`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/login"
                        className={`navbar-link ${isActive('/login') ? 'navbar-link--active' : ''}`}
                    >
                        Teacher Login
                    </Link>
                    <ThemeToggle />
                    <Link
                        to="/signup"
                        className="btn btn-primary btn-sm"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="navbar-mobile-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="navbar-mobile-menu">
                    <Link
                        to="/"
                        className={`navbar-mobile-link ${isActive('/') ? 'navbar-mobile-link--active' : ''}`}
                        onClick={toggleMobileMenu}
                    >
                        Home
                    </Link>
                    <Link
                        to="/login"
                        className={`navbar-mobile-link ${isActive('/login') ? 'navbar-mobile-link--active' : ''}`}
                        onClick={toggleMobileMenu}
                    >
                        Teacher Login
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-md) 0' }}>
                        <ThemeToggle />
                    </div>
                    <Link
                        to="/signup"
                        className="btn btn-primary btn-full"
                        onClick={toggleMobileMenu}
                    >
                        Get Started
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
