import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { DEFAULT_CURRENCY_CODE, getCurrencyDef, getLocaleCurrency } from '@/lib/currency';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY_CODE);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
            setUser(nextUser);

            if (!nextUser) {
                setCurrency(DEFAULT_CURRENCY_CODE);
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, 'users', nextUser.uid);
                const userSnap = await getDoc(userRef);
                const savedCurrency = userSnap.exists() ? userSnap.data().currency : null;

                if (savedCurrency) {
                    setCurrency(savedCurrency);
                } else {
                    const detectedCurrency = getLocaleCurrency();
                    setCurrency(detectedCurrency);
                    await setDoc(userRef, { currency: detectedCurrency }, { merge: true });
                    toast.info(
                        `We've set your currency to ${getCurrencyDef(detectedCurrency).label} based on your location.`
                    );
                }
            } catch (error) {
                console.error('Failed to load currency preference:', error);
                setCurrency(DEFAULT_CURRENCY_CODE);
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

    return (
        <AuthContext.Provider value={{ user, loading, currency, updateCurrency, logout, loginWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
} 