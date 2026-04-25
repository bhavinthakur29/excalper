import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { animate, motion as Motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Calendar, Plus, User, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { toJsDate } from '../utils/timestamps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CategoryFilterMenu from '@/components/CategoryFilterMenu';
import { CategoryIcon } from '@/lib/categoryIcon';
import { getCategoryDef, getTransactionType, resolveCategoryId } from '@/lib/constants';
import { cn } from '@/lib/utils';

const sectionMotion = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
};

const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
});

function AnimatedCurrency({ value, className }) {
    const motionValue = useMotionValue(0);
    const formatted = useTransform(motionValue, (latest) => currencyFormatter.format(latest));

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 0.9,
            ease: 'easeOut',
        });

        return () => controls.stop();
    }, [motionValue, value]);

    return <Motion.span className={className}>{formatted}</Motion.span>;
}

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [photoBase64, setPhotoBase64] = useState('');
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setPhotoBase64(userData.photoBase64 || '');
            }

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
            const monthlyTransactions = allExpenses.filter((exp) => {
                const expDate = exp.date;
                if (!expDate) return false;
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            });
            const thisMonthIncome = monthlyTransactions
                .filter((exp) => getTransactionType(exp) === 'income')
                .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
            const thisMonthSpent = monthlyTransactions
                .filter((exp) => getTransactionType(exp) === 'expense')
                .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

            setTotalIncome(thisMonthIncome);
            setTotalSpent(thisMonthSpent);
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [fetchDashboardData, user]);

    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const filteredRecentExpenses = useMemo(() => {
        return recentExpenses.filter((t) => {
            const cat = resolveCategoryId(t.category ?? t.paymentMode);
            return selectedCategories.length === 0 || selectedCategories.includes(cat);
        });
    }, [recentExpenses, selectedCategories]);

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

    const remainingBalance = totalIncome - totalSpent;
    const balanceIsLow = totalIncome > 0 && remainingBalance < totalIncome * 0.1;
    const spendingPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
    const savingsPercentage = totalIncome > 0 ? (remainingBalance / totalIncome) * 100 : 0;
    const spendingProgressColor =
        spendingPercentage < 50
            ? 'bg-emerald-500'
            : spendingPercentage <= 80
              ? 'bg-amber-500'
              : 'bg-destructive';
    const formatPercentage = (value) => `${Math.round(value)}%`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Motion.div {...sectionMotion}>
                <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-xl shadow-slate-950/20">
                    <CardContent className="relative p-6 sm:p-7">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.28),transparent_32%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,1))]" />
                        <div className="relative space-y-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/20 sm:h-16 sm:w-16">
                                        {photoBase64 ? (
                                            <img
                                                src={photoBase64}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-white/10 text-white/80">
                                                <User className="h-7 w-7" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-200/80">
                                            Account Overview
                                        </p>
                                        <CardTitle className="mt-2 text-2xl text-white sm:text-3xl">
                                            Welcome back, {user?.displayName || 'User'}
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-slate-300">
                                            Your live monthly balance after this month&apos;s transactions.
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => navigate('/expense-form')}
                                    className="w-full justify-between bg-white text-slate-950 hover:bg-slate-100 sm:w-auto sm:justify-center"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        New Transaction
                                    </span>
                                    <ArrowUpRight className="h-4 w-4 opacity-80 sm:ml-1" />
                                </Button>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-inner shadow-white/5 backdrop-blur">
                                <div className="mb-2 inline-flex items-center gap-2 text-sm text-slate-300">
                                    <Calendar className="h-4 w-4" aria-hidden="true" />
                                    <span>Total Balance</span>
                                </div>
                                <AnimatedCurrency
                                    value={remainingBalance}
                                    className={cn(
                                        'block text-4xl font-extrabold tracking-tight sm:text-6xl',
                                        balanceIsLow ? 'text-orange-300' : 'text-white'
                                    )}
                                />
                                {balanceIsLow && (
                                    <p className="mt-2 text-sm font-medium text-orange-200">
                                        Warning: you have less than 10% of this month&apos;s income remaining.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <p className="text-sm text-slate-300">Total Income</p>
                                    <AnimatedCurrency
                                        value={totalIncome}
                                        className="mt-2 block text-2xl font-bold tracking-tight text-emerald-200"
                                    />
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <p className="text-sm text-slate-300">Total Spent</p>
                                    <AnimatedCurrency
                                        value={totalSpent}
                                        className="mt-2 block text-2xl font-bold tracking-tight text-rose-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Motion.div>

            <Motion.div {...sectionMotion} transition={{ duration: 0.4, delay: 0.03 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Insights</CardTitle>
                        <CardDescription>
                            Spending versus income for the current month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-muted-foreground">Spending ratio</span>
                                <span className="font-semibold tabular-nums">
                                    {formatPercentage(spendingPercentage)}
                                </span>
                            </div>
                            <Progress
                                value={spendingPercentage}
                                indicatorClassName={spendingProgressColor}
                                aria-label="Monthly spending percentage"
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">Spent this month</p>
                                <p className="mt-2 text-xl font-bold tabular-nums">
                                    {currencyFormatter.format(totalSpent)} • {formatPercentage(spendingPercentage)}
                                </p>
                            </div>
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">Saved so far</p>
                                <p className="mt-2 text-xl font-bold tabular-nums">
                                    {currencyFormatter.format(remainingBalance)} • {formatPercentage(savingsPercentage)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Motion.div>

            <Motion.div {...sectionMotion} transition={{ duration: 0.4, delay: 0.05 }}>
                <Card>
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <CardTitle>Recent Transactions</CardTitle>
                                <CategoryFilterMenu
                                    selectedCategories={selectedCategories}
                                    onChange={setSelectedCategories}
                                />
                            </div>
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
                                        Add your first transaction
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {selectedCategories.length > 0 && filteredRecentExpenses.length === 0 ? (
                                    <div className="px-4 pb-6 pt-2 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            No transactions found in this category.
                                        </p>
                                    </div>
                                ) : (
                                    <Motion.ul layout className="list-none" role="list">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {filteredRecentExpenses.map((expense) => {
                                                const transactionType = getTransactionType(expense);
                                                const amountPrefix = transactionType === 'income' ? '+' : '-';
                                                return (
                                                    <Motion.li
                                                        key={expense.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.22 }}
                                                    >
                                                        <div className="flex items-center justify-between gap-3 border-b p-4 last:border-0">
                                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                                <div
                                                                    className={cn(
                                                                        'flex shrink-0 rounded-full p-2',
                                                                        getCategoryDef(expense.category ?? expense.paymentMode)
                                                                            .color
                                                                    )}
                                                                >
                                                                    <CategoryIcon
                                                                        categoryRef={
                                                                            expense.category ?? expense.paymentMode
                                                                        }
                                                                        size={18}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1 pr-2">
                                                                    <p className="font-semibold text-foreground">
                                                                        {expense.description}
                                                                    </p>
                                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                                        {formatDate(expense.date)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p
                                                                className={cn(
                                                                    'shrink-0 text-base font-bold tabular-nums',
                                                                    transactionType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                                                )}
                                                            >
                                                                {amountPrefix}£{expense.amount.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </Motion.li>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </Motion.ul>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </Motion.div>
        </div>
    );
}
