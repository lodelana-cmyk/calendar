"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

const REDIRECT_URL = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? "https://vms.threecolts.com/auth/callback"

export default function SignUpPage() {
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError]               = useState<string | null>(null)
  const [isLoading, setIsLoading]             = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSuccess, setIsSuccess]       = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    setIsGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
        scopes: "email profile",
      },
    })
    if (error) {
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: REDIRECT_URL },
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface-container rounded-2xl p-8 shadow-[0_8px_32px_rgba(45,51,53,0.08)] text-center">
            <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2 font-sans">Check your email</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to verify your account.
            </p>
            <Link href="/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-on-surface font-sans tracking-tight">The Editorial Studio</h1>
          <p className="text-sm text-on-surface-variant mt-2">Video Operations Dashboard</p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 shadow-[0_8px_32px_rgba(45,51,53,0.08)]">
          <h2 className="text-2xl font-bold text-on-surface mb-1 font-sans">Create an account</h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Sign up with Google — if you have an existing email account with the same address, it will be linked automatically.
          </p>

          {/* Primary: Google SSO */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {error && !showEmailForm && (
            <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl mt-4">{error}</p>
          )}

          {/* Secondary: email/password — collapsed */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => { setShowEmailForm(p => !p); setError(null) }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {showEmailForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Create account with email and password
            </button>

            {showEmailForm && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4 mt-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-on-surface">Email</label>
                  <input
                    id="email" type="email" placeholder="you@example.com" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-on-surface">Password</label>
                  <input
                    id="password" type="password" placeholder="Create a password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-on-surface">Confirm Password</label>
                  <input
                    id="confirmPassword" type="password" placeholder="Confirm your password" required
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}
                <button
                  type="submit" disabled={isLoading}
                  className="h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : "Create account"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
