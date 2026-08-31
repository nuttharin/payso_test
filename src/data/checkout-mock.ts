import type { OrderSummaryData } from "@/types/checkout";

/**
 * Mock order data standing in for a real order-service call.
 * Replace with a fetch to the Go/Gin backend (see steering: backend-golang-gin)
 * once an /v1/orders/:id endpoint exists.
 */
export const mockOrder: OrderSummaryData = {
  orderId: "BK-20481",
  items: [
    {
      id: "book-quality-mindset",
      name: "The Quality Mindset",
      meta: "Hardcover · Qty 1",
      price: 39.0,
    },
  ],
  shipping: 3.9,
};
