"use client"

export function DashboardSkeleton() {
  return (
    <div className="px-12 py-6 flex flex-col gap-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-10 w-72 bg-surface-container-low rounded-xl" />
        <div className="h-5 w-48 bg-surface-container-low rounded-lg" />
      </div>
      
      {/* Top Row Skeleton */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-6 xl:col-span-5 h-48 bg-surface-container-low rounded-xl" />
        <div className="col-span-12 lg:col-span-6 xl:col-span-7 h-48 bg-surface-container-low rounded-xl" />
      </div>
      
      {/* Projects Grid Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-6 w-32 bg-surface-container-low rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-surface-container-low rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProjectsSkeleton() {
  return (
    <div className="px-6 lg:px-12 py-6 flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-surface-container-low rounded-xl" />
          <div className="h-5 w-80 bg-surface-container-low rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-72 bg-surface-container-low rounded-full" />
          <div className="h-10 w-32 bg-surface-container-low rounded-full" />
        </div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-72 bg-surface-container-low rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function TeamSkeleton() {
  return (
    <div className="px-12 py-6 flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-surface-container-low rounded-xl" />
          <div className="h-5 w-56 bg-surface-container-low rounded-lg" />
        </div>
        <div className="h-12 w-40 bg-surface-container-low rounded-full" />
      </div>

      {/* Team Member Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-80 bg-surface-container-low rounded-2xl" />
        ))}
      </div>

      {/* Activity Skeleton */}
      <div className="h-64 bg-surface-container-low rounded-2xl" />
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl h-72 animate-pulse" />
  )
}
