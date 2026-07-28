import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Generates a fresh throwaway keypair for the testnet demo.
// Copy PRIVATE_KEY into buyer/.env and fund the ADDRESS with test USDC.
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("New Base Sepolia test wallet generated.\n");
console.log(`PRIVATE_KEY=${privateKey}`);
console.log(`ADDRESS    =${account.address}`);
console.log(
  "\nNext: put PRIVATE_KEY in buyer/.env, then fund ADDRESS with test USDC",
);
console.log("from the Circle faucet (https://faucet.circle.com, Base Sepolia).");
