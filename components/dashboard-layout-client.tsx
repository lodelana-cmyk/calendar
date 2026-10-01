"use client"

import { TopBar } from "@/components/top-bar"

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main>{children}</main>
    </div>
  )
}
