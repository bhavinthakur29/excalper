import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaChartPie, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaBalanceScale } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Contributions.css';

export default function Contributions() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [monthlyExpenses, setMonthlyExpenses] = useState({});

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch expenses
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const q = query(expensesRef, orderBy('timestamp', 'desc'));
            const expensesSnapshot = await getDocs(q);
            const expensesList = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
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

            // Fetch users
            const usersRef = collection(db, 'users', user.uid, 'people');
            const usersSnapshot = await getDocs(usersRef);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                timestamp: doc.data().timestamp
            }));
            setUsers(usersList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const calculateUserExpenses = (userName, monthFilter = '') => {
        let userExpenses = expenses.filter(exp => exp.person === userName);

        if (monthFilter) {
            userExpenses = userExpenses.filter(exp => {
                const expMonth = exp.date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return expMonth === monthFilter;
            });
        }

        return userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    };

    const calculateTotalExpenses = (monthFilter = '') => {
        let totalExpenses = expenses;

        if (monthFilter) {
            totalExpenses = expenses.filter(exp => {
                const expMonth = exp.date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return expMonth === monthFilter;
            });
        }

        return totalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    };

    const calculateDistribution = (monthFilter = '') => {
        const total = calculateTotalExpenses(monthFilter);
        const userCount = users.length || 1;
        const perPerson = total / userCount;

        return users.map(user => {
            const userTotal = calculateUserExpenses(user.name, monthFilter);
            const balance = userTotal - perPerson;
            return {
                name: user.name,
                total: userTotal,
                balance,
                status: balance > 0 ? `Receives £${balance.toFixed(2)}` :
                    balance < 0 ? `Pays £${Math.abs(balance).toFixed(2)}` : 'No dues'
            };
        });
    };

    const availableMonths = Object.keys(monthlyExpenses).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    if (loading) {
        return (
            <div className="contributions-container">
                <div className="loading-spinner">Loading contributions...</div>
            </div>
        );
    }

    return (
        <div className="contributions-container">
            <div className="contributions-header">
                <h1><FaChartPie /> Contributions & Balances</h1>
                <p>Track expense distribution and settle balances</p>
            </div>

            {/* Month Filter */}
            <div className="month-filter-section">
                <h2><FaCalendarAlt /> Filter by Month</h2>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-select"
                >
                    <option value="">All Months</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            {/* Summary Stats */}
            <div className="summary-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-content">
                        <h3>Total Expenses</h3>
                        <p>£{calculateTotalExpenses(selectedMonth).toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <div className="stat-content">
                        <h3>Participants</h3>
                        <p>{users.length}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBalanceScale />
                    </div>
                    <div className="stat-content">
                        <h3>Per Person</h3>
                        <p>£{(calculateTotalExpenses(selectedMonth) / (users.length || 1)).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Distribution Table */}
            {users.length > 0 ? (
                <div className="distribution-section">
                    <h2><FaChartPie /> Expense Distribution {selectedMonth && `- ${selectedMonth}`}</h2>

                    <div className="distribution-table">
                        <div className="table-header">
                            <span>Person</span>
                            <span>Total Spent</span>
                            <span>Balance</span>
                            <span>Status</span>
                        </div>

                        {calculateDistribution(selectedMonth).map((user, index) => (
                            <div key={index} className="table-row">
                                <span className="user-name">{user.name}</span>
                                <span className="user-total">£{user.total.toFixed(2)}</span>
                                <span className={`user-balance ${user.balance > 0 ? 'positive' : user.balance < 0 ? 'negative' : 'neutral'}`}>
                                    {user.balance > 0 ? '+' : ''}£{user.balance.toFixed(2)}
                                </span>
                                <span className={`user-status ${user.balance > 0 ? 'receives' : user.balance < 0 ? 'pays' : 'balanced'}`}>
                                    {user.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="no-users">
                    <FaUsers />
                    <h3>No Users Added</h3>
                    <p>Add users in the Users section to see contribution distributions.</p>
                </div>
            )}

            {/* Settlement Suggestions */}
            {users.length > 1 && (
                <div className="settlement-section">
                    <h2><FaBalanceScale /> Settlement Suggestions</h2>
                    <div className="settlement-info">
                        <p>
                            To settle all balances, users who owe money should pay those who are owed money.
                            This ensures everyone pays their fair share.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
} 