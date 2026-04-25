import React, { useEffect, useRef } from 'react';
import { WifiOff } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function NetworkStatus() {
    const isOnline = useNetworkStatus();
    const wasOffline = useRef(false);

    useEffect(() => {
        if (!isOnline) {
            wasOffline.current = true;
            return;
        }

        if (wasOffline.current) {
            toast.success('Connected');
            wasOffline.current = false;
        }
    }, [isOnline]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <Motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="fixed left-1/2 top-3 z-[60] -translate-x-1/2"
                    role="status"
                    aria-live="polite"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm">
                        <WifiOff className="h-4 w-4" aria-hidden="true" />
                        Offline Mode
                    </div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
}
