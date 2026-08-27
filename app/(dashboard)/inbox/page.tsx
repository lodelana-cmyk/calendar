import { getIdeas } from "@/lib/data"
import { InboxView } from "@/components/inbox-view"

export const dynamic = "force-dynamic"

export default async function InboxPage() {
  const ideas = await getIdeas()

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight text-balance">
          Inbox
        </h1>
        <p className="text-sm text-on-surface-variant font-medium">
          Quick-capture ideas before they become campaigns or content
        </p>
      </div>
      <InboxView initialIdeas={ideas} />
    </div>
  )
}
