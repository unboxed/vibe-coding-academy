# Vibe Coding Academy Wiki

An internal wiki for a 10-week "vibe coding" programme. Track progress through structured levels, submit demos, earn badges, and collaborate with fellow participants.

## Features

- **Weeks 1-10 Curriculum**: Structured content organized into 3 levels (Foundation, Intermediate, Advanced)
- **User Profiles**: Sign in with Google, customize your profile, share your project
- **Demo Submissions**: Submit demos each week and get community feedback
- **Voting System**: Upvote/downvote demos from peers
- **Badge System**: Earn badges for achievements, view leaderboard
- **Admin Dashboard**: Manage content, award badges, control user roles
- **Search**: Find weeks, demos, and people
- **Optional Slack Integration**: Notifications for new content, badges, and demos

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Deployment**: Docker + Vercel

## Prerequisites

- Docker and Docker Compose
- A Supabase project (free tier works)
- Google OAuth credentials (via Supabase Auth)

## Local Development Setup

### 1. Clone and Configure Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd vibe-coding-academy

# Copy environment example
cp .env.local.example .env.local
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Google OAuth

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Google provider
3. Create OAuth credentials in Google Cloud Console
4. Add the credentials to Supabase

### 4. Run Database Migrations

In the Supabase SQL Editor, run the migrations:

1. Copy contents of `supabase/migrations/00001_initial_schema.sql`
2. Execute in SQL Editor
3. Copy contents of `supabase/seed.sql`
4. Execute in SQL Editor

### 5. Start Development Server (Docker)

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The app will be available at http://localhost:8080

### 6. Create Admin User

After signing in for the first time:

1. Go to Supabase Dashboard > Table Editor > profiles
2. Find your user and change `role` from `member` to `admin`

## Available Scripts

```bash
# Development
docker-compose up              # Start dev server
docker-compose down            # Stop containers

# If running locally (not recommended without Docker):
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run typecheck              # Run TypeScript checks
npm run test                   # Run Playwright tests
```

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth pages (login)
│   ├── (dashboard)/         # Main app pages
│   │   ├── admin/           # Admin panel
│   │   ├── badges/          # Badges & leaderboard
│   │   ├── people/          # User directory
│   │   ├── profile/         # User profile
│   │   ├── projects/        # Projects list
│   │   ├── search/          # Search page
│   │   └── weeks/           # Curriculum pages
│   ├── auth/callback/       # OAuth callback
│   └── layout.tsx           # Root layout
├── components/
│   ├── layout/              # Navbar, Footer
│   ├── providers/           # Auth provider
│   ├── ui/                  # shadcn/ui components
│   └── weeks/               # Week-specific components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── slack.ts             # Slack notifications
│   └── utils.ts             # Utility functions
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # Seed data
├── tests/                   # Playwright tests
└── types/                   # TypeScript types
```

## User Roles

- **member**: Can view content, submit demos, vote, manage own profile/project
- **facilitator**: All member permissions + edit weeks, award badges
- **admin**: All facilitator permissions + manage user roles

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | No |

## Optional: Slack Integration

To enable Slack notifications:

1. Create an Incoming Webhook in your Slack workspace
2. Add the webhook URL to `.env.local`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

Notifications will be sent for:
- New week content published
- Badges awarded
- Demos submitted

## Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

## Running Tests

```bash
# Start the dev server first, then run tests
docker-compose up -d
npx playwright test

# Or run tests with UI
npx playwright test --ui
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run lint and typecheck
4. Submit a pull request

## License

Private - Internal use only
