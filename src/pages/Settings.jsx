import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
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
    MapPin,
    Search,
    Download,
    DownloadCloud,
    ShieldCheck,
    Smartphone,
    Monitor,
    Apple,
    Shield,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import { backfillMissingTimestamps } from '../utils/backfillTimestamps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CURRENCIES } from '@/lib/constants';
import { getCurrencyDef, getCurrencySymbol, getLocaleCurrency } from '@/lib/currency';

export default function Settings() {
    const { user, currency, updateCurrency, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [savingCurrency, setSavingCurrency] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const [currencySearch, setCurrencySearch] = useState('');
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [openSettingsSection, setOpenSettingsSection] = useState('web');
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
    const selectedCurrency = getCurrencyDef(currency);
    const filteredCurrencies = useMemo(() => {
        const query = currencySearch.trim().toLowerCase();
        if (!query) return CURRENCIES;

        return CURRENCIES.filter((item) => {
            return item.code.toLowerCase().includes(query) || item.label.toLowerCase().includes(query);
        });
    }, [currencySearch]);

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

    useEffect(() => {
        const isStandalone =
            window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
        setIsAppInstalled(isStandalone);

        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };
        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsAppInstalled(true);
            toast.success('Excalper installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

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

    const handleCurrencyChange = async (currencyCode) => {
        setSavingCurrency(true);
        try {
            await updateCurrency(currencyCode);
            setCurrencyOpen(false);
            setCurrencySearch('');
            toast.success('Currency preference updated');
        } catch (error) {
            console.error('Currency update error:', error);
            toast.error('Failed to update currency preference');
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleDetectCurrency = async () => {
        const detectedCurrency = getLocaleCurrency();
        setSavingCurrency(true);
        try {
            await updateCurrency(detectedCurrency);
            setCurrencyOpen(false);
            setCurrencySearch('');
            toast.success(`Detected ${getCurrencyDef(detectedCurrency).label} from your browser locale`);
        } catch (error) {
            console.error('Currency detection error:', error);
            toast.error('Failed to detect currency preference');
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleInstallApp = async () => {
        if (!installPrompt) {
            toast.info('Install is available from your browser menu if this device supports it.');
            return;
        }

        installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        setInstallPrompt(null);

        if (choiceResult.outcome === 'accepted') {
            toast.success('Installing Excalper...');
        } else {
            toast.info('Install cancelled');
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

    const renderSettingsAccordionSection = ({ id, title, description, Icon, badge, disabled = false, children }) => {
        const isOpen = openSettingsSection === id;

        return (
            <Card
                key={id}
                className={`overflow-hidden transition-colors duration-300 ${isOpen ? 'border-primary/40 bg-primary/5' : ''
                    } ${disabled ? 'opacity-55' : ''}`}
            >
                <button
                    type="button"
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-settings-panel`}
                    onClick={() => setOpenSettingsSection(isOpen ? '' : id)}
                    className={`flex w-full items-start justify-between gap-4 p-5 text-left transition-colors duration-200 sm:p-6 ${disabled
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        }`}
                >
                    <div className="flex min-w-0 gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
                                {badge}
                            </div>
                            <CardDescription className="text-sm">{description}</CardDescription>
                        </div>
                    </div>
                    <span className="mt-1 shrink-0 text-muted-foreground">
                        {isOpen ? (
                            <ChevronUp className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <ChevronDown className="h-5 w-5" aria-hidden="true" />
                        )}
                    </span>
                </button>
                <div
                    id={`${id}-settings-panel`}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                    className="grid transition-all duration-300 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                >
                    <div className="overflow-hidden">
                        <CardContent className="border-t px-5 py-5 sm:px-6">{children}</CardContent>
                    </div>
                </div>
            </Card>
        );
    };

    const settingsAccordionSections = [
        {
            id: 'web',
            title: 'Install Excalper (PWA)',
            description: 'Add Excalper to your home screen for faster launches and offline access.',
            Icon: Monitor,
            children: (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-sm text-muted-foreground">
                        Offline mode keeps your app ready-to-use even without internet and syncs queued transactions to database when you reconnect.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleInstallApp}
                        disabled={isAppInstalled}
                        className="w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4" />
                        {isAppInstalled ? 'App Installed' : 'Install App'}
                    </Button>
                </div>
            ),
        },
        {
            id: 'android',
            title: 'Excalper for Android',
            description: 'Download the official APK for a native experience with enhanced performance.',
            Icon: Smartphone,
            badge: <Badge className="animate-pulse">New</Badge>,
            children: (
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button asChild className="w-full shadow-primary/20 sm:w-auto">
                                <a href="/excalper.apk" download>
                                    <DownloadCloud className="h-4 w-4" />
                                    Download APK
                                </a>
                            </Button>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span>excalper.apk</span>
                                <Badge variant="outline" className="gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                    Verified
                                </Badge>
                            </div>
                        </div>
                        <Badge variant="secondary" className="w-fit gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Verified
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Note: You may need to enable &apos;Install from Unknown Sources&apos; in your Android settings to
                        complete the installation.
                    </p>
                </div>
            ),
        },
        {
            id: 'ios',
            title: 'Excalper for iOS',
            description: 'iPhone and iPad support is planned for a future release.',
            Icon: Apple,
            badge: (
                <Badge variant="secondary" className="bg-gray-200 text-gray-600 hover:bg-gray-200">
                    Coming Soon
                </Badge>
            ),
            disabled: true,
            children: null,
        },
        {
            id: 'security',
            title: 'Security',
            description: 'Change the password for your account.',
            Icon: Shield,
            children: (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full sm:w-auto"
                >
                    <Lock className="h-4 w-4" />
                    Change password
                </Button>
            ),
        },
    ];

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
                    <CardTitle className="text-xl">Currency Preference</CardTitle>
                    <CardDescription>Choose the currency used across balances, forms, and transaction lists.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id="currency"
                                type="button"
                                variant="outline"
                                className="min-h-12 w-full justify-between touch-manipulation sm:min-h-10"
                                disabled={savingCurrency}
                            >
                                <span className="truncate">
                                    {getCurrencySymbol(currency)} {selectedCurrency.code} · {selectedCurrency.label}
                                </span>
                                <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
                            <div className="border-b p-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={currencySearch}
                                        onChange={(e) => setCurrencySearch(e.target.value)}
                                        placeholder="Search currency code or name"
                                        className="pl-9"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-y-auto p-1">
                                {filteredCurrencies.length === 0 ? (
                                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        No currencies found.
                                    </p>
                                ) : (
                                    filteredCurrencies.map((item) => (
                                        <button
                                            key={item.code}
                                            type="button"
                                            className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => handleCurrencyChange(item.code)}
                                        >
                                            <span className="min-w-0">
                                                <span className="font-medium">
                                                    {getCurrencySymbol(item.code)} {item.code}
                                                </span>
                                                <span className="ml-2 text-muted-foreground">{item.label}</span>
                                            </span>
                                            {item.code === currency && (
                                                <span className="text-xs font-medium text-primary">Selected</span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDetectCurrency}
                        disabled={savingCurrency}
                        className="w-full sm:w-auto"
                    >
                        <MapPin className="h-4 w-4" />
                        Detect My Location
                    </Button>
                    {savingCurrency && (
                        <p className="text-xs text-muted-foreground">Saving preference…</p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-3">
                {settingsAccordionSections.map((section) => renderSettingsAccordionSection(section))}
            </div>

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
