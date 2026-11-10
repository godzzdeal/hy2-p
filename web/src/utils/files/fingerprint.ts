export const FILE_FINGERPRINT_LENGTH = 12;
const HASH_CHUNK_BYTES = 256 * 1024;

export async function fileFingerprint(blob: Blob): Promise<string> {
  let digest: Uint8Array;
  if (globalThis.crypto?.subtle) {
    digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  } else {
    // WebCrypto is unavailable on public HTTP addresses. Load only the SHA-256 fallback.
    const { sha256 } = await import("@noble/hashes/sha2.js");
    const data = new Uint8Array(await blob.arrayBuffer());
    const hash = sha256.create();
    for (let offset = 0; offset < data.length; offset += HASH_CHUNK_BYTES) {
      hash.update(data.subarray(offset, offset + HASH_CHUNK_BYTES));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    digest = hash.digest();
  }
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, FILE_FINGERPRINT_LENGTH);
}
