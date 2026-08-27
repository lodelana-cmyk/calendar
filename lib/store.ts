import { create } from "zustand"
import type { CampaignWithItems, Profile, AppRole } from "./database.types"

interface StoreState {
  campaigns: CampaignWithItems[]
  profiles: Profile[]
  teamMembers: Profile[]
  currentUser: Profile | null
  isLoading: boolean

  // Actions
  setCampaigns: (campaigns: CampaignWithItems[]) => void
  setProfiles: (profiles: Profile[]) => void
  setCurrentUser: (user: Profile | null) => void
  setIsLoading: (loading: boolean) => void
}

export const useStore = create<StoreState>((set, get) => ({
  campaigns: [],
  profiles: [],
  teamMembers: [],
  currentUser: null,
  isLoading: true,

  setCampaigns: (campaigns) => set({ campaigns }),

  setProfiles: (profiles) =>
    set({
      profiles,
      teamMembers: profiles,
      isLoading: false,
    }),

  setCurrentUser: (currentUser) => set({ currentUser }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))

/** Returns true if the current user has editor role */
export function useIsEditor(): boolean {
  const { currentUser } = useStore()
  return !currentUser || currentUser.app_role === "editor"
}

/** @deprecated — use useStore().profiles */
export const TEAM_MEMBERS: { name: string }[] = []
