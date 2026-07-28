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

Payments settle in **USDC on the Base Sepolia testnet**, so nothing here costs
real money.

```
buyer  ──GET /api/quote──▶  seller
       ◀──── 402 + payment requirements ────
buyer  ─sign USDC payment (EIP-3009)─▶ retry with X-PAYMENT header
                     seller ──verify+settle──▶ x402 facilitator ──▶ Base Sepolia
       ◀──── 200 + JSON quote + settlement receipt ────
```

> **How does the buyer pay without gas?** With the x402 *exact* EVM scheme the
> buyer only **signs** a USDC transfer authorization (EIP-3009). The facilitator
> submits the on-chain transaction, so the buyer wallet needs **test USDC** but
> generally **no ETH for gas**.

---

## Prerequisites

- **Node.js 20+** (the run scripts use Node's built-in `--env-file`).
- A Base Sepolia wallet address to **receive** payments (seller).
- A Base Sepolia test wallet funded with **test USDC** to **make** payments (buyer).

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
    facilitator,                        // optional; defaults to the hosted testnet facilitator
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
| `FACILITATOR_URL`| no       | Override the x402 facilitator. Default = hosted testnet facilitator.        |

### `buyer/.env`

| Variable       | Required | Description                                                        |
| -------------- | -------- | ------------------------------------------------------------------ |
| `PRIVATE_KEY`  | yes      | Base Sepolia **test** wallet private key (`0x...`). Never mainnet. |
| `RESOURCE_URL` | no       | Endpoint to call. Default `http://localhost:4021/api/quote`.       |

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
