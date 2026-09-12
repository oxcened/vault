import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = "vault_sk_";

export function createShortcutApiToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashShortcutApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
