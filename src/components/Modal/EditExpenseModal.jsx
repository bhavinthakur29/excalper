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

const selectClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function EditExpenseModal({ isOpen, expense, onClose, onSave }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expense) {
            setDescription(expense.description || '');
            setAmount(String(expense.amount ?? ''));
            setCategory(expense.category || expense.paymentMode || '');
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
            if (!description || !amount || !category || !date) {
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
                category,
                timestamp: Timestamp.fromDate(new Date(`${date}T00:00:00`)),
            });

            if (onSave) onSave();
            onClose();
            toast.success('Expense updated successfully!');
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
                        <DialogTitle>Edit expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
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
                            <Label htmlFor="edit-expense-amount">Amount (£)</Label>
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
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-category">Category</Label>
                            <select
                                id="edit-expense-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={selectClassName}
                                required
                            >
                                <option value="">Select</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="contactless">Contactless</option>
                                <option value="net banking">Net banking</option>
                            </select>
                        </div>
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
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
