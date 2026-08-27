"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, List,
  Sparkles, Download, Columns
} from "lucide-react"
import { useStore } from "@/lib/store"
import { useRefreshData } from "@/components/data-provider"
import { updateContentItemClient } from "@/lib/data-client"
import type { ContentItemWithCampaign, ItemStatus } from "@/lib/database.types"
import {
  MOTION_ACCENTS, CHANNEL_ICONS, STATUS_COLORS,
  CHANNEL_OPTIONS, MOTION_OPTIONS, STATUS_OPTIONS, PRODUCT_OPTIONS
} from "@/lib/database.types"
import { ContentItemChip } from "@/components/content-item-chip"
import { ContentItemDialog } from "@/components/content-item-dialog"
import { ImportPlanDialog } from "@/components/import-plan-dialog"
import { ExportCalendarDialog } from "@/components/export-calendar-dialog"

// ─── date helpers ────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Mon–Fri grid for the month, padded so columns align */
function weekdayGrid(year: number, month: number): (string | null)[][] {
  const weeks: (string | null)[][] = []
  let current: (string | null)[] = []
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)

  const firstDow = first.getDay()
  if (firstDow >= 2 && firstDow <= 5) {
    for (let i = 1; i < firstDow; i++) current.push(null)
  } else if (firstDow === 1) {
    // Monday — no padding
  } else {
    // Sunday or Saturday — skip to next Monday
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d)
    const dow  = date.getDay()
    if (dow === 0 || dow === 6) continue
    if (dow === 1 && current.length > 0) {
      while (current.length < 5) current.push(null)
      weeks.push(current)
      current = []
    }
    current.push(toDateStr(date))
  }
  if (current.length > 0) {
    while (current.length < 5) current.push(null)
    weeks.push(current)
  }
  return weeks
}

/** Mon–Fri of the ISO week containing `date` */
function currentWeekDays(date: Date): (string | null)[] {
  const dow = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateStr(d)
  })
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

type ViewMode = "month" | "week" | "list"

// ─── component ───────────────────────────────────────────────────────────────

