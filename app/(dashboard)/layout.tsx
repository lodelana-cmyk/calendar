export const dynamic = "force-dynamic"
import { StoreProvider } from "@/lib/store"
import { DashboardLayoutClient } from "@/components/dashboard-layout-client"
import { getCampaignsWithItems, getProfiles, getSettings, getCurrentUserProfile } from "@/lib/data"
import type { CampaignWithItems, Profile } from "@/lib/database.types"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let campaigns: CampaignWithItems[] = []
  let profiles: Profile[] = []
  let currentUser: Profile | null = null
  let settings: Record<string, string[]> = {}

  try {
    ;[campaigns, profiles, currentUser] = await Promise.all([
      getCampaignsWithItems(),
      getProfiles(),
      getCurrentUserProfile(),
    ])
    const rawSettings = await getSettings()
    settings = {
      products: (rawSettings.products as string[]) ?? [],
      channels: (rawSettings.channels as string[]) ?? [],
    }
  } catch (e) {
    console.error("Dashboard layout fetch error:", e)
  }

  return (
    <StoreProvider
      initialCampaigns={campaigns}
      initialProfiles={profiles}
      initialCurrentUser={currentUser}
      initialSettings={settings}
    >
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </StoreProvider>
  )
}
