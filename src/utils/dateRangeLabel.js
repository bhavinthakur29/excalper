/** @param {Date|string|number} date */
export function formatShortDay(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Human-readable span, e.g. "Apr 25 - May 24".
 * @param {Date|string|number} startDate
 * @param {Date|string|number} endDate
 */
export function formatShortDateRange(startDate, endDate) {
    return `${formatShortDay(startDate)} - ${formatShortDay(endDate)}`;
}
