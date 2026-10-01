"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { MOTION_OPTIONS, CHANNEL_OPTIONS, PRODUCT_OPTIONS } from "@/lib/database.types"
import { Button, Field, PageHeader, Pill, Section, fieldCls } from "@/components/kit"

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("The Editorial Studio")
  const [saved, setSaved]     = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 py-10 flex flex-col max-w-2xl mx-auto w-full">
      <PageHeader title="Settings" subtitle="Your workspace." />

      <div className="flex flex-col mt-2">
        <Section title="General">
          <Field label="Workspace name">
            <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} className={fieldCls} />
          </Field>
        </Section>

        <Section title="Campaign motions" description="Motion categories used across campaigns.">
          <div className="flex flex-wrap gap-2">
            {MOTION_OPTIONS.map(m => <Pill key={m} className="px-3 py-1 text-[13px]">{m}</Pill>)}
          </div>
          <p className="text-[13px] text-on-surface-variant">Motions are defined in code. Ask your developer to add or rename them.</p>
        </Section>

        <Section title="Channels" description="Distribution channels available when creating content items.">
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map(c => <Pill key={c} className="px-3 py-1 text-[13px]">{c}</Pill>)}
          </div>
        </Section>

        <Section title="Products" description="Threecolts products used to tag campaigns.">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_OPTIONS.map(p => <Pill key={p} className="px-3 py-1 text-[13px]">{p}</Pill>)}
          </div>
        </Section>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave}>
          {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
