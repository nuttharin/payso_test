import { z } from "zod";

import { isSupportedCard, isValidExpiry, isValidPostalCode, luhnCheck } from "./validators";

export const cardPaymentSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .email("Enter a valid email address."),
    cardName: z
      .string()
      .trim()
      .min(2, "Enter the cardholder name.")
      .max(60, "Cardholder name must be 60 characters or fewer."),
    cardNumber: z
      .string()
      .min(1, "Card number is required.")
      .refine((value) => luhnCheck(value) && isSupportedCard(value), {
        message: "Enter a valid Visa or Mastercard number.",
      }),
    expiry: z
      .string()
      .min(1, "Expiry date is required.")
      .refine((value) => isValidExpiry(value), {
        message: "Enter a future date in MM / YY format.",
      }),
    cvv: z.string().regex(/^\d{3}$/, "Enter the 3-digit security code."),
    country: z.string().min(1, "Select a billing country."),
    postal: z.string().min(1, "Postal code is required."),
    saveCard: z.boolean().optional(),
  })
  .refine((data) => isValidPostalCode(data.postal, data.country), {
    message: "Enter a valid postal code for the selected country.",
    path: ["postal"],
  });

export type CardPaymentFormValues = z.infer<typeof cardPaymentSchema>;
