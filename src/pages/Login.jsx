import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/useAuth';
import { auth } from '../config/firebase';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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
        } catch {
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
        } catch {
            toast.error('Google login failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md" role="main" aria-label="Sign in form">
                <CardHeader>
                    <CardTitle className="text-2xl" tabIndex={0}>
                        Sign in
                    </CardTitle>
                    <CardDescription>Use your email or continue with Google.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form onSubmit={handleEmailLogin} className="space-y-4" autoComplete="on" aria-label="Sign in with email and password">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-9"
                                    required
                                    autoComplete="email"
                                    aria-label="Email address"
                                    disabled={loading || googleLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9 pr-10"
                                    required
                                    autoComplete="current-password"
                                    aria-label="Password"
                                    disabled={loading || googleLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={0}
                                    disabled={loading || googleLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || googleLoading}
                            aria-busy={loading}
                            aria-label="Sign in"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                    <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
                        <Separator className="flex-1" />
                        <span>or</span>
                        <Separator className="flex-1" />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={loading || googleLoading}
                        aria-busy={googleLoading}
                        aria-label="Continue with Google"
                    >
                        {googleLoading ? (
                            'Signing in…'
                        ) : (
                            <>
                                <FaGoogle className="h-4 w-4" />
                                Continue with Google
                            </>
                        )}
                    </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
