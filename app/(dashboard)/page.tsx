"use client"

import { ContentCalendar } from "@/components/content-calendar"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useStore } from "@/lib/store"

export default function HomePage() {
  const { isLoading } = useStore()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight text-balance">
          Content Calendar
        </h1>
        <p className="text-sm text-on-surface-variant font-medium">
          Editorial Studio &middot; Threecolts
        </p>
      </div>
      <ContentCalendar />
    </div>
  )
}
