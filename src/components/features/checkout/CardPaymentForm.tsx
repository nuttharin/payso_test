"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { PaymentSuccessModal } from "@/components/ui/PaymentSuccessModal";
import { FieldError } from "@/components/ui/FieldError";
import { ApiError } from "@/lib/api/client";
import { submitCardPayment } from "@/lib/api/payments";
import { cardPaymentSchema, type CardPaymentFormValues } from "@/lib/payment/schema";
import { detectCardBrand, formatCardNumber, formatExpiry, onlyDigits } from "@/lib/payment/validators";
import type { PaymentSuccessData } from "@/types/payment";

const COUNTRIES = [
  { value: "TH", label: "Thailand" },
  { value: "SG", label: "Singapore" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

interface CardPaymentFormProps {
  amount: number;
  orderId: string;
}

export function CardPaymentForm({ amount, orderId }: CardPaymentFormProps) {
  const [submitState, setSubmitState] = useState<"idle" | "processing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CardPaymentFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      country: "",
      postal: "",
      saveCard: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitState("processing");
    setErrorMessage(null);

    try {
      const result = await submitCardPayment({ orderId, amount, card: values });
      setSuccessData(result);
      setSubmitState("idle");
    } catch (err) {
      if (err instanceof ApiError) {
        // Map backend field errors back onto the matching form fields so
        // both layers surface validation the same way.
        for (const fieldError of err.fields) {
          if (fieldError.field in values) {
            setError(fieldError.field as keyof CardPaymentFormValues, {
              type: "server",
              message: fieldError.message,
            });
          }
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setSubmitState("error");
    }
  });

  if (successData) {
    return (
      <PaymentSuccessModal
        orderId={successData.orderId}
        receiptSentTo={successData.receiptSentTo}
        onClose={() => setSuccessData(null)}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-zinc-800">
          Email address *
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby="emailError"
          className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
          {...register("email")}
        />
        <FieldError id="emailError" message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="cardName" className="mb-1.5 block text-sm font-bold text-zinc-800">
          Name on card *
        </label>
        <input
          id="cardName"
          autoComplete="cc-name"
          placeholder="As shown on card"
          maxLength={60}
          aria-invalid={Boolean(errors.cardName)}
          aria-describedby="cardNameError"
          className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
          {...register("cardName")}
        />
        <FieldError id="cardNameError" message={errors.cardName?.message} />
      </div>

      <div>
        <label htmlFor="cardNumber" className="mb-1.5 block text-sm font-bold text-zinc-800">
          Card number *
        </label>
        <Controller
          name="cardNumber"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <input
                id="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                aria-invalid={Boolean(errors.cardNumber)}
                aria-describedby="cardNumberHelp cardNumberError"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 pr-16 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(formatCardNumber(event.target.value))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-zinc-500">
                {(() => {
                  const brand = detectCardBrand(field.value ?? "");
                  if (brand === "visa") return "VISA";
                  if (brand === "mastercard") return "MC";
                  return "CARD";
                })()}
              </span>
            </div>
          )}
        />
        <p id="cardNumberHelp" className="mt-1.5 text-xs text-zinc-500">
          Visa or Mastercard · try 4242 4242 4242 4242
        </p>
        <FieldError id="cardNumberError" message={errors.cardNumber?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expiry" className="mb-1.5 block text-sm font-bold text-zinc-800">
            Expiry date *
          </label>
          <Controller
            name="expiry"
            control={control}
            render={({ field }) => (
              <input
                id="expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                maxLength={7}
                aria-invalid={Boolean(errors.expiry)}
                aria-describedby="expiryError"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(formatExpiry(event.target.value))}
              />
            )}
          />
          <FieldError id="expiryError" message={errors.expiry?.message} />
        </div>

        <div>
          <label htmlFor="cvv" className="mb-1.5 block text-sm font-bold text-zinc-800">
            Security code *
          </label>
          <Controller
            name="cvv"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  id="cvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVV"
                  maxLength={3}
                  aria-invalid={Boolean(errors.cvv)}
                  aria-describedby="cvvError"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 pr-16 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 3))}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-zinc-500">
                  3 digits
                </span>
              </div>
            )}
          />
          <FieldError id="cvvError" message={errors.cvv?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-bold text-zinc-800">
            Billing country *
          </label>
          <select
            id="country"
            autoComplete="country"
            aria-invalid={Boolean(errors.country)}
            aria-describedby="countryError"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
            {...register("country")}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          <FieldError id="countryError" message={errors.country?.message} />
        </div>

        <div>
          <label htmlFor="postal" className="mb-1.5 block text-sm font-bold text-zinc-800">
            Postal code *
          </label>
          <input
            id="postal"
            autoComplete="postal-code"
            placeholder="Postal code"
            maxLength={10}
            aria-invalid={Boolean(errors.postal)}
            aria-describedby="postalError"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/15 aria-[invalid=true]:border-red-500"
            {...register("postal")}
          />
          <FieldError id="postalError" message={errors.postal?.message} />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-zinc-600">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-emerald-800"
          {...register("saveCard")}
        />
        <span>
          Save this card for faster checkout next time. Do not use this option on a shared device.
        </span>
      </label>

      {submitState === "error" && errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitState === "processing"}
        className="w-full rounded-xl bg-emerald-950 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-70"
      >
        {submitState === "processing" ? "Processing securely…" : `Pay $${amount.toFixed(2)}`}
      </button>
      <p className="text-center text-[11px] text-zinc-500">
        By paying, you agree to the store terms and refund policy.
      </p>
    </form>
  );
}
