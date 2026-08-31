"use client";

import { useState } from "react";

import { evaluateCoupon } from "@/lib/payment/coupon";
import type { OrderSummaryData } from "@/types/checkout";

interface OrderSummaryProps {
  order: OrderSummaryData;
  subtotal: number;
  discountRate: number;
  discount: number;
  total: number;
  onApplyCoupon: (rate: number) => void;
}

export function OrderSummary({
  order,
  subtotal,
  discountRate,
  discount,
  total,
  onApplyCoupon,
}: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function applyCoupon() {
    const result = evaluateCoupon(couponCode);
    onApplyCoupon(result.discountRate);
    setCouponMessage({ text: result.message, ok: result.valid });
  }

  return (
    <aside
      aria-label="Order summary"
      className="sticky top-[86px] rounded-[18px] border border-zinc-200 bg-white shadow-[0_12px_38px_rgba(21,62,47,0.08)]"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold text-emerald-950">Order summary</h2>
          <span className="font-mono text-[11px] text-zinc-500">#{order.orderId}</span>
        </div>

        <ul className="space-y-4">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-zinc-100 pb-4"
            >
              <div className="grid h-[67px] w-[58px] place-items-center rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950 font-serif text-lg italic font-bold text-amber-100">
                Q/A
              </div>
              <div>
                <div className="text-sm font-bold leading-snug text-zinc-900">{item.name}</div>
                <div className="text-xs text-zinc-500">{item.meta}</div>
              </div>
              <div className="text-sm font-extrabold text-zinc-900">${item.price.toFixed(2)}</div>
            </li>
          ))}
        </ul>

        <div className="my-4 grid grid-cols-[1fr_auto] gap-2">
          <label className="sr-only" htmlFor="coupon">
            Promotion code
          </label>
          <input
            id="coupon"
            placeholder="Promotion code"
            autoComplete="off"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyCoupon();
              }
            }}
            className="min-w-0 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15"
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="rounded-xl border border-zinc-300 px-3.5 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
          >
            Apply
          </button>
          {couponMessage ? (
            <p
              className={`col-span-2 -mt-0.5 text-xs ${
                couponMessage.ok ? "text-emerald-700" : "text-red-600"
              }`}
              aria-live="polite"
            >
              {couponMessage.text}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2.5 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Shipping</span>
            <span>${order.shipping.toFixed(2)}</span>
          </div>
          {discountRate > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Discount ({Math.round(discountRate * 100)}%)</span>
              <span>−${discount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="mt-0.5 flex justify-between border-t border-zinc-200 pt-3 text-lg font-extrabold text-zinc-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
