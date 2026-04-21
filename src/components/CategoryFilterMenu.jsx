import React from 'react';
import { ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function CategoryFilterForm({ selectedCategories, onChange }) {
    const toggle = (id, checked) => {
        if (checked) {
            if (!selectedCategories.includes(id)) onChange([...selectedCategories, id]);
        } else {
            onChange(selectedCategories.filter((x) => x !== id));
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm font-medium leading-none">Categories</p>
            <div className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto pr-1">
                {CATEGORIES.map(({ id, label }) => (
                    <div key={id} className="flex items-center gap-3">
                        <Checkbox
                            id={`category-filter-${id}`}
                            checked={selectedCategories.includes(id)}
                            onCheckedChange={(v) => toggle(id, v === true)}
                            aria-labelledby={`category-filter-label-${id}`}
                        />
                        <Label
                            id={`category-filter-label-${id}`}
                            htmlFor={`category-filter-${id}`}
                            className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {label}
                        </Label>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([])}>
                Clear Filters
            </Button>
        </div>
    );
}

export default function CategoryFilterMenu({ selectedCategories, onChange }) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const filtersActive = selectedCategories.length > 0;

    const triggerButton = (
        <Button type="button" variant="outline" size="sm" className={cn('relative gap-1.5')}>
            <ListFilter className="size-4 shrink-0" aria-hidden />
            Filter
            {filtersActive ? (
                <span
                    className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background"
                    aria-hidden
                />
            ) : null}
            {filtersActive ? <span className="sr-only">Filters active</span> : null}
        </Button>
    );

    const body = (
        <CategoryFilterForm selectedCategories={selectedCategories} onChange={onChange} />
    );

    if (isDesktop) {
        return (
            <Popover>
                <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                    {body}
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="px-0 pt-0">
                <DrawerHeader className="border-b px-4 pb-4 text-left">
                    <DrawerTitle>Filter by category</DrawerTitle>
                    <DrawerDescription className="text-left">
                        Choose which categories appear in the list below.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-6 pt-4">{body}</div>
            </DrawerContent>
        </Drawer>
    );
}
