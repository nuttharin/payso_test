export interface CouponResult {
  valid: boolean;
  discountRate: number;
  message: string;
}

/**
 * Mock coupon lookup. QA10 = 10% off. Replace with a call to the
 * Go/Gin backend (e.g. POST /v1/coupons/validate) when that endpoint exists.
 */
export function evaluateCoupon(code: string): CouponResult {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, discountRate: 0, message: "Enter a promotion code." };
  }

  if (normalized === "QA10") {
    return { valid: true, discountRate: 0.1, message: "QA10 applied successfully." };
  }

  return { valid: false, discountRate: 0, message: "This promotion code is not valid." };
}
