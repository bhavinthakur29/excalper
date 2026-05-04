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
