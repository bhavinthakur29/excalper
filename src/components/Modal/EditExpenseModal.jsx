import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/useAuth';
import { CATEGORIES, DEFAULT_CATEGORY_ID, INCOME_CATEGORY_ID, getTransactionType, resolveCategoryId } from '@/lib/constants';
import { getCurrencySymbol } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function EditExpenseModal({ isOpen, expense, onClose, onSave }) {
    const { currency } = useAuth();
    const currencySymbol = getCurrencySymbol(currency);
    const [transactionType, setTransactionType] = useState('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORY_ID);
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expense) {
            const type = getTransactionType(expense);
            setTransactionType(type);
            setDescription(expense.description || '');
            setAmount(String(expense.amount ?? ''));
            const raw = expense.category ?? expense.paymentMode ?? '';
            setCategory(type === 'income' ? INCOME_CATEGORY_ID : resolveCategoryId(raw));
            setDate(expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '');
        }
    }, [expense]);

    const handleOpenChange = (open) => {
        if (!open) onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const selectedCategory = transactionType === 'income' ? INCOME_CATEGORY_ID : category;
            if (!description || !amount || !selectedCategory || !date) {
                toast.error('All fields are required and must be valid.');
                setLoading(false);
                return;
            }
            if (isNaN(parseFloat(amount))) {
                toast.error('Amount must be a valid number.');
                setLoading(false);
                return;
            }

            if (!expense?.id || !expense?.userId) {
                console.error('Missing expense.id or userId:', expense);
                toast.error('Expense data is incomplete. Please refresh and try again.');
                setLoading(false);
                return;
            }

            await updateDoc(doc(db, 'users', expense.userId, 'expenses', expense.id), {
                description,
                amount: parseFloat(amount),
                type: transactionType,
                category: selectedCategory,
                timestamp: Timestamp.fromDate(new Date(`${date}T00:00:00`)),
            });

            if (onSave) onSave();
            onClose();
            toast.success('Transaction updated successfully!');
        } catch (error) {
            console.error('Failed to update expense:', error);
            toast.error('Failed to update expense. ' + (error?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen && !!expense} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Edit transaction</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <div className="space-y-2">
                            <Label>Transaction type</Label>
                            <div className="grid rounded-lg border bg-muted p-1 sm:grid-cols-2" role="tablist" aria-label="Transaction type">
                                {[
                                    { value: 'expense', label: 'Expense' },
                                    { value: 'income', label: 'Income' },
                                ].map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant="ghost"
                                        role="tab"
                                        aria-selected={transactionType === option.value}
                                        onClick={() => setTransactionType(option.value)}
                                        className={cn(
                                            'min-h-11 touch-manipulation justify-center rounded-md shadow-none sm:min-h-9',
                                            transactionType === option.value && 'bg-background text-foreground shadow-sm',
                                            transactionType === option.value && option.value === 'income' && 'text-emerald-700'
                                        )}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-description">Description</Label>
                            <Input
                                id="edit-expense-description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-amount">Amount ({currencySymbol})</Label>
                            <Input
                                id="edit-expense-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        {transactionType === 'expense' && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-expense-category">Category</Label>
                                <Select value={category} onValueChange={setCategory} required>
                                    <SelectTrigger
                                        id="edit-expense-category"
                                        className="min-h-12 w-full touch-manipulation sm:min-h-10"
                                        aria-label="Expense category"
                                    >
                                        <SelectValue placeholder="Choose category" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="max-h-[min(24rem,70vh)]">
                                        {CATEGORIES.filter(({ id }) => id !== INCOME_CATEGORY_ID).map(({ id, label }) => (
                                            <SelectItem key={id} value={id}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-date">Date</Label>
                            <Input
                                id="edit-expense-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(transactionType === 'income' && 'bg-emerald-600 text-white hover:bg-emerald-700')}
                        >
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
