"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { MOTION_OPTIONS, CHANNEL_OPTIONS, PRODUCT_OPTIONS } from "@/lib/database.types"

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("The Editorial Studio")
  const [saved, setSaved]     = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h1>
        <p className="text-sm text-on-surface-variant font-medium">Configure your workspace</p>
      </div>

      {/* General */}
      <Section title="General">
        <Field label="Workspace name">
          <input
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
            className="field-input"
          />
        </Field>
      </Section>

      {/* Motions */}
      <Section title="Campaign Motions" description="Colour-coded motion categories used across campaigns">
        <div className="flex flex-wrap gap-2">
          {MOTION_OPTIONS.map(m => (
            <span key={m} className="text-xs px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface font-medium">
              {m}
            </span>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant mt-1">Motions are defined in code. Contact your developer to add or rename them.</p>
      </Section>

      {/* Channels */}
      <Section title="Channels" description="Distribution channels available when creating content items">
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map(c => (
            <span key={c} className="text-xs px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface font-medium">
              {c}
            </span>
          ))}
        </div>
      </Section>

      {/* Products */}
      <Section title="Products" description="Threecolts product list used to tag campaigns">
        <div className="flex flex-wrap gap-2">
          {PRODUCT_OPTIONS.map(p => (
            <span key={p} className="text-xs px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface font-medium">
              {p}
            </span>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
        </button>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-container p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-on-surface">{title}</h2>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
