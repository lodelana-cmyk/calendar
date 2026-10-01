"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { NotificationBell } from "@/components/notification-bell"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cx } from "@/components/kit"

const NAV = [
  { label: "Inbox",     href: "/inbox" },
  { label: "Calendar",  href: "/" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Library",   href: "/library" },
  { label: "Team",      href: "/team" },
]

/** App shell: name on the left, pill tabs in the middle, bell and account on the right. */
export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const name = currentUser?.full_name || "Account"
  const avatar =
    currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

  const signOut = async () => {
    setSigningOut(true)
    await createClient().auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2">
        <Link href="/" className="justify-self-start text-[15px] font-semibold tracking-tight text-on-surface whitespace-nowrap">
          Editorial Studio
        </Link>

        <nav
          aria-label="Main"
          className="col-span-2 row-start-2 md:col-span-1 md:row-start-1 md:col-start-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="inline-flex items-center gap-0.5 p-1 rounded-full border border-outline-variant">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cx(
                  "h-8 px-4 inline-flex items-center rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(item.href) ? "bg-primary text-primary-foreground" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="justify-self-end row-start-1 col-start-2 md:col-start-3 flex items-center gap-1">
          <NotificationBell />
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                className="h-9 w-9 rounded-full overflow-hidden border border-outline-variant hover:border-on-surface/30 transition-colors"
                aria-label="Account menu"
              >
                <img src={avatar} alt="" className="h-full w-full object-cover bg-surface-container-low" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1.5">
              <div className="px-2.5 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium text-on-surface truncate">{name}</p>
                {currentUser?.role && <p className="text-xs text-on-surface-variant truncate">{currentUser.role}</p>}
              </div>
              {[
                { href: "/profile",  label: "Profile",  icon: User },
                { href: "/settings", label: "Settings", icon: Settings },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <item.icon className="h-4 w-4 text-on-surface-variant" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={signOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 text-on-surface-variant" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
