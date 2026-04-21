import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, Plus, User, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { toJsDate } from '../utils/timestamps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/lib/categoryIcon';
import { getCategoryDef } from '@/lib/constants';
import { cn } from '@/lib/utils';

const sectionMotion = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
};

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [photoBase64, setPhotoBase64] = useState('');
    const [monthlyTotal, setMonthlyTotal] = useState(0);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            fetchPhoto();
        }
    }, [user]);

    const fetchPhoto = async () => {
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().photoBase64) {
                    setPhotoBase64(userSnap.data().photoBase64);
                }
            } catch (error) {
                console.error('Error fetching user photo:', error);
            }
        }
    };

    const fetchDashboardData = async () => {
        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const expensesQuery = query(expensesRef, orderBy('timestamp', 'desc'), limit(5));
            const expensesSnapshot = await getDocs(expensesQuery);
            const expensesList = expensesSnapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                date: toJsDate(d.data().timestamp),
            }));
            setRecentExpenses(expensesList);

            const allExpensesSnapshot = await getDocs(expensesRef);
            const allExpenses = allExpensesSnapshot.docs.map((d) => ({
                ...d.data(),
                date: toJsDate(d.data().timestamp),
            }));

            const now = new Date();
            const thisMonth = allExpenses
                .filter((exp) => {
                    const expDate = exp.date;
                    if (!expDate) return false;
                    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            setMonthlyTotal(thisMonth);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Card className="animate-pulse">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted sm:h-20 sm:w-20" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-40 rounded bg-muted" />
                                <div className="h-3 w-56 rounded bg-muted/70" />
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            <div className="h-3 w-32 rounded bg-muted/70" />
                            <div className="h-10 w-48 rounded bg-muted" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <motion.div {...sectionMotion}>
                <Card>
                    <CardContent>
                        <div className="flex items-center gap-4 pt-6">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/10 sm:h-20 sm:w-20">
                                {photoBase64 ? (
                                    <img
                                        src={photoBase64}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                        <User className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <CardTitle className="text-xl sm:text-2xl">
                                    Welcome back, {user?.displayName || 'User'}
                                </CardTitle>
                                <CardDescription>Track your spending with clarity and confidence.</CardDescription>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" aria-hidden="true" />
                                <span>This Month&apos;s Personal Expenses</span>
                            </div>
                            <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                                £{monthlyTotal.toFixed(2)}
                            </p>
                        </div>

                        <div className="mt-6">
                            <Button
                                type="button"
                                onClick={() => navigate('/expense-form')}
                                className="w-full justify-between sm:w-auto sm:justify-center"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Transaction
                                </span>
                                <ArrowUpRight className="h-4 w-4 opacity-80 sm:ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div {...sectionMotion} transition={{ duration: 0.4, delay: 0.05 }}>
                <Card>
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle>Recent Expenses</CardTitle>
                            <Button type="button" variant="secondary" className="w-auto shrink-0" onClick={() => navigate('/expenses')}>
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        {recentExpenses.length === 0 ? (
                            <div className="p-4">
                                <div className="rounded-lg border border-dashed p-5 text-center">
                                    <p className="mb-2 font-semibold">Your timeline is ready</p>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        Add your first transaction to start building a clean spending history.
                                    </p>
                                    <Button type="button" onClick={() => navigate('/expense-form')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add your first expense
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <ul role="list">
                                {recentExpenses.map((expense) => (
                                    <li key={expense.id}>
                                        <div className="flex items-center justify-between gap-3 border-b p-4 last:border-0">
                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                <div
                                                    className={cn(
                                                        'flex shrink-0 rounded-full p-2',
                                                        getCategoryDef(expense.category ?? expense.paymentMode).color
                                                    )}
                                                >
                                                    <CategoryIcon
                                                        categoryRef={expense.category ?? expense.paymentMode}
                                                        size={18}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="font-semibold text-foreground">{expense.description}</p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {formatDate(expense.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="shrink-0 text-base font-bold tabular-nums">
                                                £{expense.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
