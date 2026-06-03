import { createHash } from "crypto";

export function hashText(text = "") {
  return createHash("sha256").update(text).digest("hex");
}
