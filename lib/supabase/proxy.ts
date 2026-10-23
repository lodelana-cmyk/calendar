import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAllowedUser } from '@/lib/access'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signed in, but not a verified Threecolts account: sign them out and turn them away
  if (user && !isAllowedUser(user)) {
    await supabase.auth.signOut()
    if (request.nextUrl.pathname.startsWith('/api')) {
      const res = NextResponse.json({ error: 'This app is only for Threecolts accounts' }, { status: 403 })
      supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
      return res
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?error=not-allowed'
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
    return res
  }

  // API routes handle their own auth and must return JSON, never an HTML redirect
  if (request.nextUrl.pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Protect all routes except /login and /auth/* (sign-up is closed: people are invited)
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!isAuthRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
