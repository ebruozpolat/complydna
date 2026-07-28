import express from "express";
import { paymentMiddleware, type Network } from "x402-express";

// ---------------------------------------------------------------------------
// Config (from environment — see .env.example)
// ---------------------------------------------------------------------------
const payTo = process.env.ADDRESS as `0x${string}` | undefined;
const network = (process.env.NETWORK ?? "base-sepolia") as Network;
const port = Number(process.env.PORT ?? 4021);

if (!payTo) {
  console.error(
    "Missing ADDRESS env var — set it to the wallet address that should receive USDC payments.",
  );
  process.exit(1);
}

// Optional: point at a specific x402 facilitator. If FACILITATOR_URL is unset,
// x402-express uses the default hosted testnet facilitator
// (https://x402.org/facilitator), which verifies and settles USDC on Base Sepolia.
const facilitator = process.env.FACILITATOR_URL
  ? { url: process.env.FACILITATOR_URL as `${string}://${string}` }
  : undefined;

const app = express();

// ---------------------------------------------------------------------------
// x402 paywall: protect GET /api/quote.
// A request without a valid payment gets HTTP 402 with payment requirements;
// x402-fetch / x402-axios on the buyer side turns that into an automatic
// USDC payment and retries.
// ---------------------------------------------------------------------------
app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /api/quote": {
        price: "$0.01", // 0.01 USDC per request
        network, // "base-sepolia" (testnet)
        config: {
          description: "A single random price quote, paid per request.",
          mimeType: "application/json",
        },
      },
    },
    facilitator,
  ),
);

// ---------------------------------------------------------------------------
// The actual (paid) business logic. Only reached once payment is settled.
// ---------------------------------------------------------------------------
app.get("/api/quote", (_req, res) => {
  res.json({
    product: "WIDGET-001",
    currency: "USD",
    price: Math.round((10 + Math.random() * 90) * 100) / 100,
    quoteId: `q_${Math.random().toString(36).slice(2, 10)}`,
    validUntil: new Date(Date.now() + 5 * 60_000).toISOString(),
    generatedAt: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`x402 seller listening on http://localhost:${port}`);
  console.log(`  paid endpoint : GET http://localhost:${port}/api/quote`);
  console.log(`  network       : ${network}`);
  console.log(`  paying to     : ${payTo}`);
});
