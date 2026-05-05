export const DEFAULT_BILLING_CYCLE_START = 1;

export function normalizeBillingCycleStart(startDay) {
    const numericDay = Number(startDay);
    if (!Number.isFinite(numericDay)) return DEFAULT_BILLING_CYCLE_START;

    return Math.min(31, Math.max(1, Math.trunc(numericDay)));
}

function getLastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function getCycleDate(year, monthIndex, startDay) {
    const normalizedStartDay = normalizeBillingCycleStart(startDay);
    const day = Math.min(normalizedStartDay, getLastDayOfMonth(year, monthIndex));
    return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

export function getCurrentBillingCycle(currentDate = new Date(), startDay = DEFAULT_BILLING_CYCLE_START) {
    const date = currentDate instanceof Date ? currentDate : new Date(currentDate);
    const normalizedStartDay = normalizeBillingCycleStart(startDay);
    const currentMonthStart = getCycleDate(date.getFullYear(), date.getMonth(), normalizedStartDay);

    const cycleStart =
        date < currentMonthStart
            ? getCycleDate(date.getFullYear(), date.getMonth() - 1, normalizedStartDay)
            : currentMonthStart;
    const nextCycleStart = getCycleDate(
        cycleStart.getFullYear(),
        cycleStart.getMonth() + 1,
        normalizedStartDay
    );
    const cycleEnd = new Date(nextCycleStart.getTime() - 1);

    return {
        startDate: cycleStart,
        endDate: cycleEnd,
    };
}

export function isDateInBillingCycle(date, billingCycle) {
    return Boolean(date && date >= billingCycle.startDate && date <= billingCycle.endDate);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days from the start of today (local) until the cycle end (inclusive of partial last day via ceil).
 */
export function getDaysRemainingInCycle(endDate, now = new Date()) {
    const end = endDate instanceof Date ? new Date(endDate.getTime()) : new Date(endDate);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - startOfToday.getTime();
    if (diffMs <= 0) {
        return 0;
    }
    return Math.ceil(diffMs / MS_PER_DAY);
}

/** Billing cycle immediately before the one that contains `currentDate`. */
export function getPreviousBillingCycle(currentDate = new Date(), startDay = DEFAULT_BILLING_CYCLE_START) {
    const current = getCurrentBillingCycle(currentDate, startDay);
    const instantBeforeCurrentStart = new Date(current.startDate.getTime() - 1);
    return getCurrentBillingCycle(instantBeforeCurrentStart, startDay);
}

/** Rolling window: last 90 calendar days ending now (end of today). */
export function getLast90DaysRange(now = new Date()) {
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
}

export function isDateInRange(date, startDate, endDate) {
    if (!date) return false;
    const d = date instanceof Date ? date : new Date(date);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    return d >= start && d <= end;
}
