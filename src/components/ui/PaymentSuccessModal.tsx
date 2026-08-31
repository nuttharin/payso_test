"use client";

import { useEffect, useRef } from "react";

interface PaymentSuccessModalProps {
  orderId: string;
  receiptSentTo: string;
  onClose: () => void;
}

/**
 * Mirrors the "Payment approved" success dialog from the QA exercise
 * reference (successModal): role="dialog", aria-modal, a heading, a
 * confirmation message, and a single dismiss action.
 */
export function PaymentSuccessModal({ orderId, receiptSentTo, onClose }: PaymentSuccessModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/60 p-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="successTitle"
        className="w-full max-w-[470px] rounded-[20px] bg-white p-7 text-center shadow-2xl"
      >
        <div className="mx-auto mb-4 grid h-[58px] w-[58px] place-items-center rounded-full bg-emerald-50 text-2xl font-black text-emerald-700">
          ✓
        </div>
        <h2 id="successTitle" className="mb-1.5 font-serif text-[28px] font-bold leading-tight text-emerald-950">
          การชำระเงินสำเร็จ
        </h2>
        <p className="text-zinc-600">
          คำสั่งซื้อ <strong>#{orderId}</strong> ได้รับการยืนยันแล้ว ใบเสร็จถูกส่งไปยัง{" "}
          <strong>{receiptSentTo}</strong>
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="mt-5 min-w-[130px] rounded-xl border border-zinc-300 bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900"
        >
          ปิดหน้าต่างนี้
        </button>
      </div>
    </div>
  );
}
