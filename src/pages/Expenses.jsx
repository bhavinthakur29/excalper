import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const selectTriggerClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function Expenses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [monthlyExpenses, setMonthlyExpenses] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
        count: 0
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [user]);

    useEffect(() => {
        calculateStats();
    }, [expenses, selectedMonth]);

    const fetchExpenses = async () => {
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
        } catch (error) {
            toast.error('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        let filteredExpenses = expenses;

        if (selectedMonth) {
            filteredExpenses = filteredExpenses.filter(exp => {
                const expMonth = monthKeyFromTimestamp(exp.timestamp);
                return expMonth === selectedMonth;
            });
        }

        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = filteredExpenses.length;
        const average = count > 0 ? total / count : 0;

        setStats({ total, average, count });
    };

    const deleteExpense = async () => {
        if (!expenseToDelete) return;

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'expenses', expenseToDelete.id));
            toast.success('Expense deleted successfully');
            setShowDeleteModal(false);
            setExpenseToDelete(null);
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to delete expense');
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

    const categoryLabel = (expense) => expense.category || expense.paymentMode || 'Other';

    const filtered = getFilteredExpenses();

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                    Loading expenses…
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
                        Expenses
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review and manage your personal spending.</p>
                </div>
                <Button type="button" onClick={() => navigate('/expense-form')} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add expense
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total</CardDescription>
                        <CardTitle className="text-2xl tabular-nums">£{stats.total.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Average</CardDescription>
                        <CardTitle className="text-2xl tabular-nums">£{stats.average.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Count</CardDescription>
                        <CardTitle className="text-2xl tabular-nums">{stats.count}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" aria-hidden="true" />
                        Filters
                    </CardTitle>
                    <CardDescription>Refine the list by month.</CardDescription>
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
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5" aria-hidden="true" />
                        All expenses ({filtered.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
                            <Wallet className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No expenses found. Add your first expense to get started.</p>
                            <Button type="button" variant="secondary" onClick={() => navigate('/expense-form')}>
                                <Plus className="h-4 w-4" />
                                Add expense
                            </Button>
                        </div>
                    ) : (
                        <ul role="list">
                            {filtered.map((expense) => (
                                <li key={expense.id}>
                                    <div className="flex items-center justify-between gap-3 border-b p-4 last:border-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-foreground">{expense.description}</p>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="font-normal">
                                                    {formatDate(expense.date)}
                                                </Badge>
                                                <Badge variant="outline" className="font-normal">
                                                    {categoryLabel(expense)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-base font-bold tabular-nums text-foreground">
                                                £{expense.amount.toFixed(2)}
                                            </span>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                title="Edit expense"
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
                                                title="Delete expense"
                                                onClick={() => {
                                                    setExpenseToDelete(expense);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={showDeleteModal}
                title="Delete Expense"
                message={`Are you sure you want to delete "${expenseToDelete?.description}" (£${expenseToDelete?.amount.toFixed(2)})?`}
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
