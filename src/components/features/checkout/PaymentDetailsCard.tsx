"use client";

import { useState } from "react";

import { CardPaymentForm } from "@/components/features/checkout/CardPaymentForm";
import type { PaymentMethod } from "@/types/checkout";

interface PaymentDetailsCardProps {
  amount: number;
  orderId: string;
}

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "bank", label: "Bank transfer" },
  { id: "wallet", label: "Wallet" },
];

export function PaymentDetailsCard({ amount, orderId }: PaymentDetailsCardProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");

  return (
    <article className="rounded-[18px] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(21,62,47,0.10)]">
      <div className="border-b border-zinc-100 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-serif text-2xl font-bold text-emerald-950">Payment details</h2>
        <p className="mt-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-[10px]">
              ✓
            </span>
            Encrypted checkout
          </span>{" "}
          · Fields marked * are required
        </p>
      </div>

      <div role="tablist" aria-label="Payment method" className="grid grid-cols-3 gap-2 px-5 pt-4 sm:px-6">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={method === item.id}
            onClick={() => setMethod(item.id)}
            className={`min-h-[46px] rounded-xl border px-2 text-sm font-bold transition ${
              method === item.id
                ? "border-emerald-950 bg-emerald-50 text-emerald-950 shadow-[inset_0_0_0_1px_theme(colors.emerald.950)]"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {method === "card" ? <CardPaymentForm amount={amount} orderId={orderId} /> : null}

        {method === "bank" ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-emerald-50/60 p-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-xl">
              ▦
            </div>
            <h3 className="mb-1.5 font-bold text-emerald-950">Pay by bank transfer</h3>
            <p className="mx-auto mb-4 max-w-sm text-sm text-zinc-600">
              We will create bank instructions valid for 30 minutes. Your order is confirmed after
              funds are received.
            </p>
            <button
              type="button"
              className="rounded-lg border border-emerald-950 bg-white px-4 py-2 text-sm font-bold text-emerald-950"
            >
              Generate transfer instructions
            </button>
          </div>
        ) : null}

        {method === "wallet" ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-emerald-50/60 p-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-xl font-bold">
              W
            </div>
            <h3 className="mb-1.5 font-bold text-emerald-950">Continue to your wallet</h3>
            <p className="mx-auto mb-4 max-w-sm text-sm text-zinc-600">
              A secure wallet window will open. Return here after authorization to complete the
              order.
            </p>
            <button
              type="button"
              className="rounded-lg border border-emerald-950 bg-white px-4 py-2 text-sm font-bold text-emerald-950"
            >
              Continue to wallet
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
