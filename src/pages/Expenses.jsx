import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/useAuth';
import {
    Plus,
    Trash2,
    Pencil,
    Filter,
    BarChart3,
    Wallet,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import EditExpenseModal from '../components/Modal/EditExpenseModal';
import { toJsDate, monthKeyFromTimestamp } from '../utils/timestamps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import CategoryFilterMenu from '@/components/CategoryFilterMenu';
import { CategoryIcon } from '@/lib/categoryIcon';
import { getCategoryDef, getTransactionType, resolveCategoryId } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const selectTriggerClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function Expenses() {
    const { user, currency } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [monthlyExpenses, setMonthlyExpenses] = useState({});
    const [stats, setStats] = useState({
        income: 0,
        spent: 0,
        balance: 0,
        count: 0
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);

    const fetchExpenses = useCallback(async () => {
        if (!user) return;

        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const q = query(expensesRef, orderBy('timestamp', 'desc'));
            const expensesSnapshot = await getDocs(q);
            const expensesList = expensesSnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                userId: user.uid,
                date: toJsDate(d.data().timestamp),
            }));
            setExpenses(expensesList);

            const grouped = expensesList.reduce((acc, expense) => {
                const month = monthKeyFromTimestamp(expense.timestamp);
                if (!month) return acc;
                if (!acc[month]) acc[month] = [];
                acc[month].push(expense);
                return acc;
            }, {});
            setMonthlyExpenses(grouped);
        } catch {
            toast.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const calculateStats = useCallback(() => {
        let filteredExpenses = expenses;

        if (selectedMonth) {
            filteredExpenses = filteredExpenses.filter(exp => {
                const expMonth = monthKeyFromTimestamp(exp.timestamp);
                return expMonth === selectedMonth;
            });
        }

        if (selectedCategories.length > 0) {
            filteredExpenses = filteredExpenses.filter((exp) => {
                const cat = resolveCategoryId(exp.category ?? exp.paymentMode);
                return selectedCategories.includes(cat);
            });
        }

        const income = filteredExpenses
            .filter((exp) => getTransactionType(exp) === 'income')
            .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const spent = filteredExpenses
            .filter((exp) => getTransactionType(exp) === 'expense')
            .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const count = filteredExpenses.length;

        setStats({ income, spent, balance: income - spent, count });
    }, [expenses, selectedCategories, selectedMonth]);

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [fetchExpenses, user]);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    const deleteExpense = async () => {
        if (!expenseToDelete) return;

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'expenses', expenseToDelete.id));
            toast.success('Transaction deleted successfully');
            setShowDeleteModal(false);
            setExpenseToDelete(null);
            fetchExpenses();
        } catch {
            toast.error('Failed to delete transaction');
        }
    };

    const getFilteredExpenses = () => {
        let filtered = expenses;

        if (selectedMonth) {
            filtered = filtered.filter(exp => {
                const expMonth = monthKeyFromTimestamp(exp.timestamp);
                return expMonth === selectedMonth;
            });
        }

        if (selectedCategories.length > 0) {
            filtered = filtered.filter((exp) => {
                const cat = resolveCategoryId(exp.category ?? exp.paymentMode);
                return selectedCategories.includes(cat);
            });
        }

        return filtered;
    };

    const availableMonths = Object.keys(monthlyExpenses).sort((a, b) => b.localeCompare(a));

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        if (!year || !month) return monthKey;
        return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filtered = getFilteredExpenses();

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                    Loading transactions…
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <Wallet className="h-8 w-8 text-primary" aria-hidden="true" />
                        Transactions
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review and manage money in and money out.</p>
                </div>
                <Button type="button" onClick={() => navigate('/expense-form')} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add transaction
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Income</CardDescription>
                        <CardTitle className="text-2xl tabular-nums text-emerald-600">
                            +{formatCurrency(stats.income, currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Spent</CardDescription>
                        <CardTitle className="text-2xl tabular-nums text-rose-600">
                            -{formatCurrency(stats.spent, currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Net Balance</CardDescription>
                        <CardTitle
                            className={cn(
                                'text-2xl tabular-nums',
                                stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            )}
                        >
                            {stats.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stats.balance), currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" aria-hidden="true" />
                        Filters
                    </CardTitle>
                        <CardDescription>Refine the list by month and category.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="expenses-month">Month</Label>
                        <select
                            id="expenses-month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={selectTriggerClass}
                        >
                            <option value="">All months</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{formatMonthLabel(month)}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span>All transactions ({filtered.length})</span>
                        </CardTitle>
                        <CategoryFilterMenu
                            selectedCategories={selectedCategories}
                            onChange={setSelectedCategories}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {expenses.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
                            <Wallet className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No transactions found. Add your first transaction to get started.</p>
                            <Button type="button" variant="secondary" onClick={() => navigate('/expense-form')}>
                                <Plus className="h-4 w-4" />
                                Add transaction
                            </Button>
                        </div>
                    ) : (
                        <>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-4 pb-8 pt-2 text-center text-muted-foreground">
                                    <Wallet className="h-10 w-10 opacity-40" />
                                    <p className="text-sm">
                                        {selectedCategories.length > 0
                                            ? 'No transactions found in this category.'
                                            : 'No transactions match your filters.'}
                                    </p>
                                </div>
                            ) : (
                                <Motion.ul layout className="list-none" role="list">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {filtered.map((expense) => {
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
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-semibold text-foreground">
                                                                    {expense.description}
                                                                </p>
                                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                                    {formatDate(expense.date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-3">
                                                            <span
                                                                className={cn(
                                                                    'text-base font-bold tabular-nums',
                                                                    transactionType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                                                )}
                                                            >
                                                                {amountPrefix}{formatCurrency(expense.amount, currency)}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                title="Edit transaction"
                                                                onClick={() => {
                                                                    setExpenseToEdit(expense);
                                                                    setShowEditModal(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="destructive"
                                                                title="Delete transaction"
                                                                onClick={() => {
                                                                    setExpenseToDelete(expense);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
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

            <Modal
                isOpen={showDeleteModal}
                title="Delete Transaction"
                message={`Are you sure you want to delete "${expenseToDelete?.description}" (${formatCurrency(expenseToDelete?.amount, currency)})?`}
                onConfirm={deleteExpense}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setExpenseToDelete(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
                destructive
            />

            <EditExpenseModal
                isOpen={showEditModal}
                expense={expenseToEdit}
                onClose={() => setShowEditModal(false)}
                onSave={fetchExpenses}
            />
        </div>
    );
}
