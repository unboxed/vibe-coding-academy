import Link from "next/link"
import { ArrowRight, Users, Calendar, Award, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const levels = [
  {
    number: 1,
    title: "Foundation",
    description: "Idea to prompt, AI Studio, and GitHub basics",
    weeks: "Weeks 1-3",
    color: "level1",
    topics: ["Product ideas", "Prompting", "Google AI Studio", "GitHub"],
  },
  {
    number: 2,
    title: "Intermediate",
    description: "Master coding agents and best practices",
    weeks: "Weeks 4-5",
    color: "level2",
    topics: ["Claude", "Codex", "Cursor", "Agent workflows"],
  },
  {
    number: 3,
    title: "Advanced",
    description: "Frameworks, deployment, and production apps",
    weeks: "Weeks 6-10",
    color: "level3",
    topics: ["Frameworks", "Deployment", "Supabase", "Pitch & Awards"],
  },
]

const features = [
  {
    icon: Calendar,
    title: "10 Week Journey",
    description: "Structured curriculum from basics to production-ready apps",
  },
  {
    icon: Users,
    title: "Community Learning",
    description: "Learn together, share demos, and give feedback",
  },
  {
    icon: Award,
    title: "Earn Badges",
    description: "Get recognized for your achievements and contributions",
  },
  {
    icon: Rocket,
    title: "Ship Real Projects",
    description: "Build and deploy your own vibe-coded application",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <Badge variant="secondary" className="px-4 py-1">
            10-Week Programme
          </Badge>
          <h1 className="text-balance">
            Zero to Hero in Vibe Coding
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl">
            A hands-on journey from product idea to deployed app. Learn AI-powered development
            with coding agents, frameworks, and modern tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/weeks">
              <Button size="lg" className="gap-2">
                View Curriculum
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/people">
              <Button size="lg" variant="outline">
                Meet the Cohort
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-4 mb-12">
          <h2>Three Levels of Mastery</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Progress through structured levels, each building on the last to take you from
            beginner to shipping production applications.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {levels.map((level) => (
            <Card key={level.number} className="relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-${level.color}`}
                style={{
                  backgroundColor: level.number === 1
                    ? "hsl(199, 89%, 48%)"
                    : level.number === 2
                    ? "hsl(262, 83%, 58%)"
                    : "hsl(142, 76%, 36%)"
                }}
              />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={`level${level.number}` as "level1" | "level2" | "level3"}>
                    Level {level.number}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{level.weeks}</span>
                </div>
                <CardTitle className="mt-2">{level.title}</CardTitle>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {level.topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/weeks">
            <Button variant="outline" size="lg" className="gap-2">
              Explore All Weeks
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="mb-4">Ready to Start Your Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Sign in to track your progress, submit demos, earn badges, and connect with fellow learners.
          </p>
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
