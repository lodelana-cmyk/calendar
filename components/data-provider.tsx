"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { getCampaignsWithItemsClient, getProfilesClient } from "@/lib/data-client"
import type { CampaignWithItems, Profile } from "@/lib/database.types"

export function DataProvider({
  children,
  initialCampaigns,
  initialProfiles,
}: {
  children: React.ReactNode
  initialCampaigns: CampaignWithItems[]
  initialProfiles: Profile[]
}) {
  const { setCampaigns, setProfiles } = useStore()

  useEffect(() => {
    setCampaigns(initialCampaigns)
    setProfiles(initialProfiles)
  }, [initialCampaigns, initialProfiles, setCampaigns, setProfiles])

  return <>{children}</>
}

export function useRefreshData() {
  const { setCampaigns, setProfiles } = useStore()

  const refreshAll = async () => {
    const [campaigns, profiles] = await Promise.all([
      getCampaignsWithItemsClient(),
      getProfilesClient(),
    ])
    setCampaigns(campaigns)
    setProfiles(profiles)
  }

  const refreshCampaigns = async () => {
    const campaigns = await getCampaignsWithItemsClient()
    setCampaigns(campaigns)
  }

  const refreshProfiles = async () => {
    const profiles = await getProfilesClient()
    setProfiles(profiles)
  }

  return { refreshAll, refreshCampaigns, refreshProfiles }
}
