import crypto from "crypto";

// 32-byte secret key derived from environment variable
const getMasterKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_SECRET_KEY || "default-secret-key-32-bytes-algo-deploy-sec";
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts a sensitive string (e.g. API Key, Secret, TOTP seed) using AES-256-GCM.
 * Output format: iv:authTag:encryptedData (Hex-encoded)
 */
export function encryptData(plainText: string): string {
  if (!plainText) return "";
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export function decryptData(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
      // Return as-is if not properly formatted (fallback for unencrypted dev data)
      return cipherText;
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

