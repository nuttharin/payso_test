import { apiFetch } from "@/lib/api/client";
import type { PaymentSuccessData, SubmitPaymentInput } from "@/types/payment";

/**
 * Submits a card payment to the Go/Gin backend (POST /v1/payments/card).
 * Server re-validates everything client-side validation already checked
 * (see backend/internal/service/card_validation.go) — this call is not a
 * substitute for that, just the transport.
 */
export async function submitCardPayment(input: SubmitPaymentInput): Promise<PaymentSuccessData> {
  return apiFetch<PaymentSuccessData>("/v1/payments/card", {
    method: "POST",
    body: {
      orderId: input.orderId,
      amount: input.amount,
      email: input.card.email,
      cardName: input.card.cardName,
      cardNumber: input.card.cardNumber,
      expiry: input.card.expiry,
      cvv: input.card.cvv,
      country: input.card.country,
      postal: input.card.postal,
      saveCard: input.card.saveCard ?? false,
    },
  });
}
