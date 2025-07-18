import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaFilter, FaChartBar, FaMoneyBillWave, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import EditExpenseModal from '../components/Modal/EditExpenseModal';
import './Expenses.css';

export default function Expenses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedPerson, setSelectedPerson] = useState('');
    const [selectedSettlementStatus, setSelectedSettlementStatus] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [expenseToSettle, setExpenseToSettle] = useState(null);
    const [monthlyExpenses, setMonthlyExpenses] = useState({});
    const [people, setPeople] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
        count: 0,
        settled: 0,
        unsettled: 0
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);
    const [settlingExpense, setSettlingExpense] = useState(null);

    useEffect(() => {
        if (user) {
            fetchExpenses();
            fetchSettlements();
            fetchPeople();
        }
    }, [user]);

    useEffect(() => {
        calculateStats();
    }, [expenses, settlements, selectedMonth, selectedPerson, selectedSettlementStatus]);

    const fetchExpenses = async () => {
        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const q = query(expensesRef, orderBy('timestamp', 'desc'));
            const expensesSnapshot = await getDocs(q);
            const expensesList = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                userId: user.uid,
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

    const fetchSettlements = async () => {
        try {
            const settlementsRef = collection(db, 'users', user.uid, 'settlements');
            const settlementsQuery = query(settlementsRef, orderBy('timestamp', 'desc'));
            const settlementsSnapshot = await getDocs(settlementsQuery);
            const settlementsList = settlementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            }));
            setSettlements(settlementsList);
        } catch (error) {
            console.error('Error fetching settlements:', error);
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

    const isExpenseSettled = (expense) => {
        // Check if there's a settlement for this specific expense
        return settlements.some(settlement =>
            settlement.expenseId === expense.id && settlement.status === 'completed'
        );
    };

    const getExpenseSettlement = (expense) => {
        return settlements.find(settlement =>
            settlement.expenseId === expense.id && settlement.status === 'completed'
        );
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

        if (selectedSettlementStatus) {
            filteredExpenses = filteredExpenses.filter(exp => {
                const isSettled = isExpenseSettled(exp);
                return selectedSettlementStatus === 'settled' ? isSettled : !isSettled;
            });
        }

        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = filteredExpenses.length;
        const average = count > 0 ? total / count : 0;
        const settled = filteredExpenses.filter(exp => isExpenseSettled(exp)).length;
        const unsettled = count - settled;

        setStats({ total, average, count, settled, unsettled });
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

    const handleExpenseSettlement = async (settlementData) => {
        if (!expenseToSettle) return;

        setSettlingExpense(expenseToSettle.id);

        try {
            await addDoc(collection(db, 'users', user.uid, 'settlements'), {
                ...settlementData,
                expenseId: expenseToSettle.id,
                timestamp: serverTimestamp(),
                status: 'completed'
            });

            // Add a small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            toast.success('Expense settlement recorded successfully!');
            setShowSettlementModal(false);
            setExpenseToSettle(null);
            fetchSettlements();
        } catch (error) {
            toast.error('Failed to record expense settlement');
        } finally {
            setSettlingExpense(null);
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

        if (selectedSettlementStatus) {
            filtered = filtered.filter(exp => {
                const isSettled = isExpenseSettled(exp);
                return selectedSettlementStatus === 'settled' ? isSettled : !isSettled;
            });
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
                <div className="stat-card">
                    <h3>Settled</h3>
                    <p>{stats.settled}</p>
                </div>
                <div className="stat-card">
                    <h3>Unsettled</h3>
                    <p>{stats.unsettled}</p>
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
                    <div className="filter-group">
                        <label>Settlement Status</label>
                        <select
                            value={selectedSettlementStatus}
                            onChange={(e) => setSelectedSettlementStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Expenses</option>
                            <option value="settled">Settled</option>
                            <option value="unsettled">Unsettled</option>
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
                        {getFilteredExpenses().map(expense => {
                            const isSettled = isExpenseSettled(expense);
                            const settlement = getExpenseSettlement(expense);
                            const isSettling = settlingExpense === expense.id;

                            return (
                                <div
                                    key={expense.id}
                                    className={`expense-card ${isSettled ? 'expense-settled' : ''} ${isSettling ? 'loading' : ''}`}
                                >
                                    <div className="expense-info">
                                        <div className="expense-header">
                                            <h3>{expense.description}</h3>
                                            <div className="expense-amount-section">
                                                <span className="expense-amount">£{expense.amount.toFixed(2)}</span>
                                                {isSettled && (
                                                    <span className="settlement-badge">
                                                        <FaCheckCircle /> Settled
                                                    </span>
                                                )}
                                            </div>
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
                                            {isSettled && settlement && (
                                                <span className="settlement-info">
                                                    <FaHistory /> Settled by {settlement.fromUser} on {formatDate(settlement.date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="expense-actions">
                                        {!isSettled && (
                                            <button
                                                onClick={() => {
                                                    setExpenseToSettle(expense);
                                                    setShowSettlementModal(true);
                                                }}
                                                className="btn btn-primary settle-btn"
                                                title="Mark as settled"
                                                disabled={isSettling}
                                            >
                                                {isSettling ? (
                                                    <div className="settle-spinner"></div>
                                                ) : (
                                                    <FaCheckCircle />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setExpenseToEdit(expense);
                                                setShowEditModal(true);
                                            }}
                                            className="btn btn-secondary edit-btn"
                                            title="Edit expense"
                                            disabled={isSettling}
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
                                            disabled={isSettling}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Settlement Modal */}
            <Modal
                isOpen={showSettlementModal}
                title="Mark Expense as Settled"
                onConfirm={() => handleExpenseSettlement({
                    fromUser: expenseToSettle?.person,
                    toUser: 'Group',
                    amount: expenseToSettle?.amount,
                    description: `Settlement for: ${expenseToSettle?.description}`
                })}
                onCancel={() => {
                    if (settlingExpense !== expenseToSettle?.id) {
                        setShowSettlementModal(false);
                        setExpenseToSettle(null);
                    }
                }}
                confirmText={settlingExpense === expenseToSettle?.id ? "Settling..." : "Confirm"}
                cancelText="Cancel"
                isConfirming={settlingExpense === expenseToSettle?.id}
                customContent={
                    expenseToSettle && (
                        <div className="settlement-modal-content">
                            <div className="settlement-details">
                                <p><strong>Expense:</strong> {expenseToSettle.description}</p>
                                <p><strong>Amount:</strong> £{expenseToSettle.amount.toFixed(2)}</p>
                                <p><strong>Paid by:</strong> {expenseToSettle.person}</p>
                                <p><strong>Date:</strong> {formatDate(expenseToSettle.date)}</p>
                            </div>
                        </div>
                    )
                }
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
