import React, { useState, useEffect } from 'react';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaTimes } from 'react-icons/fa';
import './EditExpenseModal.css';
import { toast } from 'react-toastify';

export default function EditExpenseModal({ isOpen, expense, onClose, onSave, people: peopleProp = [] }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [person, setPerson] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expense) {
            setDescription(expense.description || '');
            setAmount(expense.amount || '');
            setPerson(expense.person || '');
            setPaymentMode(expense.paymentMode || '');
            setDate(expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '');
            console.log('EditExpenseModal received expense:', expense);
        }
    }, [expense]);

    const peopleList = React.useMemo(() => {
        let list = Array.isArray(peopleProp) ? [...peopleProp] : [];
        if (expense && expense.person && !list.includes(expense.person)) {
            list.push(expense.person);
        }
        return list.filter(Boolean).sort();
    }, [peopleProp, expense]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!description || !amount || !person || !paymentMode || !date) {
                toast.error('All fields are required and must be valid.');
                setLoading(false);
                return;
            }
            if (isNaN(parseFloat(amount))) {
                toast.error('Amount must be a valid number.');
                setLoading(false);
                return;
            }

            // Defensive check
            if (!expense?.id || !expense?.userId) {
                console.error('Missing expense.id or userId:', expense);
                toast.error('Expense data is incomplete. Please refresh and try again.');
                setLoading(false);
                return;
            }

            await updateDoc(doc(db, 'users', expense.userId, 'expenses', expense.id), {
                description,
                amount: parseFloat(amount),
                person,
                paymentMode,
                timestamp: new Date(date),
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

    if (!isOpen || !expense) return null;

    return (
        <div className="edit-expense-modal-overlay" onClick={onClose}>
            <div className="edit-expense-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title-bar">
                    <h2>Edit Expense</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <FaTimes />
                    </button>
                </div>
                <form className="edit-expense-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label>Description
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required />
                        </label>
                    </div>
                    <div className="divider" />
                    <div className="form-section">
                        <label>Amount (£)
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" required />
                        </label>
                    </div>
                    <div className="divider" />
                    <div className="form-section">
                        <label>Person
                            <input type="text" value={person} disabled />
                        </label>
                    </div>
                    <div className="divider" />
                    <div className="form-section">
                        <label>Payment Mode
                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} required>
                                <option value="">Select</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="contactless">Contactless</option>
                                <option value="net banking">Net Banking</option>
                            </select>
                        </label>
                    </div>
                    <div className="divider" />
                    <div className="form-section">
                        <label>Date
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary sticky-save" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
