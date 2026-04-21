import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaHistory, FaTrash, FaFilter, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import { toJsDate, monthKeyFromTimestamp } from '../utils/timestamps';
import './SettlementHistory.css';

export default function SettlementHistory() {
    const { user } = useAuth();
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [settlementToDelete, setSettlementToDelete] = useState(null);
    const [monthlySettlements, setMonthlySettlements] = useState({});
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalSettlements: 0,
        totalAmount: 0,
        averageAmount: 0,
        uniqueUsers: 0
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        calculateStats();
    }, [settlements, selectedMonth, selectedUser]);

    const fetchData = async () => {
        try {
            // Fetch settlements
            const settlementsRef = collection(db, 'users', user.uid, 'settlements');
            const settlementsQuery = query(settlementsRef, orderBy('timestamp', 'desc'));
            const settlementsSnapshot = await getDocs(settlementsQuery);
            const settlementsList = settlementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: toJsDate(doc.data().timestamp),
            }));
            setSettlements(settlementsList);

            // Group settlements by month
            const grouped = settlementsList.reduce((acc, settlement) => {
                const month = monthKeyFromTimestamp(settlement.timestamp);
                if (!month) return acc;
                if (!acc[month]) acc[month] = [];
                acc[month].push(settlement);
                return acc;
            }, {});
            setMonthlySettlements(grouped);

            // Fetch users
            const usersRef = collection(db, 'users', user.uid, 'people');
            const usersSnapshot = await getDocs(usersRef);
            const usersList = usersSnapshot.docs.map(doc => doc.data().name);
            setUsers(usersList.sort());

        } catch (error) {
            toast.error('Failed to fetch settlement data');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        let filteredSettlements = settlements;

        if (selectedMonth) {
            filteredSettlements = filteredSettlements.filter(s => {
                const settlementMonth = monthKeyFromTimestamp(s.timestamp);
                return settlementMonth === selectedMonth;
            });
        }

        if (selectedUser) {
            filteredSettlements = filteredSettlements.filter(s =>
                s.fromUser === selectedUser || s.toUser === selectedUser
            );
        }

        const totalSettlements = filteredSettlements.length;
        const totalAmount = filteredSettlements.reduce((sum, s) => sum + s.amount, 0);
        const averageAmount = totalSettlements > 0 ? totalAmount / totalSettlements : 0;

        // Count unique users involved
        const uniqueUsers = new Set();
        filteredSettlements.forEach(s => {
            uniqueUsers.add(s.fromUser);
            uniqueUsers.add(s.toUser);
        });

        setStats({
            totalSettlements,
            totalAmount,
            averageAmount,
            uniqueUsers: uniqueUsers.size
        });
    };

    const getFilteredSettlements = () => {
        let filtered = settlements;

        if (selectedMonth) {
            filtered = filtered.filter(s => {
                const settlementMonth = monthKeyFromTimestamp(s.timestamp);
                return settlementMonth === selectedMonth;
            });
        }

        if (selectedUser) {
            filtered = filtered.filter(s =>
                s.fromUser === selectedUser || s.toUser === selectedUser
            );
        }

        return filtered;
    };

    const deleteSettlement = async () => {
        if (!settlementToDelete) return;

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'settlements', settlementToDelete.id));
            toast.success('Settlement deleted successfully');
            setShowDeleteModal(false);
            setSettlementToDelete(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete settlement');
        }
    };

    const availableMonths = Object.keys(monthlySettlements).sort((a, b) => b.localeCompare(a));

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        if (!year || !month) return monthKey;
        return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="settlement-history-container">
                <div className="loading-spinner">Loading settlement history...</div>
            </div>
        );
    }

    return (
        <div className="settlement-history-container">
            <div className="settlement-history-header">
                <h1><FaHistory /> Settlement History</h1>
                <p>Track all settlements and payment history</p>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <h2><FaFilter /> Filters</h2>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Month:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Months</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{formatMonthLabel(month)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>User:</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Users</option>
                            {users.map(userName => (
                                <option key={userName} value={userName}>{userName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaHistory />
                    </div>
                    <div className="stat-content">
                        <h3>Total Settlements</h3>
                        <p>{stats.totalSettlements}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-content">
                        <h3>Total Amount</h3>
                        <p>£{stats.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaChartBar />
                    </div>
                    <div className="stat-content">
                        <h3>Average Amount</h3>
                        <p>£{stats.averageAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <div className="stat-content">
                        <h3>Users Involved</h3>
                        <p>{stats.uniqueUsers}</p>
                    </div>
                </div>
            </div>

            {/* Settlements List */}
            <div className="settlements-section">
                <h2><FaHistory /> Settlements {selectedMonth && `- ${formatMonthLabel(selectedMonth)}`} {selectedUser && `- ${selectedUser}`}</h2>

                {getFilteredSettlements().length === 0 ? (
                    <div className="no-settlements">
                        <FaHistory />
                        <h3>No Settlements Found</h3>
                        <p>No settlements match your current filters.</p>
                    </div>
                ) : (
                    <div className="settlements-list">
                        {getFilteredSettlements().map(settlement => (
                            <div key={settlement.id} className="settlement-card">
                                <div className="settlement-main">
                                    <div className="settlement-users">
                                        <span className="from-user">{settlement.fromUser}</span>
                                        <span className="arrow">→</span>
                                        <span className="to-user">{settlement.toUser}</span>
                                    </div>
                                    <div className="settlement-amount">
                                        £{settlement.amount.toFixed(2)}
                                    </div>
                                </div>
                                <div className="settlement-details">
                                    <div className="settlement-info">
                                        <span className="settlement-description">
                                            {settlement.description}
                                        </span>
                                        <span className="settlement-date">
                                            <FaCalendarAlt /> {formatDate(settlement.date)}
                                        </span>
                                    </div>
                                    <div className="settlement-actions">
                                        <button
                                            onClick={() => {
                                                setSettlementToDelete(settlement);
                                                setShowDeleteModal(true);
                                            }}
                                            className="btn btn-danger btn-sm"
                                            title="Delete settlement"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                title="Delete Settlement"
                message={`Are you sure you want to delete this settlement? This action cannot be undone.`}
                onConfirm={deleteSettlement}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSettlementToDelete(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
} 