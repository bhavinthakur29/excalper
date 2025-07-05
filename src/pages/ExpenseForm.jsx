import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaSave, FaUser, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ExpenseForm.css';

export default function ExpenseForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [person, setPerson] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalExpense, setTotalExpense] = useState(0);

    useEffect(() => {
        if (user) {
            fetchPeople();
        }
    }, [user]);

    useEffect(() => {
        if (person && user) {
            fetchTotalExpense();
        }
    }, [person, user]);

    const fetchPeople = async () => {
        try {
            const peopleRef = collection(db, 'users', user.uid, 'people');
            const peopleSnapshot = await getDocs(peopleRef);
            const peopleList = peopleSnapshot.docs.map(doc => doc.data().name);
            setPeople(peopleList.sort());
            if (peopleList.length === 0) {
                setPerson(user.uid);
            }
        } catch (error) {
            toast.error('Error fetching people list');
        }
    };

    const fetchTotalExpense = async () => {
        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const expensesSnapshot = await getDocs(expensesRef);
            const userExpenses = expensesSnapshot.docs
                .map(doc => doc.data())
                .filter(exp => exp.person === person);
            const total = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            setTotalExpense(total);
        } catch (error) {
            toast.error('Error fetching total expense');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!description || !amount || isNaN(Number(amount)) || Number(amount) <= 0 || !person || !paymentMode) {
            toast.error('Please provide all required fields');
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'users', user.uid, 'expenses'), {
                description,
                amount: parseFloat(amount),
                person,
                paymentMode,
                timestamp: serverTimestamp(),
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
        <div className="expense-form-container">
            <div className="expense-form-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <FaArrowLeft /> Back
                </button>
                <h1>Add New Expense</h1>
            </div>
            <div className="expense-form-card">
                <form onSubmit={handleSubmit} className="expense-form">
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Enter expense description"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="amount">Amount (£)</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="person">Person</label>
                        {people.length > 0 ? (
                            <select
                                id="person"
                                value={person}
                                onChange={e => setPerson(e.target.value)}
                                required
                            >
                                <option value="">Select a person</option>
                                {people.map((p, index) => (
                                    <option key={index} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="input-disabled">
                                <FaUser />
                                <span>Self</span>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentMode">Payment Mode</label>
                        <select
                            id="paymentMode"
                            value={paymentMode}
                            onChange={e => setPaymentMode(e.target.value)}
                            required
                        >
                            <option value="">Select payment mode</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="contactless">Contactless</option>
                            <option value="net banking">Net Banking</option>
                        </select>
                    </div>
                    {person && (
                        <div className="total-expense-info">
                            <p>Total expense for {person}: £{totalExpense.toFixed(2)}</p>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                        <FaSave /> {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
} 