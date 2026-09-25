"use client"

import { Search, Menu } from "lucide-react"
import { useStore } from "@/lib/store"
import { useState } from "react"

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { filters, setFilters } = useStore()
  const [searchValue, setSearchValue] = useState(filters.search ?? "")

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setFilters({ ...filters, search: value })
  }

  return (
    <header className="w-full h-12 sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/30 flex items-center gap-4 px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search campaigns and content…"
          className="pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg w-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
      </div>
    </header>
  )
}
