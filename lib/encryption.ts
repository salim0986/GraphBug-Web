/**
 * M12 — AES-256-GCM envelope encryption for API keys stored at rest.
 *
 * Scheme
 * ------
 * 1. Generate a random 32-byte DEK (Data Encryption Key) per API key.
 * 2. Encrypt the plaintext key with the DEK using AES-256-GCM.
 * 3. Encrypt the DEK with the MASTER_KEY from env using AES-256-GCM.
 * 4. Serialize as:  "enc2:<iv2b64>:<tag2b64>:<encDekb64>:<iv1b64>:<tag1b64>:<encKeyb64>"
 *
 * Rotation
 * --------
 * To rotate MASTER_KEY: decrypt every user's DEK with the old key, re-encrypt
 * with the new key, and store the updated ciphertext.  The plaintext API key
 * is never exposed during rotation.
 *
 * Backward compatibility
 * ----------------------
 * The existing webhook handler uses AES-256-CBC with a scrypt-derived key
 * (no "enc2:" prefix).  `decryptApiKey` falls back to the CBC path for any
 * ciphertext that does not start with "enc2:".
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  scryptSync,
} from "crypto";

const ALGO = "aes-256-gcm" as const;
const LEGACY_ALGO = "aes-256-cbc" as const;

// ---------------------------------------------------------------------------
// Master key helper
// ---------------------------------------------------------------------------

function _masterKey(): Buffer | null {
  const hex = process.env.MASTER_KEY;
  if (!hex) return null;
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    console.error("[encryption] MASTER_KEY must be exactly 32 bytes (64 hex chars) — ignoring");
    return null;
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext API key.
 * Uses AES-256-GCM envelope encryption when `MASTER_KEY` is set.
 * Falls back to legacy AES-256-CBC when it is not (dev / unset environments).
 */
export function encryptApiKey(plaintext: string): string {
  const masterKey = _masterKey();
  if (!masterKey) {
    // MASTER_KEY not configured — fall back to CBC so deployments without it
    // still work. Keys encrypted this way are readable by decryptApiKey's
    // legacy path and by the existing gemini-key route.
    console.warn("[encryption] MASTER_KEY not set — using AES-256-CBC fallback");
    return _encryptLegacyCbc(plaintext);
  }

  // Layer 1: per-key DEK
  const dek = randomBytes(32);
  const iv1 = randomBytes(12);
  const cipher1 = createCipheriv(ALGO, dek, iv1);
  const encKey = Buffer.concat([
    cipher1.update(plaintext, "utf8"),
    cipher1.final(),
  ]);
  const tag1 = cipher1.getAuthTag();

  // Layer 2: wrap DEK with master key
  const iv2 = randomBytes(12);
  const cipher2 = createCipheriv(ALGO, masterKey, iv2);
  const encDek = Buffer.concat([cipher2.update(dek), cipher2.final()]);
  const tag2 = cipher2.getAuthTag();

  const parts = [
    iv2.toString("base64"),
    tag2.toString("base64"),
    encDek.toString("base64"),
    iv1.toString("base64"),
    tag1.toString("base64"),
    encKey.toString("base64"),
  ];
  return "enc2:" + parts.join(":");
}

/**
 * Decrypt an API key.
 *
 * Handles:
 * - New format (enc2:…): AES-256-GCM envelope encryption.
 * - Legacy format (iv:encData as hex): AES-256-CBC with scrypt-derived key.
 * - Plaintext (no recognisable prefix): returned as-is.
 */
export function decryptApiKey(ciphertext: string): string {
  if (ciphertext.startsWith("enc2:")) {
    return _decryptGcm(ciphertext);
  }
  // Legacy CBC path (pre-M12)
  if (_looksLikeLegacy(ciphertext)) {
    return _decryptLegacyCbc(ciphertext);
  }
  // Assume plaintext (dev / unencrypted)
  return ciphertext;
}

// ---------------------------------------------------------------------------
// HMAC signing helper (for service-to-service requests)
// ---------------------------------------------------------------------------

/**
 * Compute `sha256=<hex>` HMAC signature for a request body string.
 * Returns an empty string if `AI_SERVICE_SECRET` is not configured.
 */
export function signServiceRequest(body: string): string {
  const secret = process.env.AI_SERVICE_SECRET;
  if (!secret) return "";
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _decryptGcm(ciphertext: string): string {
  const masterKey = _masterKey();
  if (!masterKey) throw new Error("MASTER_KEY required to decrypt enc2 ciphertext");
  const payload = ciphertext.slice(5); // strip "enc2:"
  const parts = payload.split(":");
  if (parts.length !== 6)
    throw new Error("Invalid enc2 ciphertext format (expected 6 parts)");

  const [iv2b, tag2b, encDekb, iv1b, tag1b, encKeyb] = parts.map((p) =>
    Buffer.from(p, "base64"),
  );

  // Unwrap DEK
  const d2 = createDecipheriv(ALGO, masterKey, iv2b);
  d2.setAuthTag(tag2b);
  const dek = Buffer.concat([d2.update(encDekb), d2.final()]);

  // Decrypt payload
  const d1 = createDecipheriv(ALGO, dek, iv1b);
  d1.setAuthTag(tag1b);
  return Buffer.concat([d1.update(encKeyb), d1.final()]).toString("utf8");
}

function _encryptLegacyCbc(plaintext: string): string {
  const encKey =
    process.env.ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "default-key-change-in-production";
  const key = scryptSync(encKey, "salt", 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(LEGACY_ALGO, key, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  return `${iv.toString("hex")}:${enc}`;
}

function _looksLikeLegacy(s: string): boolean {
  // Legacy format: "<32-char hex iv>:<hex encrypted data>"
  const parts = s.split(":");
  return parts.length === 2 && /^[0-9a-f]{32}$/i.test(parts[0]);
}

function _decryptLegacyCbc(ciphertext: string): string {
  const encKey =
    process.env.ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "default-key-change-in-production";
  const key = scryptSync(encKey, "salt", 32);
  const parts = ciphertext.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const d = createDecipheriv(LEGACY_ALGO, key, iv);
  let out = d.update(parts[1], "hex", "utf8");
  out += d.final("utf8");
  return out;
}
