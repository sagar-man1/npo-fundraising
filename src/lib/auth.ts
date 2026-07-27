import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "parfi_session";

/** Auth is only enforced when APP_PASSWORD is set, so local dev stays frictionless. */
export function authEnabled() {
  return !!process.env.APP_PASSWORD;
}

function secret() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  return password;
}

export function sessionToken() {
  return createHmac("sha256", secret()).update("parfi-fundraising").digest("hex");
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isValidSession(cookieValue: string | undefined) {
  if (!authEnabled()) return true;
  if (!cookieValue) return false;
  return safeEqual(cookieValue, sessionToken());
}
