"use client"

import { CalendarDays, Inbox, Megaphone, Users, Settings, LogOut, User, Library } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useStore } from "@/lib/store"

const navItems = [
  { icon: Inbox,        label: "Inbox",     href: "/inbox" },
  { icon: CalendarDays, label: "Calendar",  href: "/" },
  { icon: Megaphone,    label: "Campaigns", href: "/campaigns" },
  { icon: Library,      label: "Library",   href: "/library" },
  { icon: Users,        label: "Team",      href: "/team" },
]

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: User,     label: "Profile",  href: "/profile" },
]

export function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useStore()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const displayName = currentUser?.full_name || "User"
  const displayRole = currentUser?.role || "Team Member"
  const avatarUrl =
    currentUser?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`

  return (
    <aside
      className={`h-screen w-60 fixed left-0 top-0 z-50 bg-background/95 backdrop-blur-[24px] flex flex-col p-5 gap-6 border-r border-border/40 overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="pt-2 pb-1">
        <span className="text-base font-bold tracking-tight text-foreground">
          Editorial Studio
        </span>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
          Content Marketing
        </p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActive(item.href)
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActive(item.href)
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* User chip */}
        <div className="flex items-center gap-3 px-3 mt-4">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-accent shrink-0">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
            <span className="text-[10px] text-muted-foreground truncate">{displayRole}</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  )
}