export function ContentCalendar() {
  const { campaigns, profiles, setCampaigns } = useStore()
  const { refreshCampaigns } = useRefreshData()

  const today       = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView]   = useState<ViewMode>("month")

  // week nav for week view
  const [weekAnchor, setWeekAnchor] = useState(today)

  // filters — synced with URL so filtered views are shareable
  const [filterCampaign, setFilterCampaign] = useState("All")
  const [filterChannel,  setFilterChannel]  = useState("All")
  const [filterAssignee, setFilterAssignee] = useState("All")
  const [filterMotion,   setFilterMotion]   = useState("All")
  const [filterProduct,  setFilterProduct]  = useState("All")
  const [filterStatus,   setFilterStatus]   = useState("All")

  // Read filters from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("campaign")) setFilterCampaign(p.get("campaign")!)
    if (p.get("channel"))  setFilterChannel(p.get("channel")!)
    if (p.get("assignee")) setFilterAssignee(p.get("assignee")!)
    if (p.get("motion"))   setFilterMotion(p.get("motion")!)
    if (p.get("product"))  setFilterProduct(p.get("product")!)
    if (p.get("status"))   setFilterStatus(p.get("status")!)
  }, [])

  // Write filters back to URL (shareable links)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const setOrDelete = (k: string, v: string) => (v !== "All" ? p.set(k, v) : p.delete(k))
    setOrDelete("campaign", filterCampaign)
    setOrDelete("channel",  filterChannel)
    setOrDelete("assignee", filterAssignee)
    setOrDelete("motion",   filterMotion)
    setOrDelete("product",  filterProduct)
    setOrDelete("status",   filterStatus)
    const qs = p.toString()
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
  }, [filterCampaign, filterChannel, filterAssignee, filterMotion, filterProduct, filterStatus])

  // dialogs
  const [selectedItem, setSelectedItem] = useState<ContentItemWithCampaign | null>(null)
  const [newItemDate,  setNewItemDate]   = useState<string | null>(null)
  const [importOpen,   setImportOpen]    = useState(false)
  const [exportOpen,   setExportOpen]    = useState(false)

  // drag & drop
  const dragItem  = useRef<ContentItemWithCampaign | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  // ── flatten all items ──────────────────────────────────────────────────────

  const allItems: ContentItemWithCampaign[] = useMemo(() =>
    campaigns.flatMap(c =>
      (c.items || []).map(item => ({ ...item, campaign: c }))
    ), [campaigns])

  // ── apply filters ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => allItems.filter(item => {
    if (filterCampaign !== "All" && item.campaign_id !== filterCampaign) return false
    if (filterChannel  !== "All" && item.channel  !== filterChannel)     return false
    if (filterAssignee !== "All" && item.assignee_id !== filterAssignee) return false
    if (filterMotion   !== "All" && item.campaign.motion !== filterMotion) return false
    if (filterProduct  !== "All" && item.campaign.product !== filterProduct) return false
    if (filterStatus   !== "All" && item.status !== filterStatus) return false
    return true
  }), [allItems, filterCampaign, filterChannel, filterAssignee, filterMotion, filterProduct, filterStatus])

  // ── navigation ─────────────────────────────────────────────────────────────

  const goBack = () => {
    if (view === "week") {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() - 7)
      setWeekAnchor(d)
    } else if (view === "month") {
      if (month === 0) { setYear(y => y - 1); setMonth(11) }
      else setMonth(m => m - 1)
    }
  }

  const goForward = () => {
    if (view === "week") {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() + 7)
      setWeekAnchor(d)
    } else if (view === "month") {
      if (month === 11) { setYear(y => y + 1); setMonth(0) }
      else setMonth(m => m + 1)
    }
  }

  const navLabel = view === "week"
    ? (() => {
        const days = currentWeekDays(weekAnchor).filter(Boolean) as string[]
        const start = parseDateStr(days[0])
        const end   = parseDateStr(days[days.length - 1])
        return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`
      })()
    : `${MONTHS[month]} ${year}`

  // ── item helpers ──────────────────────────────────────────────────────────

  const itemsForDate = (date: string) =>
    filtered.filter(item => item.publish_date === date && item.status !== "Idea")

  // Spec: the unscheduled lane holds ideas and anything without a publish date
  const unscheduled = filtered.filter(item => !item.publish_date || item.status === "Idea")

  // ── drag & drop ──────────────────────────────────────────────────────────

  const handleDragStart = (item: ContentItemWithCampaign, e: React.DragEvent) => {
    dragItem.current = item
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = async (date: string | null, e: React.DragEvent) => {
    e.preventDefault()
    const item = dragItem.current
    dragItem.current = null
    setDragOverDate(null)
    if (!item || item.publish_date === date) return

    // Spec: dragging an Idea onto a date promotes it to Planned
    const patch: { publish_date: string | null; status?: ItemStatus } =
      date && item.status === "Idea"
        ? { publish_date: date, status: "Planned" }
        : { publish_date: date }

    // optimistic
    setCampaigns(campaigns.map(c => {
      if (c.id !== item.campaign_id) return c
      return { ...c, items: (c.items || []).map(it =>
        it.id === item.id ? { ...it, ...patch } : it
      )}
    }))
    try {
      await updateContentItemClient(item.id, patch)
    } catch {
      refreshCampaigns()
    }
  }

  // ── open helpers ─────────────────────────────────────────────────────────���

  const openItem = (item: ContentItemWithCampaign) => setSelectedItem(item)
  const openNew  = (date: string | null) => setNewItemDate(date ?? "")

  // ── cell renderer ─────────────────────────────────────────────────────────

  const renderCell = (date: string | null, mini = false) => {
    const isToday   = date === toDateStr(today)
    const isTarget  = date !== null && date === dragOverDate
    const dayNum    = date ? parseDateStr(date).getDate() : null
    const items     = date ? itemsForDate(date) : []

    return (
      <div
        onDragOver={e => { e.preventDefault(); if (date) setDragOverDate(date) }}
        onDragLeave={() => { if (dragOverDate === date) setDragOverDate(null) }}
        onDrop={e => handleDrop(date, e)}
        className={`flex flex-col gap-1 p-1.5 sm:p-2 transition-colors ${
          !date ? "bg-surface-container-low/40" : ""
        } ${isToday ? "bg-primary/5" : ""} ${
          isTarget ? "bg-primary/10 ring-2 ring-inset ring-primary/40" : ""
        }`}
      >
        {date && (
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-xs font-semibold leading-none ${
              isToday
                ? "bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center"
                : "text-on-surface-variant"
            }`}>{dayNum}</span>
            {!mini && (
              <button
                onClick={() => openNew(date)}
                className="opacity-0 group-hover/cell:opacity-100 h-4 w-4 rounded flex items-center justify-center hover:bg-surface-container-high transition-all"
              >
                <Plus className="h-3 w-3 text-on-surface-variant" />
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {items.map(item => (
            <ContentItemChip
              key={item.id}
              item={item}
              onClick={() => openItem(item)}
              onDragStart={e => handleDragStart(item, e)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── month grid ────────────────────────────────────────────────────────────

  const renderMonthGrid = () => {
    const grid = weekdayGrid(year, month)
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        {/* weekday headers */}
        <div className="grid grid-cols-5 border-b border-border bg-surface-container-low">
          {WEEKDAY_LABELS.map(d => (
            <div key={d} className="text-center py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 border-b border-border last:border-b-0 divide-x divide-border">
            {week.map((date, di) => (
              <div key={di} className="min-h-[110px] group/cell">
                {renderCell(date)}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── week grid ─────────────────────────────────────────────────────────────

  const renderWeekGrid = () => {
    const days = currentWeekDays(weekAnchor)
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-5 border-b border-border bg-surface-container-low">
          {days.map((date, i) => {
            const isToday = date === toDateStr(today)
            const d = date ? parseDateStr(date) : null
            return (
              <div key={i} className={`text-center py-3 ${isToday ? "bg-primary/10" : ""}`}>
                <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{WEEKDAY_LABELS[i]}</div>
                {d && <div className={`text-lg font-bold mt-0.5 ${isToday ? "text-primary" : "text-on-surface"}`}>{d.getDate()}</div>}
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-5 divide-x divide-border">
          {days.map((date, di) => (
            <div key={di} className="min-h-[300px] group/cell">
              {renderCell(date)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── list view ─────────────────────────────────────────────────────────────

  const renderListView = () => {
    const grid = weekdayGrid(year, month)
    return (
      <div className="flex flex-col gap-6">
        {grid.map((week, wi) => {
          const dates = week.filter(Boolean) as string[]
          const items = dates.flatMap(d => itemsForDate(d))
          if (!items.length) return null
          const start = parseDateStr(dates[0])
          const end   = parseDateStr(dates[dates.length - 1])
          const done  = items.filter(i => i.status === "Published").length
          return (
            <div key={wi} className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-border">
                <span className="text-sm font-semibold text-on-surface">
                  Week {wi + 1} — {MONTHS[start.getMonth()].slice(0,3)} {start.getDate()}–{end.getDate()}
                </span>
                <span className="text-xs text-on-surface-variant">{done}/{items.length} published</span>
              </div>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-container-low/60 transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[item.status as ItemStatus]?.dot || "#94a3b8" }} aria-hidden="true" />
                  <span className="text-sm font-medium text-on-surface flex-1 truncate">{item.title}</span>
                  <span className="text-xs text-on-surface-variant flex-shrink-0">{item.publish_date ? parseDateStr(item.publish_date).toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : ""}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 border border-outline-variant bg-surface-container-low text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MOTION_ACCENTS[item.campaign.motion] || "#94a3b8" }} aria-hidden="true" />
                    {item.campaign.motion}
                  </span>
                  <span className="text-xs text-on-surface-variant flex-shrink-0">{CHANNEL_ICONS[item.channel] || ""} {item.channel}</span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // ── unscheduled lane ──────────────────────────────────────────────────────

  const renderUnscheduled = () => {
    if (!unscheduled.length) return null
    return (
      <div
        className="rounded-2xl border-2 border-dashed border-outline-variant overflow-hidden"
        onDragOver={e => { e.preventDefault(); setDragOverDate("__unscheduled__") }}
        onDragLeave={() => { if (dragOverDate === "__unscheduled__") setDragOverDate(null) }}
        onDrop={e => handleDrop(null, e)}
      >
        <div className={`flex items-center justify-between px-4 py-3 transition-colors ${
          dragOverDate === "__unscheduled__" ? "bg-primary/10" : "bg-surface-container-low"
        }`}>
          <span className="text-sm font-semibold text-on-surface-variant">Unscheduled ({unscheduled.length})</span>
          <button onClick={() => openNew(null)} className="text-xs text-primary hover:underline font-medium">+ Add item</button>
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {unscheduled.map(item => (
            <ContentItemChip
              key={item.id}
              item={item}
              onClick={() => openItem(item)}
              onDragStart={e => handleDragStart(item, e)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── legend ────────────────────────────────────────────────────────────────

  const usedMotions = [...new Set(campaigns.map(c => c.motion).filter(Boolean))]

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Nav */}
        <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-xl px-1 py-1">
          <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-sm font-semibold text-on-surface min-w-[180px] text-center">{navLabel}</span>
          <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View switcher */}
        <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          {(["month","week","list"] as ViewMode[]).map((v) => {
            const Icon = v === "month" ? CalendarDays : v === "week" ? Columns : List
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors capitalize ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {v}
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Campaign — first and most prominent */}
          <select
            value={filterCampaign}
            onChange={e => setFilterCampaign(e.target.value)}
            className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          >
            <option value="All">All campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          {/* Remaining scalar filters */}
          {[
            { value: filterMotion,   setter: setFilterMotion,   label: "All motions",   options: MOTION_OPTIONS },
            { value: filterChannel,  setter: setFilterChannel,  label: "All channels",  options: CHANNEL_OPTIONS },
            { value: filterStatus,   setter: setFilterStatus,   label: "All statuses",  options: STATUS_OPTIONS },
            { value: filterProduct,  setter: setFilterProduct,  label: "All products",  options: PRODUCT_OPTIONS },
          ].map(({ value, setter, label, options }) => (
            <select
              key={label}
              value={value}
              onChange={e => setter(e.target.value)}
              className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              <option value="All">{label}</option>
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          >
            <option value="All">All assignees</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={() => openNew("")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Import</span>
        </button>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Motion legend — neutral pills with accent dot */}
      {usedMotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {usedMotions.map(motion => {
            const accent = MOTION_ACCENTS[motion] || "#94a3b8"
            return (
              <span key={motion} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-outline-variant bg-surface-container text-xs font-medium text-on-surface-variant">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} aria-hidden="true" />
                {motion}
              </span>
            )
          })}
        </div>
      )}

      {/* Unscheduled lane */}
      {renderUnscheduled()}

      {/* Calendar body */}
      {view === "month" && renderMonthGrid()}
      {view === "week"  && renderWeekGrid()}
      {view === "list"  && renderListView()}

      {/* Stats row */}
      {(() => {
        const inRange = view === "month"
          ? filtered.filter(i => i.publish_date?.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
          : filtered
        const done     = inRange.filter(i => i.status === "Published").length
        const inprog   = inRange.filter(i => i.status === "In progress").length
        const inreview = inRange.filter(i => i.status === "In review").length
        const sched    = inRange.filter(i => i.status === "Scheduled").length
        return (
          <div className="flex items-center gap-6 px-1 mt-1">
            {[
              { label: "Total",      val: inRange.length, dot: "#94a3b8" },
              { label: "Published",  val: done,           dot: STATUS_COLORS["Published"]?.dot || "#10b981" },
              { label: "In Progress",val: inprog,         dot: STATUS_COLORS["In progress"]?.dot || "#3b82f6" },
              { label: "In Review",  val: inreview,       dot: STATUS_COLORS["In review"]?.dot  || "#f59e0b" },
              { label: "Scheduled",  val: sched,          dot: STATUS_COLORS["Scheduled"]?.dot  || "#8b5cf6" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} aria-hidden="true" />
                <span className="text-lg font-bold text-on-surface tabular-nums">{s.val}</span>
                <span className="text-xs text-on-surface-variant">{s.label}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Dialogs */}
      {selectedItem && (
        <ContentItemDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={open => { if (!open) setSelectedItem(null) }}
        />
      )}
      {newItemDate !== null && (
        <ContentItemDialog
          item={null}
          defaultDate={newItemDate}
          open={newItemDate !== null}
          onOpenChange={open => { if (!open) setNewItemDate(null) }}
        />
      )}
      <ImportPlanDialog open={importOpen} onOpenChange={setImportOpen} calendarYear={year} calendarMonth={month} />
      <ExportCalendarDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        items={allItems}
        year={year}
        month={month}
      />
    </div>
  )
}
