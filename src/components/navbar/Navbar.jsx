import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaHome, FaMoneyBillWave, FaUsers, FaChartPie, FaCog, FaBars, FaTimes, FaSun, FaMoon } from 'react-icons/fa';
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
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists() && userSnap.data().photoBase64) {
                        setPhotoBase64(userSnap.data().photoBase64);
                    }
                } catch { }
            }
        };
        fetchPhoto();
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navItems = [
        { path: '/', icon: FaHome, label: 'Home' },
        { path: '/expenses', icon: FaMoneyBillWave, label: 'Expenses' },
        { path: '/users', icon: FaUsers, label: 'Users' },
        { path: '/contributions', icon: FaChartPie, label: 'Contributions' },
        { path: '/settings', icon: FaCog, label: 'Settings' }
    ];

    if (!user) return null;

    // Helper for avatar
    const getAvatar = () => {
        if (photoBase64) {
            return <img src={photoBase64} alt="avatar" className="navbar-avatar" />;
        }
        if (user.photoURL) {
            return <img src={user.photoURL} alt="avatar" className="navbar-avatar" />;
        }
        return <div className="user-avatar-fallback">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</div>;
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav className={`navbar navbar-desktop ${isScrolled ? 'navbar-scrolled' : ''}`}>
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="navbar-logo">
                            <FaMoneyBillWave className="brand-icon" />
                            <span className="brand-text">Excalper</span>
                        </Link>
                    </div>

                    <div className="navbar-menu">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="navbar-actions">
                        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                            {theme === 'dark' ? <FaSun /> : <FaMoon />}
                        </button>
                        <div className="user-menu">
                            {getAvatar()}
                            <span className="user-name">{user.displayName || user.email}</span>
                            <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className={`navbar navbar-mobile ${isScrolled ? 'navbar-scrolled' : ''}`}>
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="navbar-logo">
                            <span className="brand-text">Excalper</span>
                        </Link>
                    </div>

                    <div className="navbar-actions">
                        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                            {theme === 'dark' ? <FaSun /> : <FaMoon />}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="mobile-menu-toggle"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
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

                            <div className="mobile-menu-items">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`mobile-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            <div className="mobile-menu-footer">
                                <button onClick={handleLogout} className="btn btn-danger logout-btn">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom Navigation for Mobile */}
            <nav className="nav-mobile">
                <ul className="nav-mobile-list">
                    {navItems.map((item) => (
                        <li key={item.path} className="nav-mobile-item">
                            <Link
                                to={item.path}
                                className={`nav-mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <item.icon className="nav-mobile-icon" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
} 