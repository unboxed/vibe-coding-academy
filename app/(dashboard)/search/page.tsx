"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInitials, getLevelForWeek } from "@/lib/utils"
import { Search, Calendar, Users, Presentation } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)

  const [weeks, setWeeks] = useState<any[]>([])
  const [demos, setDemos] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setWeeks([])
      setDemos([])
      setPeople([])
      return
    }

    setIsSearching(true)

    try {
      const searchPattern = `%${searchQuery}%`

      // Search weeks
      const { data: weekResults } = await supabase
        .from("weeks")
        .select("*")
        .eq("published", true)
        .or(`title.ilike.${searchPattern},overview.ilike.${searchPattern},prompts.ilike.${searchPattern}`)
        .limit(10)

      // Search demos
      const { data: demoResults } = await supabase
        .from("demos")
        .select(`
          *,
          profile:profiles(id, name, avatar_url),
          week:weeks(number, title)
        `)
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(10)

      // Search people
      const { data: peopleResults } = await supabase
        .from("profiles")
        .select("*")
        .or(`name.ilike.${searchPattern},bio.ilike.${searchPattern},project_idea.ilike.${searchPattern}`)
        .limit(10)

      setWeeks(weekResults || [])
      setDemos(demoResults || [])
      setPeople(peopleResults || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(query)}`)
    performSearch(query)
  }

  const totalResults = weeks.length + demos.length + people.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-2">
          Find weeks, demos, and people
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {query && (
        <p className="text-sm text-muted-foreground mb-4">
          {isSearching
            ? "Searching..."
            : `Found ${totalResults} results for "${query}"`}
        </p>
      )}

      {totalResults > 0 && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="weeks" className="gap-1">
              <Calendar className="h-4 w-4" />
              Weeks ({weeks.length})
            </TabsTrigger>
            <TabsTrigger value="demos" className="gap-1">
              <Presentation className="h-4 w-4" />
              Demos ({demos.length})
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-1">
              <Users className="h-4 w-4" />
              People ({people.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {weeks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Weeks</h3>
                {weeks.slice(0, 3).map((week) => (
                  <WeekCard key={week.id} week={week} />
                ))}
              </div>
            )}
            {demos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Demos</h3>
                {demos.slice(0, 3).map((demo) => (
                  <DemoCard key={demo.id} demo={demo} />
                ))}
              </div>
            )}
            {people.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">People</h3>
                {people.slice(0, 3).map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weeks" className="space-y-2">
            {weeks.map((week) => (
              <WeekCard key={week.id} week={week} />
            ))}
          </TabsContent>

          <TabsContent value="demos" className="space-y-2">
            {demos.map((demo) => (
              <DemoCard key={demo.id} demo={demo} />
            ))}
          </TabsContent>

          <TabsContent value="people" className="space-y-2">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {query && !isSearching && totalResults === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WeekCard({ week }: { week: any }) {
  const level = getLevelForWeek(week.number)
  return (
    <Link href={`/weeks/${week.number}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Badge variant={`level${level}` as "level1" | "level2" | "level3"}>
              Week {week.number}
            </Badge>
            <span className="font-medium">{week.title}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function DemoCard({ demo }: { demo: any }) {
  return (
    <Link href={`/weeks/${demo.week?.number}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={demo.profile?.avatar_url || ""} />
              <AvatarFallback>{getInitials(demo.profile?.name || "?")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{demo.title}</p>
              <p className="text-sm text-muted-foreground">
                by {demo.profile?.name} • Week {demo.week?.number}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PersonCard({ person }: { person: any }) {
  return (
    <Link href={`/people/${person.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={person.avatar_url || ""} />
              <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{person.name}</p>
              {person.bio && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {person.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
