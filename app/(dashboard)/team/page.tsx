"use client"

import { useState } from "react"
import Image from "next/image"
import { UserPlus, Pencil, Users } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRefreshData } from "@/components/data-provider"
import { updateProfileClient } from "@/lib/data-client"
import { TeamSkeleton } from "@/components/loading-skeletons"
import { EditMemberDialog } from "@/components/edit-member-dialog"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import type { Profile } from "@/lib/database.types"

const ROLE_LABELS: Record<string, string> = {
  editor: "Editor",
  viewer: "Viewer",
}

export default function TeamPage() {
  const { teamMembers, campaigns, isLoading } = useStore()
  const { refreshProfiles } = useRefreshData()
  const [editingMember, setEditingMember] = useState<Profile | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  if (isLoading) return <TeamSkeleton />

  // item counts per person
  const countItems = (memberId: string) => {
    const items = campaigns.flatMap(c => c.items || [])
    const assigned = items.filter(i => i.assignee_id === memberId)
    const published = assigned.filter(i => i.status === "Published").length
    return { total: assigned.length, published }
  }

  const handleRoleToggle = async (member: Profile) => {
    const next = member.app_role === "editor" ? "viewer" : "editor"
    await updateProfileClient(member.id, { app_role: next })
    refreshProfiles()
  }

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Team</h1>
          <p className="text-sm text-on-surface-variant font-medium">
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="rounded-2xl border border-border p-16 flex flex-col items-center gap-4 text-center">
          <Users className="h-10 w-10 text-on-surface-variant" />
          <p className="text-sm text-on-surface-variant">No team members yet. Invite someone to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => {
            const { total, published } = countItems(member.id)
            const progress = total > 0 ? Math.round((published / total) * 100) : 0
            return (
              <div key={member.id} className="rounded-2xl border border-border bg-surface-container p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-outline-variant">
                      <Image
                        src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name}`}
                        alt={member.full_name}
                        width={48} height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-container ${member.is_online ? "bg-emerald-500" : "bg-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{member.full_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{member.role || "Team Member"}</p>
                  </div>
                  {/* Role badge + toggle */}
                  <button
                    onClick={() => handleRoleToggle(member)}
                    title="Click to toggle Editor/Viewer role"
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                      member.app_role === "editor"
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {ROLE_LABELS[member.app_role || "editor"] ?? "Editor"}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span><strong className="text-on-surface">{total}</strong> assigned</span>
                  <span><strong className="text-emerald-600">{published}</strong> published</span>
                </div>

                {/* Progress */}
                <div className="h-1.5 rounded-full bg-outline-variant overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingMember(member)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </button>
              </div>
            )
          })}
        </div>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={open => !open && setEditingMember(null)}
          onSaved={() => refreshProfiles()}
        />
      )}
    </div>
  )
}
