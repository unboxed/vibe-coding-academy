import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { WeeksListContent } from "@/components/weeks/weeks-list-content"
import type { Week } from "@/types/database"

export const revalidate = 60

export default async function WeeksPage() {
  const supabase = await createClient()

  // Check if current user is admin
  const currentProfile = await getProfile()
  const isAdmin = currentProfile?.role === 'admin'

  // Fetch all weeks
  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .order("number")
  const weeks = (weeksData as Week[]) || []

  // Get demo counts per week
  const { data: demoCountsData } = await supabase
    .from("demos")
    .select("week_id")

  const demoCounts = demoCountsData as { week_id: string }[] | null

  const demoCountMap = new Map<string, number>()
  demoCounts?.forEach((demo) => {
    const count = demoCountMap.get(demo.week_id) || 0
    demoCountMap.set(demo.week_id, count + 1)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground mt-2">
          10 weeks from idea to deployed application
        </p>
      </div>

      <WeeksListContent
        weeks={weeks}
        demoCountMap={demoCountMap}
        isAdmin={isAdmin}
      />
    </div>
  )
}
