"use client"

import { TopBar } from "@/components/top-bar"
import { OnboardingTour } from "@/components/onboarding-tour"

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main>{children}</main>
      <OnboardingTour />
    </div>
  )
}
