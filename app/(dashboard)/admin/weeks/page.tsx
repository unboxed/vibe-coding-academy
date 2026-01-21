import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Eye, EyeOff } from "lucide-react"
import type { Week } from "@/types/database"

export default async function AdminWeeksPage() {
  const supabase = await createClient()

  // Check if user is admin/facilitator
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/admin/weeks")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = (profile as { role: string } | null)?.role
  if (!profile || !userRole || !["admin", "facilitator"].includes(userRole)) {
    redirect("/")
  }

  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .order("number")

  const weeks = weeksData as Week[] | null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Weeks</h1>
        <p className="text-muted-foreground mt-2">
          Edit week content and manage publishing
        </p>
      </div>

      <div className="space-y-4">
        {weeks?.map((week) => (
          <Card key={week.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      week.level === 1
                        ? "level1"
                        : week.level === 2
                        ? "level2"
                        : "level3"
                    }
                  >
                    Week {week.number}
                  </Badge>
                  <div>
                    <h3 className="font-medium">{week.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Level {week.level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={week.published ? "default" : "outline"}>
                    {week.published ? (
                      <Eye className="h-3 w-3 mr-1" />
                    ) : (
                      <EyeOff className="h-3 w-3 mr-1" />
                    )}
                    {week.published ? "Published" : "Draft"}
                  </Badge>
                  <Link href={`/admin/weeks/${week.number}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
