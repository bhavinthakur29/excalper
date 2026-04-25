import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    User,
    Mail,
    Lock,
    Trash2,
    LogOut,
    Save,
    Eye,
    EyeOff,
    Database,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import { backfillMissingTimestamps } from '../utils/backfillTimestamps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [photoBase64, setPhotoBase64] = useState('');
    const [backfillingTimestamps, setBackfillingTimestamps] = useState(false);
    const [uploading, setUploading] = useState(false);
    const photoInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            const fetchPhoto = async () => {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        if (userData.photoBase64) {
                            setPhotoBase64(userData.photoBase64);
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch settings from Firestore:', err);
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

            if (Object.keys(updates).length > 0) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, updates);
                } catch {
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
            try {
                const userRef = doc(db, 'users', user.uid);
                await deleteDoc(userRef);
            } catch {
                console.log('Firestore deletion failed, but account deletion will proceed');
            }

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
        } catch {
            toast.error('Failed to logout');
        }
    };

    const handleTimestampBackfill = async () => {
        if (!user?.uid) return;
        setBackfillingTimestamps(true);
        try {
            const updatedCount = await backfillMissingTimestamps(user.uid);
            if (updatedCount === 0) {
                toast.info('No legacy documents needed timestamp backfill.');
            } else {
                toast.success(`Backfilled timestamps in ${updatedCount} document(s).`);
            }
        } catch {
            toast.error('Timestamp backfill failed. Please try again.');
        } finally {
            setBackfillingTimestamps(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const maxDim = 256;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        }
                    } else if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
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
                } finally {
                    setUploading(false);
                }
            };
            img.onerror = () => setUploading(false);
        };
        reader.onerror = () => setUploading(false);
        reader.readAsDataURL(file);
    };

    if (!user) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex min-h-[40vh] items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading settings…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
            </div>
            <Separator className="my-6" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <User className="h-5 w-5" aria-hidden="true" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Update how you appear in the app and your sign-in email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/10">
                            <img
                                src={photoBase64 || user?.photoURL || 'https://avatar.iran.liara.run/public/boy'}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <p className="font-medium text-foreground">{displayName || 'User'}</p>
                            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                            <div className="pt-1">
                                <input
                                    ref={photoInputRef}
                                    id="settings-photo"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handlePhotoChange}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => photoInputRef.current?.click()}
                                >
                                    Change photo
                                </Button>
                                {uploading && (
                                    <span className="ml-2 text-xs text-muted-foreground">Uploading…</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display name</Label>
                            <Input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <p className="text-xs text-muted-foreground">Sign-in email can&apos;t be changed here.</p>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email ?? ''}
                                    readOnly
                                    tabIndex={-1}
                                    className="cursor-not-allowed bg-muted/50 pl-9 opacity-70"
                                    autoComplete="email"
                                    aria-readonly="true"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            <Save className="h-4 w-4" />
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Lock className="h-5 w-5" aria-hidden="true" />
                        Security
                    </CardTitle>
                    <CardDescription>Change the password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button type="button" variant="outline" onClick={() => setShowPasswordModal(true)}>
                        <Lock className="h-4 w-4" />
                        Change password
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Account</CardTitle>
                    <CardDescription>Session, data tools, and permanent account removal.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button type="button" variant="secondary" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTimestampBackfill}
                        disabled={backfillingTimestamps}
                    >
                        <Database className="h-4 w-4" />
                        {backfillingTimestamps ? 'Backfilling…' : 'Backfill legacy timestamps'}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => setShowDeleteModal(true)}>
                        <Trash2 className="h-4 w-4" />
                        Delete account
                    </Button>
                </CardContent>
            </Card>

            <Modal
                isOpen={showPasswordModal}
                title="Change password"
                message=""
                onConfirm={handlePasswordUpdate}
                onCancel={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                }}
                confirmText="Update password"
                cancelText="Cancel"
                customContent={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            />

            <Modal
                isOpen={showDeleteModal}
                title="Delete account"
                message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
                onConfirm={handleAccountDeletion}
                onCancel={() => setShowDeleteModal(false)}
                confirmText="Delete account"
                cancelText="Cancel"
                destructive
            />
        </div>
    );
}
