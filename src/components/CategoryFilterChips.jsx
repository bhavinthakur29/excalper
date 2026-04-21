import React from 'react';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/lib/constants';

/** `activeCategory`: `'all'` | category id */
export default function CategoryFilterChips({ activeCategory, onCategoryChange }) {
    return (
        <div
            className="flex gap-2 overflow-x-auto pb-4 no-scrollbar"
            role="tablist"
            aria-label="Filter transactions by category"
        >
            <Button
                type="button"
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => onCategoryChange('all')}
                role="tab"
                aria-selected={activeCategory === 'all'}
            >
                All
            </Button>
            {CATEGORIES.map(({ id, label }) => (
                <Button
                    key={id}
                    type="button"
                    variant={activeCategory === id ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => onCategoryChange(id)}
                    role="tab"
                    aria-selected={activeCategory === id}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
}
