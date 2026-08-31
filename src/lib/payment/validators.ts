/**
 * Pure validation/formatting helpers for the card payment form.
 * No side effects, no DOM access — safe to use on server or client.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Luhn checksum for a 16-digit card number. */
export function luhnCheck(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber).split("").reverse().map(Number);
  if (digits.length !== 16) return false;

  const sum = digits.reduce((total, digit, index) => {
    let value = digit;
    if (index % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    return total + value;
  }, 0);

  return sum % 10 === 0;
}

export type CardBrand = "visa" | "mastercard" | "unknown";

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = onlyDigits(cardNumber);
  if (/^4\d{15}$/.test(digits)) return "visa";
  if (
    /^(5[1-5]\d{14}|2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720\d)\d{10})$/.test(digits)
  ) {
    return "mastercard";
  }
  return "unknown";
}

export function isSupportedCard(cardNumber: string): boolean {
  return detectCardBrand(cardNumber) !== "unknown";
}

export function formatCardNumber(value: string): string {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

/** Expects "MM / YY" and requires the month/year to not be in the past. */
export function isValidExpiry(value: string): boolean {
  const match = value.match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();

  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

const POSTAL_RULES: Record<string, RegExp> = {
  TH: /^\d{5}$/,
  SG: /^\d{6}$/,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  US: /^\d{5}(-\d{4})?$/,
};

export function isValidPostalCode(value: string, country: string): boolean {
  const rule = POSTAL_RULES[country];
  if (!rule) return value.trim().length >= 3;
  return rule.test(value.trim());
}
