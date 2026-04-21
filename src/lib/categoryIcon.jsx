import {
    CircleEllipsis,
    FileText,
    HandCoins,
    Plane,
    ShoppingBasket,
} from 'lucide-react';
import { getCategoryDef } from '@/lib/constants';

const ICONS = {
    ShoppingBasket,
    FileText,
    Plane,
    HandCoins,
    CircleEllipsis,
};

/**
 * @param {string} categoryRef — Stored category id, or legacy label string.
 */
export function CategoryIcon({ categoryRef, size = 18, className, ...props }) {
    const def = getCategoryDef(categoryRef);
    const IconComponent = ICONS[def.icon] ?? CircleEllipsis;
    return (
        <IconComponent className={className} size={size} strokeWidth={2} aria-hidden {...props} />
    );
}
