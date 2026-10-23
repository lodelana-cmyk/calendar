import type { User } from "@supabase/supabase-js"

// Who may use the app: verified accounts on these email domains only.
// Comma-separated in ALLOWED_EMAIL_DOMAINS to add another; defaults to Threecolts.
// The database enforces the same rule (scripts/009), so this is belt and braces.
export const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "threecolts.com")
  .split(",").map(d => d.trim().toLowerCase()).filter(Boolean)

export function isAllowedEmail(email: string | null | undefined): boolean {
  const domain = email?.toLowerCase().split("@")[1]
  return !!domain && ALLOWED_DOMAINS.includes(domain)
}

export function isAllowedUser(user: Pick<User, "email" | "email_confirmed_at"> | null | undefined): boolean {
  return !!user && !!user.email_confirmed_at && isAllowedEmail(user.email)
}
