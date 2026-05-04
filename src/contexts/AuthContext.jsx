import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { DEFAULT_CURRENCY_CODE, getCurrencyDef, getLocaleCurrency } from '@/lib/currency';
import { DEFAULT_BILLING_CYCLE_START, normalizeBillingCycleStart } from '@/utils/billingCycle';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY_CODE);
    const [billingCycleStart, setBillingCycleStart] = useState(DEFAULT_BILLING_CYCLE_START);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
            setUser(nextUser);

            if (!nextUser) {
                setCurrency(DEFAULT_CURRENCY_CODE);
                setBillingCycleStart(DEFAULT_BILLING_CYCLE_START);
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, 'users', nextUser.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? userSnap.data() : {};
                const savedCurrency = userData.currency;
                const savedBillingCycleStart = normalizeBillingCycleStart(userData.billingCycleStart);
                const profileUpdates = {};

                setBillingCycleStart(savedBillingCycleStart);
                if (userData.billingCycleStart !== savedBillingCycleStart) {
                    profileUpdates.billingCycleStart = savedBillingCycleStart;
                }

                if (savedCurrency) {
                    setCurrency(savedCurrency);
                } else {
                    const detectedCurrency = getLocaleCurrency();
                    setCurrency(detectedCurrency);
                    profileUpdates.currency = detectedCurrency;
                    toast.info(
                        `We've set your currency to ${getCurrencyDef(detectedCurrency).label} based on your location.`
                    );
                }

                if (Object.keys(profileUpdates).length > 0) {
                    await setDoc(userRef, profileUpdates, { merge: true });
                }
            } catch (error) {
                console.error('Failed to load user preferences:', error);
                setCurrency(DEFAULT_CURRENCY_CODE);
                setBillingCycleStart(DEFAULT_BILLING_CYCLE_START);
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const logout = () => signOut(auth);
    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
    const updateCurrency = async (currencyCode) => {
        if (!user?.uid) return;

        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { currency: currencyCode }, { merge: true });
        setCurrency(currencyCode);
    };
    const updateBillingCycleStart = async (startDay) => {
        if (!user?.uid) return;

        const normalizedStartDay = normalizeBillingCycleStart(startDay);
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { billingCycleStart: normalizedStartDay }, { merge: true });
        setBillingCycleStart(normalizedStartDay);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                currency,
                billingCycleStart,
                updateCurrency,
                updateBillingCycleStart,
                logout,
                loginWithGoogle,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
} 