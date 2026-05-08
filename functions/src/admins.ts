export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "tominaga@utaha.io",
]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
