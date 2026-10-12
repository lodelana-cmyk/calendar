import { ImageResponse } from "next/og"

// Link preview for Slack, iMessage, LinkedIn etc. A stylised, zoomed-in
// calendar with made-up items — never real titles, since a shared link can
// travel outside the team. Generated once at build time.

export const alt = "Content Calendar — every campaign, channel and publish date in one place"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INSTAGRAM = "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #8134af 75%, #515bd4 100%)"
const CHANNEL: Record<string, string> = {
  YouTube: "#e00000", LinkedIn: "#0a66c2", Instagram: INSTAGRAM, TikTok: "#fe2c55",
  Blog: "#15803d", Email: "#b45309", Webinar: "#0e7490", Podcast: "#8b2fc9",
}

type Card = { title: string; campaign: string; dot: string; channel: string }
const C = (title: string, channel: string, campaign: string, dot: string): Card => ({ title, channel, campaign, dot })

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const ROWS: { day: number; cards: Card[] }[][] = [
  [
    { day: 5,  cards: [C("Product launch teaser", "YouTube", "Spring Launch", "#2563eb")] },
    { day: 6,  cards: [C("Customer story: 3x faster fulfilment", "LinkedIn", "Customers", "#7c3aed")] },
    { day: 7,  cards: [C("Behind the scenes at the studio", "Instagram", "Brand", "#047857")] },
    { day: 8,  cards: [] },
    { day: 9,  cards: [C("Five habits of top sellers", "Blog", "Seller Education", "#c2410c")] },
  ],
  [
    { day: 12, cards: [C("60-second feature tour", "TikTok", "Spring Launch", "#2563eb")] },
    { day: 13, cards: [C("Monthly product newsletter", "Email", "Retention", "#be185d")] },
    { day: 14, cards: [C("Launch day announcement", "LinkedIn", "Spring Launch", "#2563eb")] },
    { day: 15, cards: [C("Live Q&A with the product team", "Webinar", "Spring Launch", "#2563eb")] },
    { day: 16, cards: [C("Founder interview", "Podcast", "Brand", "#047857")] },
  ],
  [
    { day: 19, cards: [C("Deep dive: automation tips", "YouTube", "Seller Education", "#c2410c")] },
    { day: 20, cards: [] },
    { day: 21, cards: [C("Reel: a day in the warehouse", "Instagram", "Brand", "#047857")] },
    { day: 22, cards: [C("Why repricing beats guessing", "Blog", "Seller Education", "#c2410c")] },
    { day: 23, cards: [] },
  ],
]

const TODAY = 12
const COL_W = 236
const ROW_H = 214

function CalendarCard({ card }: { card: Card }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 10,
        background: CHANNEL[card.channel], color: "white",
        borderRadius: 14, padding: "13px 15px",
        boxShadow: "0 6px 16px rgba(20,20,20,0.12)",
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.25 }}>{card.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, opacity: 0.95 }}>
        <div style={{ width: 11, height: 11, borderRadius: 999, background: card.dot, border: "2px solid white" }} />
        <div style={{ display: "flex", flex: 1, whiteSpace: "nowrap" }}>{card.campaign}</div>
        <div style={{ display: "flex", fontSize: 12, padding: "2px 7px", borderRadius: 999, background: "rgba(0,0,0,0.2)" }}>{card.channel}</div>
      </div>
    </div>
  )
}

// Inter, to match the app. Google serves TTF (which the renderer needs) to a
// plain fetch; if it's unreachable the image falls back to the default font.
async function inter(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const weights = [400, 600, 700] as const
  const fonts = (await Promise.all(weights.map(inter)))
    .map((data, i) => data && { name: "Inter", data, weight: weights[i], style: "normal" as const })
    .filter(f => f !== null)

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#f1f0ed", fontFamily: "Inter, sans-serif" }}>
        {/* Zoomed-in, tilted calendar bleeding off the right edge */}
        <div
          style={{
            position: "absolute", left: 540, top: -40,
            display: "flex", flexDirection: "column",
            width: COL_W * WEEKDAYS.length, background: "#f8f7f4",
            border: "1px solid #dcdad5", borderRadius: 28,
            boxShadow: "0 30px 60px rgba(20,20,20,0.12)",
            transform: "rotate(-7deg)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", background: "#ebe9e5", borderBottom: "1px solid #dcdad5" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ display: "flex", justifyContent: "center", width: COL_W, padding: "16px 0", fontSize: 18, color: "#6b6966" }}>{d}</div>
            ))}
          </div>
          {ROWS.map((row, r) => (
            <div key={r} style={{ display: "flex", borderBottom: "1px solid #e3e1dc" }}>
              {row.map((cell, c) => (
                <div
                  key={cell.day}
                  style={{
                    display: "flex", flexDirection: "column", gap: 9,
                    width: COL_W, height: ROW_H, padding: 12,
                    borderLeft: c === 0 ? "none" : "1px solid #e3e1dc",
                  }}
                >
                  {cell.day === TODAY ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, background: "#141414", color: "white", fontSize: 16, fontWeight: 600 }}>{cell.day}</div>
                  ) : (
                    <div style={{ display: "flex", height: 34, alignItems: "center", paddingLeft: 4, fontSize: 17, color: "#8d8a85" }}>{cell.day}</div>
                  )}
                  {cell.cards.map((card, i) => <CalendarCard key={i} card={card} />)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Fade the calendar's left edge into the title area */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 640, height: 630, display: "flex", background: "linear-gradient(90deg, #f1f0ed 0%, #f1f0ed 72%, rgba(241,240,237,0) 100%)" }} />

        {/* Title */}
        <div style={{ position: "absolute", left: 72, top: 0, height: 630, width: 500, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#141414", letterSpacing: -3.5, lineHeight: 1 }}>Content</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#141414", letterSpacing: -3.5, lineHeight: 1 }}>Calendar</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 28, color: "#5c5a56", lineHeight: 1.35, maxWidth: 440 }}>
            Every campaign, channel and publish date in one place.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 34 }}>
            {["YouTube", "LinkedIn", "Instagram", "TikTok", "Blog"].map(ch => (
              <div key={ch} style={{ display: "flex", width: 30, height: 30, borderRadius: 999, background: CHANNEL[ch] }} />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
