import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLevelForWeek, getLevelName } from "@/lib/utils"
import { ArrowRight, CheckCircle } from "lucide-react"

export const revalidate = 60

const levelColors = {
  1: { bg: "bg-[hsl(199,89%,48%)]", text: "text-white", border: "border-[hsl(199,89%,48%)]" },
  2: { bg: "bg-[hsl(262,83%,58%)]", text: "text-white", border: "border-[hsl(262,83%,58%)]" },
  3: { bg: "bg-[hsl(142,76%,36%)]", text: "text-white", border: "border-[hsl(142,76%,36%)]" },
}

export default async function WeeksPage() {
  const supabase = await createClient()

  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("published", true)
    .order("number")

  // Get demo counts per week
  const { data: demoCounts } = await supabase
    .from("demos")
    .select("week_id")

  const demoCountMap = new Map<string, number>()
  demoCounts?.forEach((demo) => {
    const count = demoCountMap.get(demo.week_id) || 0
    demoCountMap.set(demo.week_id, count + 1)
  })

  // Group weeks by level
  const weeksByLevel = weeks?.reduce((acc, week) => {
    const level = getLevelForWeek(week.number)
    if (!acc[level]) acc[level] = []
    acc[level].push(week)
    return acc
  }, {} as Record<number, typeof weeks>)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground mt-2">
          10 weeks from idea to deployed application
        </p>
      </div>

      <div className="space-y-12">
        {[1, 2, 3].map((level) => (
          <section key={level}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`h-8 w-1 rounded-full ${levelColors[level as keyof typeof levelColors].bg}`}
              />
              <div>
                <h2 className="text-xl font-semibold">{getLevelName(level)}</h2>
                <p className="text-sm text-muted-foreground">
                  {level === 1 && "Weeks 1-3: Foundation"}
                  {level === 2 && "Weeks 4-5: Intermediate"}
                  {level === 3 && "Weeks 6-10: Advanced"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeksByLevel?.[level]?.map((week) => (
                <Link key={week.id} href={`/weeks/${week.number}`}>
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/50 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={`level${level}` as "level1" | "level2" | "level3"}
                        >
                          Week {week.number}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <CardTitle className="text-lg mt-2">{week.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {week.overview && (
                        <CardDescription className="line-clamp-2">
                          {week.overview.replace(/^#+\s*Overview\s*\n*/i, "").replace(/^#+\s*[^\n]+\n*/gm, "").slice(0, 150)}...
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        {demoCountMap.get(week.id) ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {demoCountMap.get(week.id)} demos
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {(!weeks || weeks.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No weeks available yet.</p>
        </div>
      )}
    </div>
  )
}
