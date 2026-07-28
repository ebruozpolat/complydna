import express, { Router } from "express";

/**
 * A tiny LOCAL x402 facilitator for the demo.
 *
 * A real facilitator (e.g. https://x402.org/facilitator or the Coinbase CDP
 * facilitator) verifies the buyer's signed USDC authorization and broadcasts
 * the on-chain `transferWithAuthorization` to actually move USDC on Base Sepolia.
 *
 * This local version implements the same HTTP contract the x402 middleware
 * speaks (`POST /verify`, `POST /settle`, `GET /supported`) but SIMULATES
 * verification and settlement in-process. That lets the demo run end-to-end
 * with zero funds and zero external network calls. No real USDC moves.
 *
 * For real on-chain settlement, set FACILITATOR_URL to a real facilitator and
 * fund the buyer wallet with test USDC.
 */
export function localFacilitator(): Router {
  const router = Router();
  router.use(express.json());

  // The middleware calls this to learn which (scheme, network) pairs are supported.
  router.get("/supported", (_req, res) => {
    res.json({
      kinds: [{ x402Version: 1, scheme: "exact", network: "base-sepolia" }],
    });
  });

  // Verify the payment payload. Real facilitators recover the signature and
  // check the on-chain USDC balance/allowance; here we accept a well-formed
  // exact-EVM payload and echo the payer.
  router.post("/verify", (req, res) => {
    const from = req.body?.paymentPayload?.payload?.authorization?.from;
    if (!from) {
      res.json({ isValid: false, invalidReason: "invalid_exact_evm_payload_authorization_value" });
      return;
    }
    console.log(`[local-facilitator] verify OK for payer ${from}`);
    res.json({ isValid: true, payer: from });
  });

  // Settle the payment. A real facilitator broadcasts a tx and returns its hash.
  // We simulate success and reuse the authorization nonce as the tx reference.
  router.post("/settle", (req, res) => {
    const auth = req.body?.paymentPayload?.payload?.authorization ?? {};
    const network = req.body?.paymentRequirements?.network ?? "base-sepolia";
    const transaction = typeof auth.nonce === "string" ? auth.nonce : `0x${"0".repeat(64)}`;
    console.log(`[local-facilitator] settle OK (simulated) for payer ${auth.from}`);
    res.json({ success: true, transaction, network, payer: auth.from });
  });

  return router;
}
