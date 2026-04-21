import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CATEGORIES, DEFAULT_CATEGORY_ID } from '@/lib/constants';

export default function ExpenseForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORY_ID);
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!description || !amount || isNaN(Number(amount)) || Number(amount) <= 0 || !category || !date) {
            toast.error('Please provide all required fields');
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'users', user.uid, 'expenses'), {
                description,
                amount: parseFloat(amount),
                category,
                timestamp: Timestamp.fromDate(new Date(`${date}T00:00:00`)),
            });

            toast.success('Expense added successfully!');
            navigate('/expenses');
        } catch (error) {
            toast.error('Failed to add expense. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <Button type="button" variant="ghost" className="w-fit gap-2 px-0" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Add new expense</h1>
                <p className="text-sm text-muted-foreground">Log a personal transaction to keep your totals accurate.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                    <CardDescription>Amount, category, and date are required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Groceries, train ticket"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (£)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger
                                    id="category"
                                    className="min-h-12 w-full touch-manipulation sm:min-h-10"
                                    aria-label="Transaction category"
                                >
                                    <SelectValue placeholder="Choose category" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[min(24rem,70vh)]">
                                    {CATEGORIES.map(({ id, label }) => (
                                        <SelectItem key={id} value={id}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date" className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full min-h-12 touch-manipulation sm:min-h-9" disabled={loading}>
                            <Save className="h-4 w-4" />
                            {loading ? 'Adding…' : 'Add expense'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
