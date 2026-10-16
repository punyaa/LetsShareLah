import { createHash, timingSafeEqual } from "node:crypto";

export function ownerAccessAllowed(authorization, accessCode) {
  if (!accessCode) return true;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;
  const supplied = authorization.slice(7);
  if (!supplied || supplied.length > 256) return false;
  const hash = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(supplied), hash(accessCode));
}
