import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaTrash, FaUser, FaUsers, FaChartPie, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import './Users.css';

export default function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [newUserName, setNewUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [monthlyExpenses, setMonthlyExpenses] = useState({});

    useEffect(() => {
        if (user) {
            fetchUsers();
            fetchExpenses();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users', user.uid, 'people');
            const usersSnapshot = await getDocs(usersRef);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                timestamp: doc.data().timestamp
            }));
            setUsers(usersList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            const expensesRef = collection(db, 'users', user.uid, 'expenses');
            const expensesSnapshot = await getDocs(expensesRef);
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
        } catch (error) {
            toast.error('Failed to fetch expenses');
        }
    };

    const addUser = async (e) => {
        e.preventDefault();
        if (!newUserName.trim()) {
            toast.error('Please enter a valid name');
            return;
        }

        if (users.some(u => u.name.toLowerCase() === newUserName.trim().toLowerCase())) {
            toast.error('User already exists');
            return;
        }

        try {
            const usersRef = collection(db, 'users', user.uid, 'people');
            await addDoc(usersRef, {
                name: newUserName.trim(),
                timestamp: serverTimestamp()
            });

            toast.success('User added successfully');
            setNewUserName('');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to add user');
        }
    };

    const deleteUser = async () => {
        if (!userToDelete) return;

        try {
            // Delete user document
            await deleteDoc(doc(db, 'users', user.uid, 'people', userToDelete.id));

            // Delete associated expenses
            const userExpenses = expenses.filter(exp => exp.person === userToDelete.name);
            const deletePromises = userExpenses.map(exp =>
                deleteDoc(doc(db, 'users', user.uid, 'expenses', exp.id))
            );
            await Promise.all(deletePromises);

            toast.success('User and associated expenses deleted');
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to delete user');
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
            <div className="users-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="users-container">
            <div className="users-header">
                <h1><FaUsers /> Manage Users</h1>
                <p>Add and manage users for expense distribution</p>
            </div>

            {/* Add User Form */}
            <div className="add-user-section">
                <h2><FaPlus /> Add New User</h2>
                <form onSubmit={addUser} className="add-user-form">
                    <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Enter user name"
                        required
                    />
                    <button type="submit" className="btn btn-primary">
                        <FaPlus /> Add User
                    </button>
                </form>
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

            {/* Users List */}
            <div className="users-list-section">
                <h2><FaUser /> Users ({users.length})</h2>
                {users.length === 0 ? (
                    <div className="no-users">
                        <FaUsers />
                        <p>No users added yet. Add your first user above.</p>
                    </div>
                ) : (
                    <div className="users-grid">
                        {users.map(user => (
                            <div key={user.id} className="user-card">
                                <div className="user-info">
                                    <FaUser className="user-icon" />
                                    <h3>{user.name}</h3>
                                    <p>Total: £{calculateUserExpenses(user.name, selectedMonth).toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUserToDelete(user);
                                        setShowDeleteModal(true);
                                    }}
                                    className="btn btn-danger delete-btn"
                                >
                                    <FaTrash /> Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expense Distribution */}
            {users.length > 0 && (
                <div className="distribution-section">
                    <h2><FaChartPie /> Expense Distribution {selectedMonth && `- ${selectedMonth}`}</h2>
                    <div className="distribution-summary">
                        <div className="summary-card">
                            <h3>Total Expenses</h3>
                            <p>£{calculateTotalExpenses(selectedMonth).toFixed(2)}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Per Person</h3>
                            <p>£{(calculateTotalExpenses(selectedMonth) / users.length).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="distribution-list">
                        {calculateDistribution(selectedMonth).map((user, index) => (
                            <div key={index} className="distribution-item">
                                <span className="user-name">{user.name}</span>
                                <span className="user-total">£{user.total.toFixed(2)}</span>
                                <span className={`user-status ${user.balance > 0 ? 'receives' : user.balance < 0 ? 'pays' : 'balanced'}`}>
                                    {user.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                title="Delete User"
                message={`Are you sure you want to delete "${userToDelete?.name}"? This will also delete all associated expenses.`}
                onConfirm={deleteUser}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
} 