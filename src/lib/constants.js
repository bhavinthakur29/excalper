/** Category id is persisted on expense documents in Firestore (`category` field). */
export const CATEGORIES = [
    { id: 'income', label: 'Salary/Income', icon: 'HandCoins', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'grocery', label: 'Grocery', icon: 'ShoppingBasket', color: 'bg-green-100 text-green-700' },
    { id: 'travel', label: 'Travel', icon: 'Plane', color: 'bg-blue-100 text-blue-700' },
    { id: 'bills', label: 'Bills', icon: 'FileText', color: 'bg-red-100 text-red-700' },
    { id: 'lending', label: 'Lending', icon: 'HandCoins', color: 'bg-purple-100 text-purple-700' },
    { id: 'other', label: 'Other', icon: 'CircleEllipsis', color: 'bg-gray-100 text-gray-700' },
];

export const DEFAULT_CATEGORY_ID = 'other';
export const INCOME_CATEGORY_ID = 'income';

export function getCategoryDef(categoryRef) {
    if (!categoryRef) {
        return CATEGORIES.find((c) => c.id === DEFAULT_CATEGORY_ID);
    }
    const byId = CATEGORIES.find((c) => c.id === categoryRef);
    if (byId) return byId;
    const byLabel = CATEGORIES.find((c) => c.label === categoryRef);
    if (byLabel) return byLabel;
    return CATEGORIES.find((c) => c.id === DEFAULT_CATEGORY_ID);
}

/** Resolve stored Firestore value (id or legacy label / payment mode) to a canonical category id. */
export function resolveCategoryId(raw) {
    const def = getCategoryDef(raw);
    return def.id;
}

export function getCategoryDisplayLabel(categoryRef) {
    return getCategoryDef(categoryRef).label;
}

/** Legacy Firestore documents did not have a type, so they are treated as expenses. */
export function getTransactionType(transaction) {
    return transaction?.type === 'income' ? 'income' : 'expense';
}
