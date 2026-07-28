import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";

// ---------------------------------------------------------------------------
// Config (from environment — see .env.example)
// ---------------------------------------------------------------------------
const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const url = process.env.RESOURCE_URL ?? "http://localhost:4021/api/quote";

if (!privateKey) {
  console.error(
    "Missing PRIVATE_KEY env var — set it to your Base Sepolia TEST wallet private key.",
  );
  process.exit(1);
}

// A viem local account is a valid x402 signer. x402 only needs it to sign the
// USDC payment authorization (EIP-3009); the target network (Base Sepolia) and
// asset (USDC) come from the seller's 402 response, not from the account.
const account = privateKeyToAccount(privateKey);

// Wrap fetch so that a 402 response is answered automatically:
//   1. read the payment requirements from the 402,
//   2. sign a USDC payment with the wallet,
//   3. retry the request with the X-PAYMENT header.
const fetchWithPay = wrapFetchWithPayment(fetch, account);

console.log(`Requesting ${url}`);
console.log(`Paying as   ${account.address} (Base Sepolia)\n`);

try {
  const response = await fetchWithPay(url, { method: "GET" });
  const body = await response.json();

  if (!response.ok) {
    // Still not OK after paying — usually an unfunded wallet or a facilitator
    // that couldn't verify/settle the payment.
    console.error(`Payment did not settle (HTTP ${response.status}). Response:`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("Paid request succeeded. Response body:");
  console.log(JSON.stringify(body, null, 2));

  // The facilitator returns a settlement receipt in this header.
  const settlement = response.headers.get("x-payment-response");
  if (settlement) {
    console.log("\nSettlement receipt (x-payment-response, base64):");
    console.log(settlement);
  }
} catch (error) {
  console.error(
    "\nRequest failed:",
    error instanceof Error ? error.message : error,
  );
  console.error(
    "Common causes: seller not running, wallet has no test USDC, or wrong RESOURCE_URL.",
  );
  process.exit(1);
}
