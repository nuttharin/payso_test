import { CheckoutSection } from "@/components/features/checkout/CheckoutSection";
import { mockOrder } from "@/data/checkout-mock";

// Server Component: order data is fetched here (currently mocked) and
// passed down as props. Swap `mockOrder` for a call to the Go/Gin backend
// (e.g. GET /v1/orders/:id) once that endpoint is available.
export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <main className="mx-auto w-[min(1240px,calc(100%-32px))] py-7">
        <div className="mb-5">
          <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
            Checkout
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl">
            Payment &amp; order summary
          </h1>
        </div>

        <CheckoutSection order={mockOrder} />
      </main>
    </div>
  );
}
