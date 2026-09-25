"use client"

import { ContentCalendar } from "@/components/content-calendar"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useStore } from "@/lib/store"

export default function HomePage() {
  const { isLoading } = useStore()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3">
      <h1 className="sr-only">Content Calendar</h1>
      <ContentCalendar />
    </div>
  )
}
