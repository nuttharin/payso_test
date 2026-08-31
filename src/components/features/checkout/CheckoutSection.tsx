"use client";

import { useMemo, useState } from "react";

import { OrderSummary } from "@/components/features/checkout/OrderSummary";
import { PaymentDetailsCard } from "@/components/features/checkout/PaymentDetailsCard";
import type { OrderSummaryData } from "@/types/checkout";

interface CheckoutSectionProps {
  order: OrderSummaryData;
}

/**
 * Owns the discount state shared between the order summary (coupon input)
 * and the payment form (amount charged), keeping both in sync.
 */
export function CheckoutSection({ order }: CheckoutSectionProps) {
  const [discountRate, setDiscountRate] = useState(0);

  const subtotal = useMemo(
    () => order.items.reduce((sum, item) => sum + item.price, 0),
    [order.items],
  );
  const discount = subtotal * discountRate;
  const total = subtotal - discount + order.shipping;

  return (
    <section
      aria-label="Payment sandbox"
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]"
    >
      <PaymentDetailsCard amount={total} orderId={order.orderId} />
      <OrderSummary
        order={order}
        subtotal={subtotal}
        discountRate={discountRate}
        discount={discount}
        total={total}
        onApplyCoupon={setDiscountRate}
      />
    </section>
  );
}
