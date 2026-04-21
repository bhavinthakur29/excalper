import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Optional navigation card (not currently used in routes). Styled with shadcn + Tailwind.
 */
export default function NavCard({ link, icon: Icon, name, className, color: _legacyColor }) {
    return (
        <Link to={link} className="block min-w-0">
            <Card
                className={cn(
                    'transition-shadow hover:shadow-md',
                    className
                )}
            >
                <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg text-primary">
                        <Icon />
                    </div>
                    <h3 className="font-semibold leading-tight text-foreground">{name}</h3>
                </div>
            </Card>
        </Link>
    );
}
