import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { cn } from '@/lib/utils';

const links = [
    { path: '/', label: 'Home' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/loans', label: 'Loans' },
    { path: '/settings', label: 'Settings' },
];

const linkClass = (active) =>
    cn(
        'text-sm font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    );

export default function Navbar() {
    const { user } = useAuth();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!user) return null;

    const headerClass = cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isScrolled && 'shadow-sm'
    );

    return (
        <nav className={headerClass} role="navigation" aria-label="Main">
            <div className="container flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6 md:px-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 font-semibold text-foreground"
                    aria-label="Excalper Home"
                >
                    <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span>Excalper</span>
                </Link>

                <div className="hidden gap-6 sm:flex" role="menubar">
                    {links.map(({ path, label }) => {
                        const p = location.pathname;
                        const active =
                            path === '/'
                                ? p === '/'
                                : path === '/expenses'
                                  ? p === '/expenses' || p === '/expense-form'
                                  : p === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={linkClass(!!active)}
                                role="menuitem"
                                aria-current={active ? 'page' : undefined}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
