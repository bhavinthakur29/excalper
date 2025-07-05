import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaChartBar, FaUsers, FaCog, FaMoneyBillWave, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Home.css';

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalUsers: 0,
        thisMonth: 0,
        averageExpense: 0
    });
    const [photoBase64, setPhotoBase64] = useState('');

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    useEffect(() => {
        const fetchPhoto = async () => {
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists() && userSnap.data().photoBase64) {
                        setPhotoBase64(userSnap.data().photoBase64);
                    }
                } catch { }
            }
        };
        fetchPhoto();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            // Fetch recent expenses
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const expensesQuery = query(expensesRef, orderBy('timestamp', 'desc'), limit(5));
            const expensesSnapshot = await getDocs(expensesQuery);
            const expensesList = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            }));
            setRecentExpenses(expensesList);

            // Fetch all expenses for stats
            const allExpensesSnapshot = await getDocs(expensesRef);
            const allExpenses = allExpensesSnapshot.docs.map(doc => ({
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            }));

            // Fetch users count
            const usersRef = collection(db, 'users', user.uid, 'people');
            const usersSnapshot = await getDocs(usersRef);
            const usersCount = usersSnapshot.size;

            // Calculate stats
            const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const averageExpense = allExpenses.length > 0 ? totalExpenses / allExpenses.length : 0;

            const now = new Date();
            const thisMonth = allExpenses.filter(exp => {
                const expDate = exp.date;
                return expDate.getMonth() === now.getMonth() &&
                    expDate.getFullYear() === now.getFullYear();
            }).reduce((sum, exp) => sum + exp.amount, 0);

            setStats({
                totalExpenses,
                totalUsers: usersCount,
                thisMonth,
                averageExpense
            });
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPaymentModeIcon = (mode) => {
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
            <div className="home-container">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <div className="welcome-section">
                    <h1>Welcome back, {user?.displayName || 'User'}!</h1>
                    <p>Manage your expenses and track your spending</p>
                </div>
                <div className="user-avatar">
                    {photoBase64 ? (
                        <img src={photoBase64} alt="avatar" className="homepage-avatar" />
                    ) : (
                        <FaUser />
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-content">
                        <h3>Total Expenses</h3>
                        <p>£{stats.totalExpenses.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaCalendarAlt />
                    </div>
                    <div className="stat-content">
                        <h3>This Month</h3>
                        <p>£{stats.thisMonth.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <div className="stat-content">
                        <h3>Total Users</h3>
                        <p>{stats.totalUsers}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaChartBar />
                    </div>
                    <div className="stat-content">
                        <h3>Average Expense</h3>
                        <p>£{stats.averageExpense.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <button onClick={() => navigate('/expense-form')} className="action-card">
                        <FaPlus />
                        <span>Add Expense</span>
                    </button>
                    <button onClick={() => navigate('/expenses')} className="action-card">
                        <FaMoneyBillWave />
                        <span>View Expenses</span>
                    </button>
                    <button onClick={() => navigate('/users')} className="action-card">
                        <FaUsers />
                        <span>Manage Users</span>
                    </button>
                    <button onClick={() => navigate('/settings')} className="action-card">
                        <FaCog />
                        <span>Settings</span>
                    </button>
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="recent-expenses">
                <div className="section-header">
                    <h2>Recent Expenses</h2>
                    <button onClick={() => navigate('/expenses')} className="view-all-btn">
                        View All
                    </button>
                </div>

                {recentExpenses.length === 0 ? (
                    <div className="no-expenses">
                        <FaMoneyBillWave />
                        <p>No expenses yet. Add your first expense to get started!</p>
                        <button onClick={() => navigate('/expense-form')} className="btn btn-primary">
                            <FaPlus /> Add First Expense
                        </button>
                    </div>
                ) : (
                    <div className="expenses-list">
                        {recentExpenses.map(expense => (
                            <div key={expense.id} className="expense-item">
                                <div className="expense-info">
                                    <h3>{expense.description}</h3>
                                    <div className="expense-details">
                                        <span className="expense-person">
                                            <FaUser /> {expense.person}
                                        </span>
                                        <span className="expense-date">
                                            {formatDate(expense.date)}
                                        </span>
                                        <span className="expense-payment">
                                            {getPaymentModeIcon(expense.paymentMode)} {expense.paymentMode}
                                        </span>
                                    </div>
                                </div>
                                <div className="expense-amount">
                                    £{expense.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 