import { CURRENCIES } from '@/lib/constants';

const CURRENCY_LOCALES = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    INR: 'en-IN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    AED: 'ar-AE',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    SGD: 'en-SG',
    NZD: 'en-NZ',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    ZAR: 'en-ZA',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    SAR: 'ar-SA',
    HKD: 'zh-HK',
};

const REGION_CURRENCIES = {
    US: 'USD',
    GB: 'GBP',
    IN: 'INR',
    CA: 'CAD',
    AU: 'AUD',
    AE: 'AED',
    JP: 'JPY',
    CN: 'CNY',
    SG: 'SGD',
    NZ: 'NZD',
    CH: 'CHF',
    SE: 'SEK',
    NO: 'NOK',
    DK: 'DKK',
    ZA: 'ZAR',
    BR: 'BRL',
    MX: 'MXN',
    SA: 'SAR',
    HK: 'HKD',
    IE: 'EUR',
    FR: 'EUR',
    DE: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
    PT: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    FI: 'EUR',
    GR: 'EUR',
};

export const DEFAULT_CURRENCY_CODE = 'GBP';

export function getBrowserLocale() {
    if (typeof navigator === 'undefined') return 'en-GB';
    return navigator.languages?.[0] || navigator.language || 'en-GB';
}

export function getCurrencyLocale(currencyCode = DEFAULT_CURRENCY_CODE) {
    return CURRENCY_LOCALES[currencyCode] ?? getBrowserLocale();
}

export function getCurrencyDef(currencyCode = DEFAULT_CURRENCY_CODE) {
    const code = currencyCode || DEFAULT_CURRENCY_CODE;
    const knownCurrency = CURRENCIES.find((currency) => currency.code === code);
    if (knownCurrency) return knownCurrency;

    return { code, label: code };
}

export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY_CODE) {
    const currency = getCurrencyDef(currencyCode);
    const parts = new Intl.NumberFormat(getCurrencyLocale(currency.code), {
        style: 'currency',
        currency: currency.code,
        currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value ?? currency.code;
}

export function getLocaleCurrency() {
    const resolvedCurrency = new Intl.NumberFormat().resolvedOptions().currency;
    if (resolvedCurrency) return resolvedCurrency;

    const locale = getBrowserLocale();
    const region = locale.match(/[-_]([A-Z]{2})\b/i)?.[1]?.toUpperCase();
    return REGION_CURRENCIES[region] ?? DEFAULT_CURRENCY_CODE;
}

export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY_CODE) {
    const currency = getCurrencyDef(currencyCode);

    return new Intl.NumberFormat(getCurrencyLocale(currency.code), {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
}
