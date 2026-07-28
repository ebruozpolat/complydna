# x402 minimal demo — Base Sepolia + USDC

A tiny end-to-end demo of the [x402 payment protocol](https://x402.org): an API
that returns **HTTP 402 Payment Required** until it's paid, and a client that
catches the 402 and pays automatically with a testnet wallet.

- **`seller/`** — an Express API with a single endpoint, `GET /api/quote`,
  protected by the [`x402-express`](https://www.npmjs.com/package/x402-express)
  middleware. No payment → `402`. Valid payment → a JSON quote.
- **`buyer/`** — a script using [`x402-fetch`](https://www.npmjs.com/package/x402-fetch)
  that calls the endpoint, catches the `402`, signs a USDC payment with a Base
  Sepolia test wallet, retries, and prints the result.

Everything targets **USDC on the Base Sepolia testnet**, so nothing here touches
real money.

```
buyer  ──GET /api/quote──▶  seller
       ◀──── 402 + payment requirements ────
buyer  ─sign USDC payment (EIP-3009)─▶ retry with X-PAYMENT header
                     seller ──verify+settle──▶ facilitator ──▶ Base Sepolia
       ◀──── 200 + JSON quote + settlement receipt ────
```

## Two ways to run it

| Mode | Facilitator | Funds needed | Use it for |
| ---- | ----------- | ------------ | ---------- |
| **Local demo** (default) | Bundled local facilitator (`seller/local-facilitator.ts`) | **None** | Seeing the full `402 → pay → 200` flow work instantly, offline. Verification/settlement are **simulated in-process — no real USDC moves.** |
| **Real on-chain** | A real facilitator via `FACILITATOR_URL` | Test USDC in the buyer wallet | Actually moving test USDC on Base Sepolia. |

The default is **local demo mode**, so `npm start` on both sides just works — no
faucet, no wallet funding, no external network. Switch to real settlement by
setting `FACILITATOR_URL` (see [Real on-chain settlement](#real-on-chain-settlement)).

> **How does the buyer pay without gas?** With the x402 *exact* EVM scheme the
> buyer only **signs** a USDC transfer authorization (EIP-3009) — the name,
> version and amount all come from the seller's 402 response, so signing needs
> no chain access. The facilitator submits the on-chain transaction, so even in
> real mode the buyer wallet needs **test USDC** but generally **no ETH for gas**.

---

## Prerequisites

- **Node.js 20+** (the run scripts use Node's built-in `--env-file`).
- A Base Sepolia wallet address to **receive** payments (seller).
- For **real on-chain** mode only: a Base Sepolia test wallet funded with **test
  USDC**. Local demo mode needs no funds.

---

## Quick start (local demo mode, no funds)

```bash
# Terminal A
cd seller && npm install && cp .env.example .env
#   → set ADDRESS in .env to any 0x address that should "receive" payments
npm start

# Terminal B
cd buyer && npm install && npm run generate-wallet
#   → copy PRIVATE_KEY into buyer/.env (cp .env.example .env first)
npm start
```

You should see the buyer print a `200` JSON quote and a settlement receipt. No
faucet needed. The sections below cover wallet creation, the faucet, and real
on-chain settlement in more detail.

---

## 1. Create a test wallet (buyer)

You need a throwaway keypair for the buyer. Generate one with the included helper:

```bash
cd buyer
npm install
npm run generate-wallet
```

It prints something like:

```
PRIVATE_KEY=0xabc123...
ADDRESS    =0xF39F...2266
```

- Put `PRIVATE_KEY` into `buyer/.env` (see step 3).
- Use `ADDRESS` in the faucet step below.

> ⚠️ This is a **testnet-only** wallet. Never put a real / mainnet private key in
> a demo. Private keys live only in `.env`, which is git-ignored.

You can also use an existing MetaMask / Coinbase Wallet account and export its
private key — just make sure it's a testnet-only account.

---

## 2. Fund the wallet with Base Sepolia test USDC

> Only needed for **real on-chain** mode. In the default local demo mode you can
> skip this entirely.

1. Go to the **Circle USDC faucet**: <https://faucet.circle.com>
2. Select network **Base Sepolia**.
3. Paste the buyer `ADDRESS` and request test USDC.

(Optional) If you ever need Base Sepolia **ETH** for gas, use a Base Sepolia
faucet such as:

- <https://portal.cdp.coinbase.com/products/faucet> (Coinbase Developer Platform)
- <https://www.alchemy.com/faucets/base-sepolia>

For this demo the buyer usually needs **only test USDC**, because the facilitator
pays the gas to settle the payment.

The **seller's** receiving address does not need any funds — it just receives USDC.

---

## 3. Configure environment files

**Seller** — copy the example and set your receiving address:

```bash
cd seller
cp .env.example .env
# edit .env → set ADDRESS to the wallet that should receive USDC
```

**Buyer** — copy the example and set your test private key:

```bash
cd buyer
cp .env.example .env
# edit .env → set PRIVATE_KEY to the test wallet from step 1
```

`.env` files are git-ignored (see `.gitignore`). Only `.env.example` is committed.

---

## 4. Run it

**Terminal A — start the seller:**

```bash
cd seller
npm install
npm start
# x402 seller listening on http://localhost:4021
#   paid endpoint : GET http://localhost:4021/api/quote
```

Try it unpaid to see the 402:

```bash
curl -i http://localhost:4021/api/quote
# HTTP/1.1 402 Payment Required
# ... JSON body describing the payment requirements ...
```

**Terminal B — run the buyer:**

```bash
cd buyer
npm install   # if you didn't already in step 1
npm start
```

Expected output:

```
Requesting http://localhost:4021/api/quote
Paying as   0xF39F...2266 (Base Sepolia)

Paid request succeeded. Response body:
{
  "product": "WIDGET-001",
  "currency": "USD",
  "price": 42.17,
  "quoteId": "q_ab12cd34",
  "validUntil": "2026-01-01T00:05:00.000Z",
  "generatedAt": "2026-01-01T00:00:00.000Z"
}

Settlement receipt (x-payment-response, base64):
eyJzdWNjZXNzIjp0cnVlLC...
```

---

## How the code works

**Seller** (`seller/index.ts`) — one middleware call turns a normal route into a
paid one:

```ts
app.use(
  paymentMiddleware(
    payTo,                              // your receiving address
    {
      "GET /api/quote": {
        price: "$0.01",                 // 0.01 USDC per request
        network: "base-sepolia",
      },
    },
    { url: facilitatorUrl },            // local facilitator by default; real one via FACILITATOR_URL
  ),
);
```

**Buyer** (`buyer/index.ts`) — wrap `fetch` and it handles 402s automatically:

```ts
const account = privateKeyToAccount(privateKey);           // viem local account = x402 signer
const fetchWithPay = wrapFetchWithPayment(fetch, account);
const response = await fetchWithPay(url, { method: "GET" }); // pays on 402, then retries
```

---

## Configuration reference

### `seller/.env`

| Variable         | Required | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `ADDRESS`        | yes      | Wallet address that receives USDC payments.                                 |
| `NETWORK`        | no       | Payment network. Default `base-sepolia`.                                    |
| `PORT`           | no       | API port. Default `4021`.                                                    |
| `FACILITATOR_URL`| no       | Real facilitator URL. **Unset = bundled local demo facilitator** (simulated settlement, no funds). |

### `buyer/.env`

| Variable       | Required | Description                                                        |
| -------------- | -------- | ------------------------------------------------------------------ |
| `PRIVATE_KEY`  | yes      | Base Sepolia **test** wallet private key (`0x...`). Never mainnet. |
| `RESOURCE_URL` | no       | Endpoint to call. Default `http://localhost:4021/api/quote`.       |

---

## Real on-chain settlement

The default local facilitator (`seller/local-facilitator.ts`) *simulates*
verification and settlement so the demo runs with no funds — **no USDC actually
moves.** To settle real test USDC on Base Sepolia:

1. Fund the buyer wallet with test USDC (see step 2).
2. Point the seller at a real facilitator, e.g. in `seller/.env`:

   ```bash
   FACILITATOR_URL=https://x402.org/facilitator
   ```

   For the Coinbase CDP facilitator (mainnet or authenticated setups), use the
   `facilitator` export from `@coinbase/x402` and its API keys — see the
   [x402 docs](https://docs.x402.org).
3. Restart the seller and run the buyer again. This time settlement broadcasts a
   real `transferWithAuthorization` transaction and the `x-payment-response`
   header carries the actual on-chain tx hash.

Nothing else changes — the seller and buyer code is identical in both modes.

---

## A note on x402 versions

This demo uses the **v1** packages the request named — `x402-express` and
`x402-fetch` (both `^1.2.0`) — because they give the smallest possible
"one-line paywall" surface and work as-is on Base Sepolia.

Coinbase / the x402 Foundation now mark v1 as **deprecated** (security patches
only) and recommend the scoped **v2** packages (`@x402/express`, `@x402/fetch`,
`@x402/core`, `@x402/evm`, …). If you build on top of this demo for anything
beyond a quick prototype, follow the
[v1 → v2 migration guide](https://docs.x402.org/guides/migration-v1-to-v2). The
protocol and Base Sepolia + USDC flow are the same; the v2 API is just more
modular.

## Links

- x402 site & docs: <https://x402.org> · <https://docs.x402.org>
- Coinbase x402 quickstarts: <https://docs.cdp.coinbase.com/x402/quickstart-for-sellers>
- Circle USDC faucet (Base Sepolia): <https://faucet.circle.com>
