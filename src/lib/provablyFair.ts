export type FairRollProof = {
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  roll: number;
};

async function sha256Hex(input: string) {
  const encoded = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(key: string, message: string) {
  const encodedKey = new TextEncoder().encode(key);
  const encodedMessage = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encodedKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encodedMessage);
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createFairRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<FairRollProof> {
  const serverSeedHash = await sha256Hex(serverSeed);
  const hmac = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);

  const firstEight = hmac.slice(0, 8);
  const int = parseInt(firstEight, 16);
  const roll = int / 0xffffffff;

  return {
    serverSeedHash,
    serverSeed,
    clientSeed,
    nonce,
    roll,
  };
}
