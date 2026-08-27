"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { updateContentItemClient } from "./data-client"
import type {
  CampaignWithItems,
  ContentItemWithCampaign,
  ContentStatus,
  Profile,
  CampaignMotion,
  ContentChannel,
} from "./database.types"

export interface CalendarFilters {
  channel: ContentChannel | "All"
  assignee: string | "All"
  motion: CampaignMotion | "All"
  search: string
}

interface StoreContextType {
  // Data
  campaigns: CampaignWithItems[]
  profiles: Profile[]
  /** Alias for profiles — all team members */
  teamMembers: Profile[]
  currentUser: Profile | null
  settings: Record<string, string[]>
  isLoading: boolean
  setCampaigns: (campaigns: CampaignWithItems[]) => void
  setProfiles: (profiles: Profile[]) => void
  setCurrentUser: (user: Profile | null) => void
  setSettings: (settings: Record<string, string[]>) => void
  // Calendar UI state
  calendarView: "month" | "week" | "list"
  setCalendarView: (view: "month" | "week" | "list") => void
  calendarDate: Date
  setCalendarDate: (date: Date) => void
  filters: CalendarFilters
  setFilters: (filters: CalendarFilters) => void
  // Optimistic mutations
  updateItemStatus: (itemId: string, status: ContentStatus) => Promise<void>
  updateItemDate: (itemId: string, publishDate: string | null) => Promise<void>
  refreshKey: number
  triggerRefresh: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({
  children,
  initialCampaigns = [],
  initialProfiles = [],
  initialCurrentUser = null,
  initialSettings = {},
}: {
  children: ReactNode
  initialCampaigns?: CampaignWithItems[]
  initialProfiles?: Profile[]
  initialCurrentUser?: Profile | null
  initialSettings?: Record<string, string[]>
}) {
  const [campaigns, setCampaigns] = useState<CampaignWithItems[]>(initialCampaigns)
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [currentUser, setCurrentUser] = useState<Profile | null>(initialCurrentUser)
  const [settings, setSettings] = useState<Record<string, string[]>>(initialSettings)
  const [calendarView, setCalendarView] = useState<"month" | "week" | "list">("month")
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [refreshKey, setRefreshKey] = useState(0)
  const [filters, setFilters] = useState<CalendarFilters>({
    channel: "All",
    assignee: "All",
    motion: "All",
    search: "",
  })

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const updateItemStatus = useCallback(async (itemId: string, status: ContentStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((item) =>
          item.id === itemId ? { ...item, status } : item
        ),
      }))
    )
    try {
      await updateContentItemClient(itemId, { status })
    } catch (e) {
      console.error("Failed to update item status:", e)
    }
  }, [])

  const updateItemDate = useCallback(async (itemId: string, publishDate: string | null) => {
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((item) =>
          item.id === itemId ? { ...item, publish_date: publishDate } : item
        ),
      }))
    )
    try {
      await updateContentItemClient(itemId, { publish_date: publishDate })
    } catch (e) {
      console.error("Failed to update item date:", e)
    }
  }, [])

  return (
    <StoreContext.Provider
      value={{
        campaigns,
        profiles,
        teamMembers: profiles,
        isLoading: false,
        currentUser,
        settings,
        setCampaigns,
        setProfiles,
        setCurrentUser,
        setSettings,
        calendarView,
        setCalendarView,
        calendarDate,
        setCalendarDate,
        filters,
        setFilters,
        updateItemStatus,
        updateItemDate,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}

export function useIsEditor(): boolean {
  const { currentUser } = useStore()
  return currentUser?.app_role === "editor"
}
