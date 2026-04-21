import React from 'react';

/**
 * Full-width skeleton for auth-gated loading; styles mirror the Home dashboard.
 */
export default function Loading() {
    return (
        <section
            className="w-full space-y-4 py-2"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading content"
        >
            <div className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-56 animate-pulse rounded bg-muted/70" />
                    </div>
                </div>
                <div className="mt-6 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted/60" />
                    <div className="h-10 w-36 animate-pulse rounded bg-muted" />
                </div>
            </div>
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted/80" />
            <div className="space-y-2 overflow-hidden rounded-xl border bg-card p-0 shadow-sm">
                <div className="h-10 animate-pulse bg-muted/40" />
                <div className="h-16 animate-pulse border-b bg-muted/20" />
                <div className="h-16 animate-pulse border-b bg-muted/20" />
                <div className="h-16 animate-pulse bg-muted/20" />
            </div>
        </section>
    );
}
