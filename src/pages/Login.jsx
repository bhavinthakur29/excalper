import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { FaGoogle, FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Login.css';

export default function Login() {
    const { loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            toast.success('Logged in with Google!');
            navigate('/');
        } catch (error) {
            toast.error('Google login failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-card" role="main" aria-label="Sign in form">
                <h1 tabIndex={0}>Sign In</h1>
                <form onSubmit={handleEmailLogin} className="login-form" autoComplete="on" aria-label="Sign in with email and password">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <FaEnvelope className="input-icon" aria-hidden="true" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                                aria-label="Email address"
                                disabled={loading || googleLoading}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <FaLock className="input-icon" aria-hidden="true" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                aria-label="Password"
                                disabled={loading || googleLoading}
                            />
                            <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} tabIndex={0} disabled={loading || googleLoading}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary login-btn" disabled={loading || googleLoading} aria-busy={loading} aria-label="Sign in">
                        {loading ? <span className="login-spinner"></span> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="divider" aria-hidden="true"></div>
                <button onClick={handleGoogleLogin} className="btn btn-google" disabled={loading || googleLoading} aria-busy={googleLoading} aria-label="Continue with Google">
                    {googleLoading ? <span className="login-spinner"></span> : <FaGoogle />}
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </button>
            </div>
        </div>
    );
} 