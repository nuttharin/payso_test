import type { CardPaymentFormValues } from "@/lib/payment/schema";

/** Payload sent to POST /api/payments. */
export interface SubmitPaymentInput {
  orderId: string;
  amount: number;
  card: CardPaymentFormValues;
}

/** `data` shape of a successful payment response. */
export interface PaymentSuccessData {
  paymentId: string;
  orderId: string;
  amount: number;
  receiptSentTo: string;
  paidAt: string;
}
