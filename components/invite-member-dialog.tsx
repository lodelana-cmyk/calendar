"use client"

import { useState } from "react"
import { Loader2, UserPlus, Copy, Check, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRefreshData } from "@/components/data-provider"

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let pw = ""
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  for (let i = 0; i < 12; i++) pw += chars[arr[i] % chars.length]
  return pw
}

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const { refreshProfiles } = useRefreshData()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [tempPassword, setTempPassword] = useState(() => generatePassword())
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setFullName("")
    setEmail("")
    setRole("")
    setTempPassword(generatePassword())
    setError("")
    setSuccess(false)
    setCopied(false)
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const handleInvite = async () => {
    setIsInviting(true)
    setError("")
    try {
      const res = await fetch("/api/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role, tempPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to invite user")
      await refreshProfiles()
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite user")
    } finally {
      setIsInviting(false)
    }
  }

  const copyCredentials = async () => {
    await navigator.clipboard.writeText(
      `Editorial Studio login\nEmail: ${email}\nTemporary password: ${tempPassword}\n\nLog in, then change your password from the Profile page.`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-surface-container-lowest border-outline-variant max-w-md">
        <DialogHeader>
          <DialogTitle className="headline text-on-surface flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {success ? "Member Invited" : "Invite Team Member"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-error/10 rounded-xl text-sm text-error font-medium">{error}</div>
        )}

        {success ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">{fullName}</strong> can now log in with these
              credentials. Share them securely — they should change their password from the
              Profile page after first login.
            </p>
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col gap-2 font-mono text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-on-surface-variant">Email</span>
                <span className="text-on-surface font-semibold truncate">{email}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-on-surface-variant">Password</span>
                <span className="text-on-surface font-semibold">{tempPassword}</span>
              </div>
            </div>
            <button
              onClick={copyCredentials}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Credentials"}
            </button>
            <button
              onClick={() => handleOpenChange(false)}
              className="w-full py-3 px-4 bg-surface-container-high rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Angela Rivera"
                className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="angela@threecolts.com"
                className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Product Specialist"
                className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Temporary Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => setTempPassword(generatePassword())}
                  aria-label="Regenerate password"
                  className="h-12 w-12 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors flex-shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                They log in with this and change it from their Profile page.
              </p>
            </div>
            <button
              onClick={handleInvite}
              disabled={isInviting || !fullName.trim() || !email.trim()}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create &amp; Invite
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
