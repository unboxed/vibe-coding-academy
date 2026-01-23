export type UserRole = "admin" | "member"

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

export interface WeekSection {
  id: string
  week_id: string
  slug: string
  title: string
  content: string | null
  sort_order: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface WeekWithSections extends Week {
  sections: WeekSection[]
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

// Base row type (actual database columns)
export interface BadgeAwardRow {
  id: string
  badge_id: string
  user_id: string
  demo_id: string | null
  awarded_by: string
  created_at: string
}

// Extended type with joined data for queries
export interface BadgeAward extends BadgeAwardRow {
  badge?: Badge
  profile?: Profile
  awarded_by_profile?: Profile
  demo?: Demo
}

// Project feedback from instructors
export interface ProjectFeedback {
  id: string
  project_id: string
  instructor_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined data
  instructor?: Profile
}

// Project with all related data for the projects table view
export interface ProjectWithDetails extends Project {
  profile: Profile
  badges: BadgeAward[]
  feedback: ProjectFeedback[]
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

// Base row types (without joined data) for Database schema
interface ProfileRow {
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

interface WeekRow {
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

interface WeekSectionRow {
  id: string
  week_id: string
  slug: string
  title: string
  content: string | null
  sort_order: number
  is_system: boolean
  created_at: string
  updated_at: string
}

interface ProjectRow {
  id: string
  user_id: string
  title: string
  description: string | null
  goal: string | null
  links: string | null
  avatar_url: string | null
  screenshots: ProjectScreenshot[]
  demo_url: string | null
  github_url: string | null
  tech_stack: string[]
  status: ProjectStatus
  created_at: string
  updated_at: string
}

interface DemoRow {
  id: string
  week_id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  url: string | null
  created_at: string
  updated_at: string
}

interface VoteRow {
  id: string
  demo_id: string
  user_id: string
  value: number
  created_at: string
}

interface BadgeRow {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

interface ProjectFeedbackRow {
  id: string
  project_id: string
  instructor_id: string
  content: string
  created_at: string
  updated_at: string
}

// Database response types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, "created_at" | "updated_at">
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>
        Relationships: []
      }
      weeks: {
        Row: WeekRow
        Insert: Omit<WeekRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<WeekRow, "id" | "created_at" | "updated_at">>
        Relationships: []
      }
      week_sections: {
        Row: WeekSectionRow
        Insert: Omit<WeekSectionRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<WeekSectionRow, "id" | "week_id" | "created_at" | "updated_at">>
        Relationships: []
      }
      projects: {
        Row: ProjectRow
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ProjectRow, "id" | "created_at" | "updated_at">>
        Relationships: []
      }
      demos: {
        Row: DemoRow
        Insert: Omit<DemoRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DemoRow, "id" | "created_at" | "updated_at">>
        Relationships: []
      }
      votes: {
        Row: VoteRow
        Insert: Omit<VoteRow, "id" | "created_at">
        Update: Partial<Omit<VoteRow, "id" | "created_at">>
        Relationships: []
      }
      badges: {
        Row: BadgeRow
        Insert: Omit<BadgeRow, "id" | "created_at">
        Update: Partial<Omit<BadgeRow, "id" | "created_at">>
        Relationships: []
      }
      badge_awards: {
        Row: BadgeAwardRow
        Insert: Omit<BadgeAwardRow, "id" | "created_at">
        Update: Partial<Omit<BadgeAwardRow, "id" | "created_at">>
        Relationships: []
      }
      project_feedback: {
        Row: ProjectFeedbackRow
        Insert: Omit<ProjectFeedbackRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ProjectFeedbackRow, "id" | "project_id" | "created_at" | "updated_at">>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
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
