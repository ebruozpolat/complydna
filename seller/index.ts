import express from "express";
import { paymentMiddleware, type Network } from "x402-express";
import { localFacilitator } from "./local-facilitator.js";

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

const app = express();

// Facilitator selection:
//   - FACILITATOR_URL set   → use that real facilitator (real on-chain USDC
//                             settlement; buyer wallet must be funded).
//   - FACILITATOR_URL unset → run the bundled LOCAL facilitator (default), so
//                             the demo completes end-to-end with no funds and
//                             no external network. See local-facilitator.ts.
const externalFacilitatorUrl = process.env.FACILITATOR_URL;
const useLocalFacilitator = !externalFacilitatorUrl;
const facilitatorUrl = (
  useLocalFacilitator ? `http://localhost:${port}/facilitator` : externalFacilitatorUrl
) as `${string}://${string}`;

if (useLocalFacilitator) {
  app.use("/facilitator", localFacilitator());
}

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
    { url: facilitatorUrl },
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
  console.log(
    `  facilitator   : ${facilitatorUrl}${useLocalFacilitator ? " (local demo — simulated settlement)" : ""}`,
  );
});
