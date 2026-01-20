# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Coding Academy Wiki - An internal web app for a 10-week "vibe coding" programme. Users can browse weekly curriculum content, submit demos, vote on submissions, earn badges, and collaborate.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/Auth/DB**: Supabase (PostgreSQL + Google OAuth)
- **Containerization**: Docker

## Common Commands

```bash
# Development (Docker - required)
docker-compose up --build       # Build and start dev server
docker-compose up -d            # Start in detached mode
docker-compose down             # Stop containers

# Inside container or if running locally
npm run dev                     # Start Next.js dev server
npm run build                   # Production build
npm run lint                    # ESLint
npm run typecheck               # TypeScript check
npm run test                    # Playwright tests
```

## Architecture

### App Router Structure

- `app/(auth)/` - Authentication pages (login)
- `app/(dashboard)/` - Main app with shared layout (navbar, footer)
  - `weeks/` - Curriculum pages (list + detail with tabs)
  - `people/` - User directory and profiles
  - `projects/` - User projects
  - `badges/` - Leaderboard and awards
  - `admin/` - Content management (protected by role)
  - `search/` - Search across weeks, demos, people

### Key Components

- `components/providers/auth-provider.tsx` - Auth context with Supabase
- `components/layout/main-layout.tsx` - App shell with auth
- `components/weeks/` - Demo voting and submission components

### Supabase Integration

- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client (cookies)
- `lib/supabase/middleware.ts` - Auth + route protection

### Database Schema

Tables: profiles, weeks, projects, demos, votes, badges, badge_awards
- RLS policies enforce: members own their data, admin/facilitator can manage content
- See `supabase/migrations/00001_initial_schema.sql` for full schema

### User Roles

- `member` - Default, can view, vote, submit demos
- `facilitator` - Can edit weeks, award badges
- `admin` - Can manage user roles

## Key Patterns

1. **Server Components by Default**: Pages fetch data server-side via `createClient()` from server.ts
2. **Client Components for Interactivity**: Voting, forms, auth state use `"use client"` directive
3. **Markdown Content**: Week content stored as Markdown, rendered with react-markdown
4. **Route Groups**: `(auth)` and `(dashboard)` for different layouts
5. **Middleware Protection**: Protected routes redirect to login, admin routes check role

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `SLACK_WEBHOOK_URL` - For notifications
