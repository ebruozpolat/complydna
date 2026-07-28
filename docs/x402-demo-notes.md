# x402 Demo — Yapılanlar & Plan

Bu belge, `seller/` + `buyer/` x402 demosunda şu ana kadar ne yapıldığını, hangi
kararların neden alındığını ve sırada ne olduğunu özetler.

Son güncelleme: 2026-07-28
Branch: `claude/x402-minimal-demo-9tci3g`

---

## Amaç

x402 ödeme protokolüyle minimal, uçtan uca çalışan bir demo:

- **seller/** — Express API, tek endpoint `GET /api/quote`, `x402-express`
  middleware ile korunuyor. Ödeme yoksa `402`, ödeme sonrası JSON yanıt.
- **buyer/** — `x402-fetch` kullanan script; `402`'yi yakalayıp testnet
  cüzdanıyla otomatik ödüyor ve sonucu konsola yazıyor.
- Ağ: **Base Sepolia** testnet. Ödeme: **USDC**.

---

## Şu ana kadar yapılanlar

### 1. Araştırma
- npm'deki resmi paketler doğrulandı: `x402-express@1.2.0`, `x402-fetch@1.2.0`,
  `x402@1.2.0`.
- Tarball README'lerinden ve `x402` paketinin kaynağından güncel API teyit
  edildi (`paymentMiddleware`, `wrapFetchWithPayment`, facilitator
  `/verify` `/settle` `/supported` HTTP sözleşmesi).
- Not: v1 paketleri artık resmi olarak **deprecated** ("yalnızca güvenlik
  yaması"); v2 = `@x402/express`, `@x402/fetch`, `@x402/core`, `@x402/evm`.
  Minimal demo için (tek satır middleware) bilinçli olarak v1 seçildi.

### 2. Seller (`seller/`)
- `index.ts` — `paymentMiddleware(payTo, { "GET /api/quote": { price: "$0.01",
  network: "base-sepolia" } }, { url })`. Ödeme sonrası rastgele bir fiyat
  teklifi JSON'u döner.
- `.env.example`, `tsconfig.json`, `package.json` (script: `tsx --env-file=.env`).

### 3. Buyer (`buyer/`)
- `index.ts` — viem `privateKeyToAccount` ile local account (x402 signer),
  `wrapFetchWithPayment(fetch, account)`. `402` → imzala → tekrar dene → yazdır.
  Yanıt `response.ok` değilse net hata verir.
- `generate-wallet.ts` — tek komutla test cüzdanı (private key + adres) üretir.
- `.env.example`, `tsconfig.json`, `package.json`.

### 4. Yerel facilitator (`seller/local-facilitator.ts`)  ← "çalışır hale getir" adımı
- **Sorun:** hosted facilitator (x402.org) bu ortamdan proxy nedeniyle
  erişilemiyordu ve test cüzdanı fonsuzdu → settlement takılıyordu.
- **Çözüm:** x402'nin beklediği `/verify`, `/settle`, `/supported` HTTP
  sözleşmesini birebir uygulayan küçük bir yerel facilitator. Doğrulama ve
  settlement **process içinde simüle ediliyor** (gerçek USDC hareket etmez).
- Seller varsayılan olarak bunu kullanır; `FACILITATOR_URL` set edilirse gerçek
  facilitator'a geçer. Buyer EIP-3009 yetkisini tamamen lokal imzaladığı için
  (name/version/tutar 402 yanıtından gelir) tüm akış **fonsuz ve offline** çalışır.

### 5. Dokümantasyon & güvenlik
- `README.md` — iki mod (local demo / gerçek on-chain), test cüzdanı oluşturma,
  Circle USDC faucet adımları, çalıştırma, config referansı, v1→v2 notu.
- `.gitignore` — `.env`, `.env.*`, `*.env` yok sayılıyor; yalnızca `.env.example`
  commit'leniyor. Repoda hiç secret/private key yok (doğrulandı).

---

## Doğrulama (gerçekten çalıştırıldı)

- Her iki paket de `tsc --noEmit` ile temiz derleniyor.
- Ödemesiz istek → `402` + doğru payment requirements (`scheme: exact`,
  `network: base-sepolia`, USDC `0x036C…F7e`, `maxAmountRequired: 10000` = $0.01).
- Fonsuz test cüzdanıyla uçtan uca → **HTTP 200 + gerçek JSON teklifi** +
  `x-payment-response` settlement receipt. Seller log: `verify OK` / `settle OK`.

---

## Bilinçli sadeleştirmeler (bug değil, tasarım)

- Yerel facilitator gerçek doğrulama yapmaz (mock) — fonsuz/offline demo için.
- Tek endpoint, tek fiyat.
- Buyer sadece `x402-fetch` kullanır (`x402-axios` değil).

---

## Sırada ne var (plan)

Öncelik sırasına göre:

1. **Local facilitator'a gerçek doğrulama ekle** (fon/zincir gerektirmez)
   - `/verify`: EIP-3009 imzasını recover et, `from` ile eşleştir; tutar
     (`value >= maxAmountRequired`), `validAfter`/`validBefore` süre kontrolü.
   - Geçersiz imza/tutar/süre → `isValid: false` + doğru `invalidReason`.
   - Böylece mock, gerçek ödeme mantığını yansıtır ama yine fon gerektirmez.

2. **Otomatik testler (vitest)**
   - Ödemesiz istek `402` dönüyor mu.
   - Geçerli ödeme sonrası `200` + doğru JSON gövdesi.
   - Geçersiz/eksik ödeme reddediliyor mu.
   - CI'da çalışacak şekilde.

3. **Gerçek on-chain akışı doğrula**
   - Fonlanmış Base Sepolia cüzdanıyla `FACILITATOR_URL=https://x402.org/facilitator`
     üzerinden gerçek USDC settlement (kullanıcının makinesinde).
   - Coinbase CDP facilitator (`@coinbase/x402`, API key'li) örneği eklenebilir.

4. **İyileştirmeler (opsiyonel)**
   - Buyer'da `decodeXPaymentResponse` ile settlement receipt'i okunaklı göster
     (tx hash, network, payer).
   - `x402-axios` varyantı.
   - İnsan/tarayıcı için built-in paywall HTML akışı.
   - Discovery (`/supported`, resource listeleme) örneği.

5. **Uzun vade**
   - v1 → v2 (`@x402/*`) geçişi ([migration guide](https://docs.x402.org/guides/migration-v1-to-v2)).

---

## Dosya haritası

```
seller/
  index.ts              # Express + x402 paymentMiddleware
  local-facilitator.ts  # yerel (simüle) facilitator: /verify /settle /supported
  .env.example          # ADDRESS, NETWORK, PORT, FACILITATOR_URL
  package.json, tsconfig.json
buyer/
  index.ts              # x402-fetch ile otomatik ödeme
  generate-wallet.ts    # test cüzdanı üretici
  .env.example          # PRIVATE_KEY, RESOURCE_URL
  package.json, tsconfig.json
README.md               # kurulum + çalıştırma + iki mod + faucet
.gitignore              # .env* yok sayılır (örnek hariç)
docs/x402-demo-notes.md # bu belge
```
