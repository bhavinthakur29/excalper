import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaFilter, FaChartBar, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import EditExpenseModal from '../components/Modal/EditExpenseModal';
import './Expenses.css';

export default function Expenses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedPerson, setSelectedPerson] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [monthlyExpenses, setMonthlyExpenses] = useState({});
    const [people, setPeople] = useState([]);
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
            fetchPeople();
        }
    }, [user]);

    useEffect(() => {
        calculateStats();
    }, [expenses, selectedMonth, selectedPerson]);

    const fetchExpenses = async () => {
        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const q = query(expensesRef, orderBy('timestamp', 'desc'));
            const expensesSnapshot = await getDocs(q);
            const expensesList = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                userId: user.uid, // ✅ Fix: Add userId to each expense
                date: doc.data().timestamp?.toDate() || new Date()
            }));
            setExpenses(expensesList);

            // Group expenses by month
            const grouped = expensesList.reduce((acc, expense) => {
                const month = expense.date.toLocaleString('default', { month: 'long', year: 'numeric' });
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

    const fetchPeople = async () => {
        try {
            const peopleRef = collection(db, 'users', user.uid, 'people');
            const peopleSnapshot = await getDocs(peopleRef);
            const peopleList = peopleSnapshot.docs.map(doc => doc.data().name);
            setPeople(peopleList.sort());
        } catch (error) {
            console.error('Error fetching people:', error);
        }
    };

    const calculateStats = () => {
        let filteredExpenses = expenses;

        if (selectedMonth) {
            filteredExpenses = filteredExpenses.filter(exp => {
                const expMonth = exp.date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return expMonth === selectedMonth;
            });
        }

        if (selectedPerson) {
            filteredExpenses = filteredExpenses.filter(exp => exp.person === selectedPerson);
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
                const expMonth = exp.date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return expMonth === selectedMonth;
            });
        }

        if (selectedPerson) {
            filtered = filtered.filter(exp => exp.person === selectedPerson);
        }

        return filtered;
    };

    const availableMonths = Object.keys(monthlyExpenses).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPaymentModeIcon = (mode) => {
        if (!mode || typeof mode !== 'string') return '💰';
        switch (mode.toLowerCase()) {
            case 'cash':
                return '💵';
            case 'card':
                return '💳';
            case 'contactless':
                return '📱';
            case 'net banking':
                return '🏦';
            default:
                return '💰';
        }
    };

    if (loading) {
        return (
            <div className="expenses-container">
                <div className="loading-spinner">Loading expenses...</div>
            </div>
        );
    }

    return (
        <div className="expenses-container">
            <div className="expenses-header">
                <h1><FaMoneyBillWave /> Expenses</h1>
                <button onClick={() => navigate('/expense-form')} className="btn btn-primary add-btn">
                    <FaPlus /> Add Expense
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-section">
                <div className="stat-card">
                    <h3>Total</h3>
                    <p>£{stats.total.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                    <h3>Average</h3>
                    <p>£{stats.average.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                    <h3>Count</h3>
                    <p>{stats.count}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <h2><FaFilter /> Filters</h2>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Months</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Person</label>
                        <select
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All People</option>
                            {people.map(person => (
                                <option key={person} value={person}>{person}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="expenses-list-section">
                <h2><FaChartBar /> Expenses ({getFilteredExpenses().length})</h2>

                {getFilteredExpenses().length === 0 ? (
                    <div className="no-expenses">
                        <FaMoneyBillWave />
                        <p>No expenses found. Add your first expense to get started.</p>
                    </div>
                ) : (
                    <div className="expenses-list">
                        {getFilteredExpenses().map(expense => (
                            <div key={expense.id} className="expense-card">
                                <div className="expense-info">
                                    <div className="expense-header">
                                        <h3>{expense.description}</h3>
                                        <span className="expense-amount">£{expense.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="expense-details">
                                        <span className="expense-person">
                                            <FaCalendarAlt /> {expense.person}
                                        </span>
                                        <span className="expense-date">
                                            {formatDate(expense.date)}
                                        </span>
                                        <span className="expense-payment">
                                            {getPaymentModeIcon(expense.paymentMode)} {expense.paymentMode}
                                        </span>
                                    </div>
                                </div>
                                <div className="expense-actions">
                                    <button
                                        onClick={() => {
                                            setExpenseToEdit(expense);
                                            setShowEditModal(true);
                                        }}
                                        className="btn btn-secondary edit-btn"
                                        title="Edit expense"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setExpenseToDelete(expense);
                                            setShowDeleteModal(true);
                                        }}
                                        className="btn btn-danger delete-btn"
                                        title="Delete expense"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
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
