import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

const items = [
    { path: '/', label: 'Home', Icon: Home, match: (p) => p === '/' },
    {
        path: '/expenses',
        label: 'Expenses',
        Icon: CreditCard,
        match: (p) => p === '/expenses' || p === '/expense-form',
    },
    { path: '/settings', label: 'Settings', Icon: Settings, match: (p) => p === '/settings' },
];

export default function BottomNav() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden"
            role="navigation"
            aria-label="Primary"
        >
            {items.map(({ path, label, Icon, match }) => {
                const active = match(location.pathname);
                return (
                    <Link
                        key={path}
                        to={path}
                        className={cn(
                            'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[0.7rem] font-medium transition-colors',
                            active
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                        aria-current={active ? 'page' : undefined}
                    >
                        <Icon
                            className={cn('h-5 w-5 shrink-0', active && 'text-primary')}
                            strokeWidth={active ? 2.25 : 1.75}
                            aria-hidden="true"
                        />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
