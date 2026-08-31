export type PaymentMethod = "card" | "bank" | "wallet";

export interface OrderLineItem {
  id: string;
  name: string;
  meta: string;
  price: number;
}

export interface OrderSummaryData {
  orderId: string;
  items: OrderLineItem[];
  shipping: number;
}

export type ProviderScenario = "approved" | "declined" | "network" | "duplicate";
