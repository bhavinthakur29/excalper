import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaHome, FaMoneyBillWave, FaUsers, FaChartPie, FaCog, FaBars, FaTimes, FaSun, FaMoon, FaSignOutAlt, FaUser } from 'react-icons/fa';
import './Navbar.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [photoBase64, setPhotoBase64] = useState('');
    const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isThemeToggling, setIsThemeToggling] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Close mobile menu when route changes
        setIsMobileMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const fetchPhoto = async () => {
            if (user) {
                setIsLoadingPhoto(true);
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists() && userSnap.data().photoBase64) {
                        setPhotoBase64(userSnap.data().photoBase64);
                    }
                } catch (error) {
                    console.error('Error fetching user photo:', error);
                } finally {
                    setIsLoadingPhoto(false);
                }
            }
        };
        fetchPhoto();
    }, [user]);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleThemeToggle = async () => {
        if (isThemeToggling) return;

        setIsThemeToggling(true);
        try {
            await toggleTheme();
        } catch (error) {
            console.error('Theme toggle failed:', error);
        } finally {
            // Add a small delay to show the animation
            setTimeout(() => setIsThemeToggling(false), 400);
        }
    };

    const navItems = [
        { path: '/', icon: FaHome, label: 'Home', description: 'Dashboard overview' },
        { path: '/expenses', icon: FaMoneyBillWave, label: 'Expenses', description: 'Manage expenses' },
        { path: '/users', icon: FaUsers, label: 'Users', description: 'User management' },
        { path: '/contributions', icon: FaChartPie, label: 'Contributions', description: 'View contributions' },
        { path: '/settings', icon: FaCog, label: 'Settings', description: 'App settings' }
    ];

    if (!user) return null;

    // Helper for avatar with loading state
    const getAvatar = () => {
        if (isLoadingPhoto) {
            return (
                <div className="navbar-avatar navbar-avatar-loading">
                    <div className="avatar-skeleton"></div>
                </div>
            );
        }

        if (photoBase64) {
            return <img src={photoBase64} alt="avatar" className="navbar-avatar" loading="lazy" />;
        }
        if (user.photoURL) {
            return <img src={user.photoURL} alt="avatar" className="navbar-avatar" loading="lazy" />;
        }
        return (
            <div className="user-avatar-fallback" title={user.displayName || user.email}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
        );
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav className={`navbar navbar-desktop ${isScrolled ? 'navbar-scrolled' : ''}`} role="navigation" aria-label="Main navigation">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="navbar-logo" aria-label="Go to home page">
                            <FaMoneyBillWave className="brand-icon" aria-hidden="true" />
                            <span className="brand-text">Excalper</span>
                        </Link>
                    </div>

                    <div className="navbar-menu" role="menubar">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                                role="menuitem"
                                aria-current={location.pathname === item.path ? 'page' : undefined}
                                title={item.description}
                            >
                                <item.icon aria-hidden="true" />
                                <span>{item.label}</span>
                                {location.pathname === item.path && (
                                    <div className="active-indicator" aria-hidden="true"></div>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="navbar-actions">
                        <button
                            onClick={handleThemeToggle}
                            disabled={isThemeToggling}
                            className={`theme-toggle ${theme === 'dark' ? 'theme-toggle-dark' : 'theme-toggle-light'} ${isThemeToggling ? 'theme-toggle-loading' : ''}`}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="theme-toggle-inner">
                                <FaSun className="theme-icon theme-icon-sun" aria-hidden="true" />
                                <FaMoon className="theme-icon theme-icon-moon" aria-hidden="true" />
                            </div>
                            {isThemeToggling && <div className="theme-toggle-spinner"></div>}
                        </button>

                        <div className="user-menu" role="button" tabIndex={0} aria-label="User menu">
                            {getAvatar()}
                            <span className="user-name" title={user.displayName || user.email}>
                                {user.displayName || user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={`btn btn-secondary logout-btn ${isLoggingOut ? 'logout-btn-loading' : ''}`}
                                aria-label="Logout"
                                title="Logout"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="logout-spinner"></div>
                                        <span>Logging out...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSignOutAlt aria-hidden="true" />
                                        <span>Logout</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className={`navbar navbar-mobile ${isScrolled ? 'navbar-scrolled' : ''}`} role="navigation" aria-label="Mobile navigation">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="navbar-logo" aria-label="Go to home page">
                            <span className="brand-text">Excalper</span>
                        </Link>
                    </div>

                    <div className="navbar-actions">
                        <button
                            onClick={handleThemeToggle}
                            disabled={isThemeToggling}
                            className={`theme-toggle ${theme === 'dark' ? 'theme-toggle-dark' : 'theme-toggle-light'} ${isThemeToggling ? 'theme-toggle-loading' : ''}`}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="theme-toggle-inner">
                                <FaSun className="theme-icon theme-icon-sun" aria-hidden="true" />
                                <FaMoon className="theme-icon theme-icon-moon" aria-hidden="true" />
                            </div>
                            {isThemeToggling && <div className="theme-toggle-spinner"></div>}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'mobile-menu-toggle-open' : ''}`}
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                        >
                            {isMobileMenuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="mobile-menu-overlay"
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile menu"
                    >
                        <div className="mobile-menu" onClick={(e) => e.stopPropagation()} id="mobile-menu">
                            <div className="mobile-menu-header">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {getAvatar()}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user.displayName || 'User'}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mobile-menu-items" role="menu">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`mobile-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        role="menuitem"
                                        aria-current={location.pathname === item.path ? 'page' : undefined}
                                        title={item.description}
                                    >
                                        <item.icon aria-hidden="true" />
                                        <span>{item.label}</span>
                                        {location.pathname === item.path && (
                                            <div className="mobile-active-indicator" aria-hidden="true"></div>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            <div className="mobile-menu-footer">
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className={`btn btn-danger logout-btn ${isLoggingOut ? 'logout-btn-loading' : ''}`}
                                    aria-label="Logout"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <div className="logout-spinner"></div>
                                            <span>Logging out...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaSignOutAlt aria-hidden="true" />
                                            <span>Logout</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom Navigation for Mobile */}
            <nav className="nav-mobile" role="navigation" aria-label="Bottom navigation">
                <ul className="nav-mobile-list" role="menubar">
                    {navItems.map((item) => (
                        <li key={item.path} className="nav-mobile-item" role="none">
                            <Link
                                to={item.path}
                                className={`nav-mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                                role="menuitem"
                                aria-current={location.pathname === item.path ? 'page' : undefined}
                                title={item.description}
                            >
                                <item.icon className="nav-mobile-icon" aria-hidden="true" />
                                <span>{item.label}</span>
                                {location.pathname === item.path && (
                                    <div className="nav-mobile-active-indicator" aria-hidden="true"></div>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
} 