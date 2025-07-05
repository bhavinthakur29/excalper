import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateProfile, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FaUser, FaEnvelope, FaLock, FaPalette, FaTrash, FaSignOutAlt, FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import './Settings.css';

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Profile form state
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [photoBase64, setPhotoBase64] = useState('');

    const storage = getStorage();
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
            // Load base64 avatar from Firestore
            const fetchPhoto = async () => {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists() && userSnap.data().photoBase64) {
                        setPhotoBase64(userSnap.data().photoBase64);
                    }
                } catch (err) {
                    console.error('Failed to fetch avatar from Firestore:', err);
                }
            };
            fetchPhoto();
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {};

            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
                updates.displayName = displayName;
            }

            if (email !== user.email) {
                await updateEmail(user, email);
                updates.email = email;
            }

            if (Object.keys(updates).length > 0) {
                // Update Firestore user document if it exists
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, updates);
                } catch (error) {
                    console.log('Firestore update failed, but auth update succeeded');
                }

                toast.success('Profile updated successfully!');
            } else {
                toast.info('No changes to save');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await updatePassword(user, newPassword);
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordModal(false);
        } catch (error) {
            console.error('Password update error:', error);
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleAccountDeletion = async () => {
        setLoading(true);

        try {
            // Delete user data from Firestore
            try {
                const userRef = doc(db, 'users', user.uid);
                await deleteDoc(userRef);
            } catch (error) {
                console.log('Firestore deletion failed, but account deletion will proceed');
            }

            // Delete the user account
            await deleteUser(user);
            toast.success('Account deleted successfully');
            logout();
        } catch (error) {
            console.error('Account deletion error:', error);
            toast.error(error.message || 'Failed to delete account');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = (event) => {
                img.src = event.target.result;
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const maxDim = 256;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                    setPhotoBase64(base64);
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, { photoBase64: base64 });
                        toast.success('Profile photo updated!');
                    } catch (err) {
                        try {
                            const userRef = doc(db, 'users', user.uid);
                            await setDoc(userRef, { photoBase64: base64 }, { merge: true });
                            toast.success('Profile photo updated!');
                        } catch (err2) {
                            console.error('Failed to update profile photo:', err, err2);
                            toast.error('Failed to update profile photo');
                        }
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) {
        return (
            <div className="settings-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1><FaUser /> Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="settings-section">
                <h2><FaUser /> Profile Information</h2>
                <div className="profile-card">
                    <div className="profile-avatar-ring">
                        <img src={photoBase64 || user?.photoURL || 'https://avatar.iran.liara.run/public/boy'} alt="Profile Avatar" className="profile-avatar" />
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">{displayName || 'User'}</div>
                        <div className="profile-email">{email}</div>
                        <label className="add-photo-btn">
                            Change Photo
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                        </label>
                        {uploading && <div className="uploading-text">Uploading...</div>}
                    </div>
                </div>
                <form onSubmit={handleProfileUpdate} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Security Section */}
            <div className="settings-section">
                <h2><FaLock /> Security</h2>
                <div className="settings-actions">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="btn btn-secondary"
                    >
                        <FaLock /> Change Password
                    </button>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="settings-section">
                <h2><FaPalette /> Preferences</h2>
                <div className="preference-item">
                    <div className="preference-info">
                        <h3>Dark Mode</h3>
                        <p>Toggle between light and dark themes</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}
                    >
                        <span className="toggle-slider"></span>
                    </button>
                </div>
            </div>

            {/* Account Actions */}
            <div className="settings-section">
                <h2>Account Actions</h2>
                <div className="settings-actions">
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <FaSignOutAlt /> Logout
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="btn btn-danger"
                    >
                        <FaTrash /> Delete Account
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            <Modal
                isOpen={showPasswordModal}
                title="Change Password"
                message=""
                onConfirm={handlePasswordUpdate}
                onCancel={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                }}
                confirmText="Update Password"
                cancelText="Cancel"
                customContent={
                    <div className="password-form">
                        <div className="form-group">
                            <label>New Password</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="password-input">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="password-toggle"
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Delete Account Modal */}
            <Modal
                isOpen={showDeleteModal}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
                onConfirm={handleAccountDeletion}
                onCancel={() => setShowDeleteModal(false)}
                confirmText="Delete Account"
                cancelText="Cancel"
            />
        </div>
    );
} 