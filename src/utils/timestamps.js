export function toJsDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return null;
    }
    return timestamp.toDate();
}

export function monthKeyFromTimestamp(timestamp) {
    const date = toJsDate(timestamp);
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

