export type UserRole = "admin" | "facilitator" | "member"

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  bio: string | null
  avatar_url: string | null
  github_url: string | null
  slack_handle: string | null
  project_idea: string | null
  repo_url: string | null
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  number: number
  title: string
  level: number
  overview: string | null
  prework: string | null
  session_plan: string | null
  prompts: string | null
  resources: string | null
  feedback_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type ProjectStatus = "draft" | "in_progress" | "completed"

export interface ProjectScreenshot {
  url: string
  caption?: string
  order: number
  uploaded_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  goal: string | null
  links: string | null // Keep for backwards compatibility
  avatar_url: string | null
  screenshots: ProjectScreenshot[]
  demo_url: string | null
  github_url: string | null
  tech_stack: string[]
  status: ProjectStatus
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
}

export interface Demo {
  id: string
  week_id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  url: string | null
  created_at: string
  updated_at: string
  // Computed/joined data
  vote_count?: number
  user_vote?: number
  profile?: Profile
  week?: Week
  project?: Project
}

export interface Vote {
  id: string
  demo_id: string
  user_id: string
  value: number // +1 or -1
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

export interface BadgeAward {
  id: string
  badge_id: string
  user_id: string
  demo_id: string | null
  awarded_by: string
  created_at: string
  // Joined data
  badge?: Badge
  profile?: Profile
  awarded_by_profile?: Profile
  demo?: Demo
}

// Extended types for views/queries
export interface ProfileWithBadges extends Profile {
  badges: BadgeAward[]
  badge_count: number
}

export interface ProfileWithStats extends Profile {
  badge_count: number
  demo_count: number
  total_votes: number
}

export interface WeekWithDemos extends Week {
  demos: Demo[]
}

// Database response types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at" | "updated_at">
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
      }
      weeks: {
        Row: Week
        Insert: Omit<Week, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Week, "id" | "created_at" | "updated_at">>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Project, "id" | "created_at" | "updated_at">>
      }
      demos: {
        Row: Demo
        Insert: Omit<Demo, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Demo, "id" | "created_at" | "updated_at">>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, "id" | "created_at">
        Update: Partial<Omit<Vote, "id" | "created_at">>
      }
      badges: {
        Row: Badge
        Insert: Omit<Badge, "id" | "created_at">
        Update: Partial<Omit<Badge, "id" | "created_at">>
      }
      badge_awards: {
        Row: BadgeAward
        Insert: Omit<BadgeAward, "id" | "created_at">
        Update: Partial<Omit<BadgeAward, "id" | "created_at">>
      }
    }
  }
}

// Common tech stack options for autocomplete
export const COMMON_TECH_STACKS = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Node.js",
  "Express",
  "NestJS",
  "Fastify",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Supabase",
  "Firebase",
  "Tailwind CSS",
  "CSS",
  "Sass",
  "Styled Components",
  "GraphQL",
  "REST API",
  "tRPC",
  "Docker",
  "Kubernetes",
  "AWS",
  "Vercel",
  "OpenAI",
  "LangChain",
  "AI/ML",
] as const

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
}
