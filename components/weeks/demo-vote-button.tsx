"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface DemoVoteButtonProps {
  demoId: string
  currentVotes: number
}

export function DemoVoteButton({ demoId, currentVotes }: DemoVoteButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [votes, setVotes] = useState(currentVotes)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (value: number) => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsLoading(true)

    try {
      // Check for existing vote
      const { data: existingVoteData } = await supabase
        .from("votes")
        .select("id, value")
        .eq("demo_id", demoId)
        .eq("user_id", user.id)
        .single()

      const existingVote = existingVoteData as { id: string; value: number } | null

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote if clicking same button
          await supabase.from("votes").delete().eq("id", existingVote.id)
          setVotes(votes - value)
          setUserVote(null)
        } else {
          // Change vote
          await supabase
            .from("votes")
            // @ts-expect-error - Supabase types not correctly inferring Update type
            .update({ value })
            .eq("id", existingVote.id)
          setVotes(votes - existingVote.value + value)
          setUserVote(value)
        }
      } else {
        // New vote
        // @ts-expect-error - Supabase types not correctly inferring Insert type
        await supabase.from("votes").insert({
          demo_id: demoId,
          user_id: user.id,
          value,
        })
        setVotes(votes + value)
        setUserVote(value)
      }

      router.refresh()
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={userVote === 1 ? "default" : "ghost"}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <span className="min-w-[2rem] text-center text-sm font-medium">
        {votes}
      </span>
      <Button
        variant={userVote === -1 ? "default" : "ghost"}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
