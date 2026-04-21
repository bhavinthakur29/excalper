import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaChartPie, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaBalanceScale, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import './Contributions.css';

export default function Contributions() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [monthlyExpenses, setMonthlyExpenses] = useState({});
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [showSettlementHistory, setShowSettlementHistory] = useState(false);

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

            // Fetch settlements
            const settlementsRef = collection(db, 'users', user.uid, 'settlements');
            const settlementsQuery = query(settlementsRef, orderBy('timestamp', 'desc'));
            const settlementsSnapshot = await getDocs(settlementsQuery);
            const settlementsList = settlementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            }));
            setSettlements(settlementsList);

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

    const calculateUserSettlements = (userName, monthFilter = '') => {
        let userSettlements = settlements.filter(s => s.fromUser === userName || s.toUser === userName);

        if (monthFilter) {
            userSettlements = userSettlements.filter(s => {
                const settlementMonth = s.date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return settlementMonth === monthFilter;
            });
        }

        // Calculate net settlement (received - paid)
        const received = userSettlements
            .filter(s => s.toUser === userName)
            .reduce((sum, s) => sum + s.amount, 0);
        const paid = userSettlements
            .filter(s => s.fromUser === userName)
            .reduce((sum, s) => sum + s.amount, 0);

        return received - paid;
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
            const userSettlements = calculateUserSettlements(user.name, monthFilter);
            const expenseBalance = userTotal - perPerson;
            const finalBalance = expenseBalance - userSettlements; // Subtract settlements from balance

            return {
                name: user.name,
                total: userTotal,
                settlements: userSettlements,
                expenseBalance,
                balance: finalBalance,
                status: finalBalance > 0 ? `Receives £${finalBalance.toFixed(2)}` :
                    finalBalance < 0 ? `Pays £${Math.abs(finalBalance).toFixed(2)}` : 'No dues'
            };
        });
    };

    const handleSettle = async (settlementData) => {
        try {
            await addDoc(collection(db, 'users', user.uid, 'settlements'), {
                ...settlementData,
                timestamp: serverTimestamp(),
                status: 'completed'
            });
            toast.success('Settlement recorded successfully!');
            setShowSettlementModal(false);
            setSelectedSettlement(null);
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to record settlement');
        }
    };

    const settleAllBalances = async () => {
        const distribution = calculateDistribution(selectedMonth);
        const debtors = distribution
            .filter((d) => d.balance < -0.01)
            .map((d) => ({ name: d.name, amount: Math.abs(d.balance) }))
            .sort((a, b) => b.amount - a.amount);

        const creditors = distribution
            .filter((d) => d.balance > 0.01)
            .map((d) => ({ name: d.name, amount: d.balance }))
            .sort((a, b) => b.amount - a.amount);

        if (!debtors.length || !creditors.length) {
            toast.info('No outstanding balances to settle.');
            return;
        }

        const newSettlements = [];

        // Greedy simplification: always match the largest debtor and creditor until residuals are near zero.
        while (debtors.length && creditors.length) {
            const debtor = debtors[0];
            const creditor = creditors[0];

            const settleAmount = Math.min(debtor.amount, creditor.amount);

            newSettlements.push({
                fromUser: debtor.name,
                toUser: creditor.name,
                amount: Number(settleAmount.toFixed(2)),
                description: `Settlement for ${selectedMonth || 'all expenses'}`,
                timestamp: serverTimestamp(),
                status: 'completed'
            });

            debtor.amount = Number((debtor.amount - settleAmount).toFixed(2));
            creditor.amount = Number((creditor.amount - settleAmount).toFixed(2));

            if (debtor.amount <= 0.01) debtors.shift();
            if (creditor.amount <= 0.01) creditors.shift();

            debtors.sort((a, b) => b.amount - a.amount);
            creditors.sort((a, b) => b.amount - a.amount);
        }

        try {
            const batch = writeBatch(db);
            newSettlements.forEach((settlement) => {
                const settlementRef = doc(collection(db, 'users', user.uid, 'settlements'));
                batch.set(settlementRef, settlement);
            });

            await batch.commit();
            toast.success(`Created ${newSettlements.length} settlement(s).`);
            fetchData();
        } catch (error) {
            toast.error('Failed to settle balances');
        }
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
                    <div className="distribution-header">
                        <h2><FaChartPie /> Expense Distribution {selectedMonth && `- ${selectedMonth}`}</h2>
                        <div className="distribution-actions">
                            <button
                                onClick={() => setShowSettlementHistory(true)}
                                className="btn btn-secondary"
                            >
                                <FaHistory /> Settlement History
                            </button>
                            {users.length > 1 && (
                                <button
                                    onClick={settleAllBalances}
                                    className="btn btn-primary"
                                >
                                    <FaCheckCircle /> Settle All
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="distribution-table">
                        <div className="table-header">
                            <span>Person</span>
                            <span>Total Spent</span>
                            <span>Settlements</span>
                            <span>Balance</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>

                        {calculateDistribution(selectedMonth).map((user, index) => (
                            <div key={index} className="table-row">
                                <span className="user-name">{user.name}</span>
                                <span className="user-total">£{user.total.toFixed(2)}</span>
                                <span className="user-settlements">
                                    {user.settlements > 0 ? '+' : ''}£{user.settlements.toFixed(2)}
                                </span>
                                <span className={`user-balance ${user.balance > 0 ? 'positive' : user.balance < 0 ? 'negative' : 'neutral'}`}>
                                    {user.balance > 0 ? '+' : ''}£{user.balance.toFixed(2)}
                                </span>
                                <span className={`user-status ${user.balance > 0 ? 'receives' : user.balance < 0 ? 'pays' : 'balanced'}`}>
                                    {user.status}
                                </span>
                                <div className="settlement-actions">
                                    {user.balance < 0 && (
                                        <button
                                            onClick={() => {
                                                // Find someone who is owed money
                                                const distribution = calculateDistribution(selectedMonth);
                                                const creditor = distribution.find(d => d.balance > 0);
                                                if (creditor) {
                                                    setSelectedSettlement({
                                                        fromUser: user.name,
                                                        toUser: creditor.name,
                                                        amount: Math.abs(user.balance),
                                                        description: `Settlement for ${selectedMonth || 'expenses'}`
                                                    });
                                                    setShowSettlementModal(true);
                                                }
                                            }}
                                            className="btn btn-primary btn-sm"
                                        >
                                            <FaCheckCircle /> Settle
                                        </button>
                                    )}
                                </div>
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
                    <h2><FaBalanceScale /> Settlement Information</h2>
                    <div className="settlement-info">
                        <p>
                            <strong>How settlements work:</strong> When someone settles a debt, it reduces their balance.
                            Positive settlements mean money received, negative means money paid.
                        </p>
                        <p>
                            <strong>Current system:</strong> All settlements are recorded and tracked.
                            You can view settlement history and manually settle individual debts or use "Settle All"
                            to automatically settle all outstanding balances.
                        </p>
                    </div>
                </div>
            )}

            {/* Settlement Modal */}
            {showSettlementModal && selectedSettlement && (
                <Modal
                    isOpen={showSettlementModal}
                    title="Record Settlement"
                    onClose={() => {
                        setShowSettlementModal(false);
                        setSelectedSettlement(null);
                    }}
                >
                    <div className="settlement-modal-content">
                        <div className="settlement-details">
                            <p><strong>From:</strong> {selectedSettlement.fromUser}</p>
                            <p><strong>To:</strong> {selectedSettlement.toUser}</p>
                            <p><strong>Amount:</strong> £{selectedSettlement.amount.toFixed(2)}</p>
                            <p><strong>Description:</strong> {selectedSettlement.description}</p>
                        </div>
                        <div className="settlement-modal-actions">
                            <button
                                onClick={() => handleSettle(selectedSettlement)}
                                className="btn btn-primary"
                            >
                                <FaCheckCircle /> Confirm Settlement
                            </button>
                            <button
                                onClick={() => {
                                    setShowSettlementModal(false);
                                    setSelectedSettlement(null);
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Settlement History Modal */}
            {showSettlementHistory && (
                <Modal
                    isOpen={showSettlementHistory}
                    title="Settlement History"
                    onClose={() => setShowSettlementHistory(false)}
                >
                    <div className="settlement-history-content">
                        {settlements.length === 0 ? (
                            <p>No settlements recorded yet.</p>
                        ) : (
                            <div className="settlements-list">
                                {settlements.map(settlement => (
                                    <div key={settlement.id} className="settlement-item">
                                        <div className="settlement-info">
                                            <span className="settlement-users">
                                                {settlement.fromUser} → {settlement.toUser}
                                            </span>
                                            <span className="settlement-amount">
                                                £{settlement.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="settlement-details">
                                            <span className="settlement-description">
                                                {settlement.description}
                                            </span>
                                            <span className="settlement-date">
                                                {formatDate(settlement.date)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
} 