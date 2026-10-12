"use client"

import { ExternalLink } from "lucide-react"
import { linkCls, cx } from "@/components/kit"

const DOC_RE = /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/

/** The embeddable preview URL for a Google Docs/Sheets/Slides link, or null for anything else. */
export function googleDocPreviewUrl(url: string | null | undefined): string | null {
  const m = url?.trim().match(DOC_RE)
  return m ? `https://docs.google.com/${m[1]}/d/${m[2]}/preview` : null
}

/**
 * Inline preview of a Google Doc. Only docs.google.com links are embedded
 * (rebuilt from the id, so nothing else can be framed). Google decides what
 * shows: the doc must be shared with whoever is viewing, so a blank frame
 * usually means "not shared with you" — hence the open-in-Docs link.
 */
export function GoogleDocEmbed({ url }: { url: string | null | undefined }) {
  const src = googleDocPreviewUrl(url)
  if (!src) return null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <iframe src={src} title="Google Doc preview" className="w-full h-80" loading="lazy" />
      </div>
      <p className="text-xs text-on-surface-variant">
        Blank? The doc may not be shared with you.{" "}
        <a href={url!.trim()} target="_blank" rel="noopener noreferrer" className={cx("inline-flex items-center gap-1", linkCls)}>
          Open in Google Docs <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  )
}
