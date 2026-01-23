import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WeekContent } from "@/components/weeks/week-content"
import { getLevelForWeek, getLevelName } from "@/lib/utils"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { Week, WeekSection, Demo } from "@/types/database"

export const revalidate = 60

interface Props {
  params: Promise<{ number: string }>
}

export default async function WeekDetailPage({ params }: Props) {
  const { number } = await params
  const supabase = await createClient()

  // Check if current user is admin
  const profile = await getProfile()
  const isAdmin = profile?.role === 'admin'

  // Determine if param is a UUID or a week number
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(number)
  const weekNumber = parseInt(number)

  // Get week by UUID or by number
  let weekData: Week | null = null

  if (isUUID) {
    const { data } = await supabase
      .from("weeks")
      .select("*")
      .eq("id", number)
      .single()
    weekData = data as Week | null
  } else if (!isNaN(weekNumber)) {
    const { data } = await supabase
      .from("weeks")
      .select("*")
      .eq("number", weekNumber)
      .single()
    weekData = data as Week | null
  }

  const week = weekData

  if (!week) {
    notFound()
  }

  // Get sections for this week
  const { data: sectionsData } = await supabase
    .from("week_sections")
    .select("*")
    .eq("week_id", week.id)
    .order("sort_order")

  const sections = (sectionsData as WeekSection[] | null) || []

  // Get demos for this week with vote counts
  const { data: demosData } = await supabase
    .from("demos")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .eq("week_id", week.id)
    .order("created_at", { ascending: false })

  const demos = (demosData as Demo[] | null) || []

  // Get vote counts for demos
  const demoIds = demos.map((d) => d.id)
  const { data: votesData } = await supabase
    .from("votes")
    .select("demo_id, value")
    .in("demo_id", demoIds.length > 0 ? demoIds : ['no-demos'])

  const votes = votesData as { demo_id: string; value: number }[] | null

  // Calculate vote totals
  const voteMap = new Map<string, number>()
  votes?.forEach((vote) => {
    const current = voteMap.get(vote.demo_id) || 0
    voteMap.set(vote.demo_id, current + vote.value)
  })

  // For numbered weeks, calculate level and navigation
  const hasNumber = week.number !== null
  const level = hasNumber ? getLevelForWeek(week.number!) : week.level
  const prevWeek = hasNumber && week.number! > 1 ? week.number! - 1 : null
  const nextWeek = hasNumber && week.number! < 10 ? week.number! + 1 : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/weeks">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            All Weeks
          </Button>
        </Link>
        <div className="flex gap-2">
          {prevWeek && (
            <Link href={`/weeks/${prevWeek}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Week {prevWeek}
              </Button>
            </Link>
          )}
          {nextWeek && (
            <Link href={`/weeks/${nextWeek}`}>
              <Button variant="outline" size="sm">
                Week {nextWeek}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {hasNumber ? (
            <Badge variant={`level${level}` as "level1" | "level2" | "level3"}>
              Week {week.number}
            </Badge>
          ) : (
            <Badge variant="outline">Unnumbered</Badge>
          )}
          <Badge variant="outline">{getLevelName(level)}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{week.title}</h1>
      </div>

      {/* Week Content with Admin Editing */}
      <WeekContent
        week={week}
        sections={sections}
        demos={demos}
        voteMap={voteMap}
        isAdmin={isAdmin}
      />
    </div>
  )
}
