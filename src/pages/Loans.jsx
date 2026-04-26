import React, { useEffect, useMemo, useState } from 'react';
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { Banknote, ChevronDown, ChevronUp, HandCoins, Plus, ReceiptText } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal/Modal';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/useAuth';
import { toJsDate } from '../utils/timestamps';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const initialLoanForm = {
    lenderName: '',
    totalAmount: '',
    type: 'borrowed',
};

const initialInstallmentForm = {
    amount: '',
};

const formatDate = (date) => {
    if (!date) return 'Unknown date';

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const getLoanRefPath = (installment) => {
    if (typeof installment.loanId === 'string') return installment.loanId;
    return installment.loanId?.path ?? '';
};

const getLoanProgressGradient = (percent) => {
    if (percent < 33) return 'bg-gradient-to-r from-red-500 to-orange-400';
    if (percent <= 66) return 'bg-gradient-to-r from-orange-400 to-amber-400';
    return 'bg-gradient-to-r from-emerald-400 to-teal-500';
};

export default function Loans() {
    const { user, currency } = useAuth();
    const [loans, setLoans] = useState([]);
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingLoan, setSavingLoan] = useState(false);
    const [savingInstallment, setSavingInstallment] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [activeLoanType, setActiveLoanType] = useState('borrowed');
    const [openLoanId, setOpenLoanId] = useState('');
    const [error, setError] = useState('');
    const [loanForm, setLoanForm] = useState(initialLoanForm);
    const [installmentForm, setInstallmentForm] = useState(initialInstallmentForm);

    useEffect(() => {
        if (!user?.uid) return undefined;

        setLoading(true);
        const loansRef = collection(db, 'users', user.uid, 'loans');
        const installmentsRef = collection(db, 'users', user.uid, 'loan_installments');
        const loansQuery = query(loansRef, orderBy('createdAt', 'desc'));
        const installmentsQuery = query(installmentsRef, orderBy('date', 'desc'));

        const unsubscribeLoans = onSnapshot(
            loansQuery,
            (snapshot) => {
                setLoans(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
                setLoading(false);
            },
            () => {
                toast.error('Failed to load loans');
                setLoading(false);
            }
        );

        const unsubscribeInstallments = onSnapshot(
            installmentsQuery,
            (snapshot) => {
                setInstallments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            },
            () => {
                toast.error('Failed to load loan installments');
            }
        );

        return () => {
            unsubscribeLoans();
            unsubscribeInstallments();
        };
    }, [user]);

    const installmentsByLoan = useMemo(() => {
        return installments.reduce((acc, installment) => {
            const loanPath = getLoanRefPath(installment);
            if (!loanPath) return acc;
            if (!acc[loanPath]) acc[loanPath] = [];
            acc[loanPath].push({
                ...installment,
                amount: Number(installment.amount) || 0,
                paidAt: toJsDate(installment.date),
            });
            return acc;
        }, {});
    }, [installments]);

    const loansWithProgress = useMemo(() => {
        if (!user?.uid) return [];

        return loans.map((loan) => {
            const loanPath = `users/${user.uid}/loans/${loan.id}`;
            const loanInstallments = installmentsByLoan[loanPath] ?? [];
            const totalAmount = Number(loan.totalAmount) || 0;
            const repaidAmount = loanInstallments.reduce((sum, installment) => sum + installment.amount, 0);
            const remainingAmount = Math.max(totalAmount - repaidAmount, 0);
            const progress = totalAmount > 0 ? Math.min((repaidAmount / totalAmount) * 100, 100) : 0;
            const percent = totalAmount > 0 ? Math.min(Math.round((repaidAmount / totalAmount) * 100), 100) : 0;

            return {
                ...loan,
                loanPath,
                type: loan.type === 'lent' ? 'lent' : 'borrowed',
                totalAmount,
                repaidAmount,
                remainingAmount,
                progress,
                percent,
                installments: loanInstallments,
            };
        });
    }, [installmentsByLoan, loans, user]);

    const activeLoans = useMemo(() => {
        return loansWithProgress.filter((loan) => loan.status !== 'settled' && loan.type === activeLoanType);
    }, [activeLoanType, loansWithProgress]);

    const totals = useMemo(() => {
        return activeLoans.reduce(
            (acc, loan) => {
                acc.borrowed += loan.totalAmount;
                acc.repaid += loan.repaidAmount;
                acc.remaining += loan.remainingAmount;
                return acc;
            },
            { borrowed: 0, repaid: 0, remaining: 0 }
        );
    }, [activeLoans]);

    const resetLoanModal = () => {
        setShowLoanModal(false);
        setLoanForm(initialLoanForm);
    };

    const resetInstallmentModal = () => {
        setShowInstallmentModal(false);
        setSelectedLoan(null);
        setInstallmentForm(initialInstallmentForm);
        setError('');
    };

    const handleAddLoan = async () => {
        const lenderName = loanForm.lenderName.trim();
        const totalAmount = Number(loanForm.totalAmount);

        if (!lenderName) {
            toast.error("Enter the person's name");
            return;
        }

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            toast.error('Enter a valid loan amount');
            return;
        }

        setSavingLoan(true);
        try {
            await addDoc(collection(db, 'users', user.uid, 'loans'), {
                lenderName,
                totalAmount,
                type: loanForm.type,
                createdAt: Timestamp.now(),
                status: 'active',
            });
            toast.success('Loan added');
            setActiveLoanType(loanForm.type);
            resetLoanModal();
        } catch {
            toast.error('Failed to add loan');
        } finally {
            setSavingLoan(false);
        }
    };

    const handleOpenInstallmentModal = (loan) => {
        setSelectedLoan(loan);
        setInstallmentForm(initialInstallmentForm);
        setError('');
        setShowInstallmentModal(true);
    };

    const handlePayInstallment = async () => {
        if (!selectedLoan) return;

        const amount = Number(installmentForm.amount);
        const remainingAmount = selectedLoan.totalAmount - selectedLoan.repaidAmount;
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Amount must be greater than 0.');
            return;
        }

        if (amount > remainingAmount) {
            setError('Cannot exceed the remaining balance of £' + remainingAmount.toFixed(2));
            return;
        }

        setSavingInstallment(true);
        try {
            const loanRef = doc(db, 'users', user.uid, 'loans', selectedLoan.id);
            await addDoc(collection(db, 'users', user.uid, 'loan_installments'), {
                loanId: loanRef,
                amount,
                date: Timestamp.now(),
            });

            if (selectedLoan.repaidAmount + amount >= selectedLoan.totalAmount) {
                await updateDoc(loanRef, { status: 'settled' });
            }

            toast.success('Installment recorded');
            resetInstallmentModal();
        } catch {
            toast.error('Failed to save installment');
        } finally {
            setSavingInstallment(false);
        }
    };

    const selectedLoanRemainingAmount = selectedLoan ? selectedLoan.totalAmount - selectedLoan.repaidAmount : 0;
    const selectedLoanIsLent = selectedLoan?.type === 'lent';
    const isLentTab = activeLoanType === 'lent';

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                    Loading loans...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <HandCoins className="h-8 w-8 text-primary" aria-hidden="true" />
                        Loans
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track borrowed money and repayments separately from your wallet balance.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => {
                        setLoanForm((current) => ({ ...current, type: activeLoanType }));
                        setShowLoanModal(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add New Loan
                </Button>
            </div>

            <div className="rounded-full border bg-muted/40 p-1">
                {[
                    { value: 'borrowed', label: 'Money I Owe' },
                    { value: 'lent', label: 'Money Owed To Me' },
                ].map((item) => {
                    const active = activeLoanType === item.value;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                setActiveLoanType(item.value);
                                setOpenLoanId('');
                            }}
                            className={cn(
                                'w-1/2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <Card className="border-primary/10 bg-gradient-to-br from-background to-muted/40 shadow-lg shadow-primary/5">
                <CardHeader className="items-center p-6 text-center sm:p-8">
                    <CardDescription className="text-xs font-medium uppercase tracking-[0.2em]">
                        {isLentTab ? 'Total Left To Receive' : 'Total Left To Pay'}
                    </CardDescription>
                    <CardTitle
                        className={cn(
                            'mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl',
                            isLentTab ? 'text-emerald-600' : 'text-orange-600'
                        )}
                    >
                        {formatCurrency(totals.remaining, currency)}
                    </CardTitle>
                </CardHeader>
            </Card>

            <div className="space-y-3">
                {activeLoans.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                            <Banknote className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <p className="font-medium">No active loans</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {activeLoanType === 'lent'
                                        ? 'Add money you lent to track incoming payments independently.'
                                        : 'Add a loan to start tracking repayments independently.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    activeLoans.map((loan) => {
                        const isOpen = openLoanId === loan.id;

                        return (
                            <Card
                                key={loan.id}
                                className={cn(
                                    'overflow-hidden rounded-xl transition-colors duration-300',
                                    isOpen && 'border-primary/30'
                                )}
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={`loan-${loan.id}-details`}
                                    onClick={() => setOpenLoanId(isOpen ? '' : loan.id)}
                                    className="w-full space-y-3 p-4 text-left transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <CardTitle className="truncate text-xl">{loan.lenderName}</CardTitle>
                                                <Badge variant="secondary">Active</Badge>
                                            </div>
                                            <div className="mt-1 flex items-center gap-3">
                                                <CardDescription className="min-w-0 truncate">
                                                    {loan.type === 'lent' ? 'Lent' : 'Borrowed'}{' '}
                                                    {formatCurrency(loan.totalAmount, currency)}
                                                </CardDescription>
                                                <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                                    {loan.percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <span className="mt-1 shrink-0 text-muted-foreground">
                                            {isOpen ? (
                                                <ChevronUp className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </span>
                                    </div>
                                    <Progress
                                        value={loan.percent}
                                        className="h-2.5 rounded-full"
                                        indicatorClassName={cn('rounded-full', getLoanProgressGradient(loan.percent))}
                                    />
                                </button>

                                <div
                                    id={`loan-${loan.id}-details`}
                                    aria-hidden={!isOpen}
                                    inert={!isOpen}
                                    className="grid transition-all duration-300 ease-in-out"
                                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                                >
                                    <div className="overflow-hidden">
                                        <CardContent className="space-y-4 border-t px-4 py-4 sm:px-5">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="rounded-lg border bg-muted/20 p-3">
                                                    <p className="text-xs text-muted-foreground">
                                                        {loan.type === 'lent' ? 'Received' : 'Repaid'}
                                                    </p>
                                                    <p className="mt-1 font-semibold text-emerald-600">
                                                        {formatCurrency(loan.repaidAmount, currency)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border bg-muted/20 p-3">
                                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                                    <p className="mt-1 font-semibold">
                                                        {formatCurrency(loan.remainingAmount, currency)}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={() => handleOpenInstallmentModal(loan)}
                                                className="w-full sm:w-auto"
                                            >
                                                <ReceiptText className="h-4 w-4" />
                                                {loan.type === 'lent' ? 'Receive Payment' : 'Pay Installment'}
                                            </Button>

                                            <div>
                                                <h3 className="text-sm font-medium">Installment History</h3>
                                                {loan.installments.length === 0 ? (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {loan.type === 'lent'
                                                            ? 'No payments received from this person yet.'
                                                            : 'No installments paid to this lender yet.'}
                                                    </p>
                                                ) : (
                                                    <div className="mt-3 space-y-2">
                                                        {loan.installments.map((installment) => (
                                                            <div
                                                                key={installment.id}
                                                                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                                                            >
                                                                <span className="text-muted-foreground">
                                                                    {formatDate(installment.paidAt)}
                                                                </span>
                                                                <span className="font-medium text-emerald-600">
                                                                    {formatCurrency(installment.amount, currency)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={showLoanModal}
                title="Add New Loan"
                message=""
                onConfirm={handleAddLoan}
                onCancel={resetLoanModal}
                confirmText="Add Loan"
                cancelText="Cancel"
                isConfirming={savingLoan}
                customContent={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Did you borrow or lend this money?</Label>
                            <div className="grid grid-cols-2 gap-2 rounded-full border bg-muted/40 p-1">
                                {[
                                    { value: 'borrowed', label: 'I Borrowed' },
                                    { value: 'lent', label: 'I Lent' },
                                ].map((item) => {
                                    const active = loanForm.type === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                setLoanForm((current) => ({ ...current, type: item.value }))
                                            }
                                            className={cn(
                                                'rounded-full px-3 py-2 text-sm font-medium transition-colors',
                                                active
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lender-name">Person&apos;s Name</Label>
                            <Input
                                id="lender-name"
                                value={loanForm.lenderName}
                                onChange={(event) =>
                                    setLoanForm((current) => ({ ...current, lenderName: event.target.value }))
                                }
                                placeholder="e.g. Alex"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loan-total">Total Amount</Label>
                            <Input
                                id="loan-total"
                                type="number"
                                min="0"
                                step="0.01"
                                value={loanForm.totalAmount}
                                onChange={(event) =>
                                    setLoanForm((current) => ({ ...current, totalAmount: event.target.value }))
                                }
                                placeholder="0.00"
                                inputMode="decimal"
                            />
                        </div>
                    </div>
                }
            />

            <Modal
                isOpen={showInstallmentModal}
                title={`${selectedLoanIsLent ? 'Receive Payment' : 'Pay Installment'}${
                    selectedLoan ? ` ${selectedLoanIsLent ? 'from' : 'to'} ${selectedLoan.lenderName}` : ''
                }`}
                message=""
                onConfirm={handlePayInstallment}
                onCancel={resetInstallmentModal}
                confirmText="Save Payment"
                cancelText="Cancel"
                isConfirming={savingInstallment}
                customContent={
                    <div className="space-y-4">
                        {selectedLoan && (
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">Remaining</span>
                                    <span className="font-medium text-foreground">
                                        {formatCurrency(selectedLoanRemainingAmount, currency)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="installment-amount">
                                {selectedLoanIsLent ? 'Received amount' : 'Repayment amount'}
                            </Label>
                            <Input
                                id="installment-amount"
                                type="number"
                                min="0.01"
                                max={selectedLoanRemainingAmount}
                                step="0.01"
                                value={installmentForm.amount}
                                onChange={(event) => {
                                    setError('');
                                    setInstallmentForm((current) => ({ ...current, amount: event.target.value }));
                                }}
                                placeholder="0.00"
                                inputMode="decimal"
                            />
                            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedLoanIsLent ? 'Received payments' : 'Repayments'} are saved to loan_installments
                            only and do not affect everyday transactions.
                        </p>
                    </div>
                }
            />
        </div>
    );
}
