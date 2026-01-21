import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLevelForWeek, getLevelName, getInitials } from "@/lib/utils"
import { ArrowLeft, ArrowRight, ExternalLink, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { DemoVoteButton } from "@/components/weeks/demo-vote-button"
import { SubmitDemoButton } from "@/components/weeks/submit-demo-button"
import type { Week, Demo } from "@/types/database"

export const revalidate = 60

interface Props {
  params: Promise<{ number: string }>
}

export default async function WeekDetailPage({ params }: Props) {
  const { number } = await params
  const weekNumber = parseInt(number)

  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    notFound()
  }

  const supabase = await createClient()

  const { data: weekData } = await supabase
    .from("weeks")
    .select("*")
    .eq("number", weekNumber)
    .eq("published", true)
    .single()

  const week = weekData as Week | null

  if (!week) {
    notFound()
  }

  // Get demos for this week with vote counts
  const { data: demosData } = await supabase
    .from("demos")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .eq("week_id", week.id)
    .order("created_at", { ascending: false })

  const demos = demosData as Demo[] | null

  // Get vote counts for demos
  const demoIds = demos?.map((d) => d.id) || []
  const { data: votesData } = await supabase
    .from("votes")
    .select("demo_id, value")
    .in("demo_id", demoIds)

  const votes = votesData as { demo_id: string; value: number }[] | null

  // Calculate vote totals
  const voteMap = new Map<string, number>()
  votes?.forEach((vote) => {
    const current = voteMap.get(vote.demo_id) || 0
    voteMap.set(vote.demo_id, current + vote.value)
  })

  const level = getLevelForWeek(weekNumber)
  const prevWeek = weekNumber > 1 ? weekNumber - 1 : null
  const nextWeek = weekNumber < 10 ? weekNumber + 1 : null

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
          <Badge variant={`level${level}` as "level1" | "level2" | "level3"}>
            Week {weekNumber}
          </Badge>
          <Badge variant="outline">{getLevelName(level)}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{week.title}</h1>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prework">Pre-work</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="demos">Demos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="prose prose-slate max-w-none">
          {week.overview ? (
            <ReactMarkdown>{week.overview}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">No overview available.</p>
          )}

          {week.resources && (
            <>
              <Separator className="my-6" />
              <h3>Resources</h3>
              <ReactMarkdown>{week.resources}</ReactMarkdown>
            </>
          )}
        </TabsContent>

        <TabsContent value="prework" className="prose prose-slate max-w-none">
          {week.prework ? (
            <ReactMarkdown>{week.prework}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">No pre-work for this week.</p>
          )}
        </TabsContent>

        <TabsContent value="session" className="prose prose-slate max-w-none">
          {week.session_plan ? (
            <ReactMarkdown>{week.session_plan}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">No session plan available.</p>
          )}
        </TabsContent>

        <TabsContent value="prompts">
          {week.prompts ? (
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-")
                    if (isBlock) {
                      return (
                        <div className="relative group">
                          <pre className="!mt-0">
                            <code className={className}>{children}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children))
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    }
                    return <code className={className}>{children}</code>
                  },
                }}
              >
                {week.prompts}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">No prompts for this week.</p>
          )}
        </TabsContent>

        <TabsContent value="demos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Submitted Demos ({demos?.length || 0})
              </h3>
              <SubmitDemoButton weekId={week.id} weekNumber={weekNumber} />
            </div>

            {demos && demos.length > 0 ? (
              <div className="space-y-3">
                {demos.map((demo) => (
                  <Card key={demo.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={demo.profile?.avatar_url || ""}
                              alt={demo.profile?.name || ""}
                            />
                            <AvatarFallback>
                              {getInitials(demo.profile?.name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{demo.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              by {demo.profile?.name}
                            </p>
                            {demo.description && (
                              <p className="text-sm mt-2">{demo.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DemoVoteButton
                            demoId={demo.id}
                            currentVotes={voteMap.get(demo.id) || 0}
                          />
                          {demo.url && (
                            <a
                              href={demo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No demos submitted yet. Be the first!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {week.feedback_url && (
            <div className="mt-6">
              <a
                href={week.feedback_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Submit Feedback
                </Button>
              </a>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
