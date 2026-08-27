"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Mail, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"

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

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [isLoading, setIsLoading]             = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResending, setIsResending]         = useState(false)
  const [showPassword, setShowPassword]       = useState(false)
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false)
  const [resendSuccess, setResendSuccess]     = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    setIsGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
        // Request email scope so Supabase can match against existing accounts
        scopes: "email profile",
      },
    })
    if (error) {
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setShowEmailNotConfirmed(false)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("email is not confirmed") ||
          error.message.toLowerCase().includes("confirm your email")
        ) {
          setShowEmailNotConfirmed(true)
          return
        }
        throw error
      }
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    const supabase = createClient()
    setIsResending(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: REDIRECT_URL },
      })
      if (error) throw error
      setResendSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend confirmation email")
    } finally {
      setIsResending(false)
    }
  }

  // --- Email-not-confirmed sub-page ---
  if (showEmailNotConfirmed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-on-surface font-sans tracking-tight">The Editorial Studio</h1>
            <p className="text-sm text-on-surface-variant mt-2">Video Operations Dashboard</p>
          </div>
          <div className="bg-surface-container rounded-2xl p-8 shadow-[0_8px_32px_rgba(45,51,53,0.08)]">
            {resendSuccess ? (
              <>
                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-2 font-sans text-center">Confirmation email sent</h2>
                <p className="text-sm text-on-surface-variant text-center mb-6">
                  We&apos;ve sent a new link to <strong>{email}</strong>. Check your inbox.
                </p>
                <button
                  onClick={() => { setShowEmailNotConfirmed(false); setResendSuccess(false) }}
                  className="w-full h-12 bg-surface-container-high text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-highest transition-all"
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-2 font-sans text-center">Email not confirmed</h2>
                <p className="text-sm text-on-surface-variant text-center mb-6">
                  Your account hasn&apos;t been verified yet. Resend the confirmation email or sign in with Google instead — if your email matches, your account will merge automatically.
                </p>
                {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl mb-4">{error}</p>}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-all disabled:opacity-50"
                  >
                    {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isResending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Mail className="h-4 w-4" />Resend confirmation</>}
                  </button>
                  <button
                    onClick={() => { setShowEmailNotConfirmed(false); setError(null) }}
                    className="w-full h-12 bg-surface-container-high text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-highest transition-all"
                  >
                    Try different credentials
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- Main sign-in page ---
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-on-surface font-sans tracking-tight">The Editorial Studio</h1>
          <p className="text-sm text-on-surface-variant mt-2">Video Operations Dashboard</p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 shadow-[0_8px_32px_rgba(45,51,53,0.08)]">
          <h2 className="text-2xl font-bold text-on-surface mb-1 font-sans">Welcome back</h2>
          <p className="text-sm text-on-surface-variant mb-8">Sign in to your account to continue</p>

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

          {/* Error for Google */}
          {error && !showPassword && (
            <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl mt-4">{error}</p>
          )}

          {/* Secondary: email/password — collapsed by default */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => { setShowPassword(p => !p); setError(null) }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {showPassword ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Sign in with email and password
            </button>

            {showPassword && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-5">
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
                    id="password" type="password" placeholder="Enter your password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}
                <button
                  type="submit" disabled={isLoading}
                  className="h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
