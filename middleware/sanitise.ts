/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Use this on every piece of user-supplied text before rendering it in HTML.
 *
 * e.g.  sanitise('<script>alert(1)</script>')
 *       → '&lt;script&gt;alert(1)&lt;/script&gt;'
 */
export function sanitise(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitises every string value in a plain object.
 * Handy for cleaning a whole form body at once.
 */
export function sanitiseBody(
  body: Record<string, unknown>
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    clean[key] = sanitise(value);
  }
  return clean;
}