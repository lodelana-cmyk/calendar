"use client"

// Placeholders shaped like the screens they stand in for, so the page
// doesn't jump when data arrives.

const block = "bg-surface-container-low rounded-full"

/** Calendar: toolbar of pills over a 7-column month grid. */
export function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className={`${block} h-10 w-56`} />
        <div className={`${block} h-10 w-56`} />
        <div className={`${block} h-10 w-24`} />
        <div className="flex-1" />
        <div className={`${block} h-10 w-28`} />
        <div className={`${block} h-10 w-24`} />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-10 bg-surface-container-low" />
        <div className="grid grid-cols-7 divide-x divide-border">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-[110px] border-t border-border" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Campaigns / Library: page header, a filter row and a stack of rows. */
export function ListSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 animate-pulse" aria-hidden="true">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-surface-container-low rounded-lg" />
          <div className="h-4 w-64 bg-surface-container-low rounded" />
        </div>
        <div className={`${block} h-10 w-36`} />
      </div>
      <div className="flex gap-2">
        <div className={`${block} h-9 w-72`} />
        <div className={`${block} h-9 w-32`} />
      </div>
      <div className="rounded-xl border border-border divide-y divide-border">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-16" />)}
      </div>
    </div>
  )
}

/** Team: stat tiles over a people table. */
export function TeamSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 max-w-6xl mx-auto animate-pulse" aria-hidden="true">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-32 bg-surface-container-low rounded-lg" />
          <div className="h-4 w-24 bg-surface-container-low rounded" />
        </div>
        <div className={`${block} h-10 w-28`} />
      </div>
      <div className="rounded-2xl border border-border grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28" />)}
      </div>
      <div className="rounded-2xl border border-border divide-y divide-border">
        <div className="h-11 bg-surface-container-low rounded-t-2xl" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-16" />)}
      </div>
    </div>
  )
}
