-- Seed data for Vibe Coding Academy

-- Insert weeks 1-10 with content aligned to the programme flow
INSERT INTO weeks (number, title, level, overview, prework, session_plan, prompts, published) VALUES

-- Level 1: Foundation (Weeks 1-3)
(1, 'Turning Product Ideas into Prompts', 1,
'## Overview
Learn how to transform a product idea into effective AI prompts. Introduction to Google AI Studio and the basics of prompt engineering.

## Learning Goals
- Understand what makes a good product idea for vibe coding
- Learn the fundamentals of prompt engineering
- Get hands-on with Google AI Studio',
'## Pre-work
- Sign up for Google AI Studio
- Think of a simple product idea you''d like to build
- Watch: [Introduction to Prompt Engineering](https://example.com)',
'## Session Plan (30 min)
1. **Welcome & Introductions** (5 min)
2. **What is Vibe Coding?** (5 min)
3. **Product Idea → Prompt** (10 min)
4. **Google AI Studio Demo** (5 min)
5. **Hands-on Practice** (5 min)',
'## Starter Prompts

```
I want to build a [type of app] that helps [target user] to [solve problem].
The main features should be:
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

Help me think through the technical approach.
```',
true),

(2, 'Iterate in AI Studio + 1-min Demos', 1,
'## Overview
Practice iterating on prompts in Google AI Studio. Learn to refine outputs and prepare your first 1-minute demo.

## Learning Goals
- Master prompt iteration techniques
- Learn to evaluate and improve AI outputs
- Practice presenting your work concisely',
'## Pre-work
- Complete your first prompt iteration from Week 1
- Prepare a rough 1-minute demo of what you built
- Read: Prompt iteration best practices',
'## Session Plan (30 min)
1. **Iteration Techniques** (10 min)
2. **1-min Demo Lightning Round** (15 min)
3. **Feedback & Discussion** (5 min)',
'## Iteration Prompts

```
This is good, but can you make it [more specific/simpler/more detailed]?

I like the [specific part], but [specific issue]. Can you fix that?

Let''s try a different approach. What if we [alternative approach]?
```',
true),

(3, 'Set Up GitHub + Export Work', 1,
'## Overview
Learn to use GitHub for version control. Export your AI Studio work and create your first repository.

## Learning Goals
- Understand why version control matters
- Create and manage a GitHub repository
- Export and organize your AI-generated code',
'## Pre-work
- Create a GitHub account if you don''t have one
- Install Git on your machine (or use GitHub Desktop)
- Export your best work from AI Studio',
'## Session Plan (30 min)
1. **Why GitHub?** (5 min)
2. **Creating Your First Repo** (10 min)
3. **Committing Your Work** (10 min)
4. **Best Practices** (5 min)',
'## Git Commands

```bash
# Initialize a new repository
git init

# Add files to staging
git add .

# Commit your changes
git commit -m "Initial commit: Add AI Studio exports"

# Push to GitHub
git push origin main
```',
true),

-- Level 2: Intermediate (Weeks 4-5)
(4, 'Intro to Coding Agents', 2,
'## Overview
Discover the world of AI coding agents. Learn about Claude, Codex, Cursor, and when to use each.

## Learning Goals
- Understand what coding agents are and how they differ from chat AI
- Compare different agents (Claude, Codex, Cursor)
- Choose the right tool for different tasks',
'## Pre-work
- Sign up for Cursor (free tier)
- Review Claude Code documentation
- Think about a feature to build with an agent',
'## Session Plan (30 min)
1. **What are Coding Agents?** (5 min)
2. **Claude vs Codex vs Cursor** (10 min)
3. **Live Demo: Building with an Agent** (10 min)
4. **Q&A** (5 min)',
'## Agent Comparison

| Feature | Claude | Codex | Cursor |
|---------|--------|-------|--------|
| Best for | Complex reasoning | Code completion | IDE integration |
| Context | Very long | Medium | Project-aware |
| Speed | Medium | Fast | Fast |',
true),

(5, 'Using a Coding Agent Well', 2,
'## Overview
Master the art of working with coding agents. Learn prompting strategies, context management, and debugging techniques.

## Learning Goals
- Write effective prompts for coding agents
- Manage context and conversation flow
- Debug agent-generated code effectively',
'## Pre-work
- Complete a small project with your chosen agent
- Note any challenges or friction points
- Prepare questions about agent workflows',
'## Session Plan (30 min)
1. **Prompting Strategies** (10 min)
2. **Context Management** (10 min)
3. **Debugging Tips** (5 min)
4. **Practice Session** (5 min)',
'## Best Practices

1. **Be specific** - Include file names, function names, and expected behavior
2. **Provide context** - Share relevant code and requirements
3. **Iterate** - Don''t expect perfect results on first try
4. **Verify** - Always review and test generated code',
true),

-- Level 3: Advanced (Weeks 6-10)
(6, 'Frameworks and Patterns', 3,
'## Overview
Learn about frameworks like BMAD and other patterns for structuring AI-assisted development.

## Learning Goals
- Understand common development frameworks
- Apply patterns to your projects
- Structure complex applications',
'## Pre-work
- Research BMAD framework
- Review your project architecture
- Identify areas for improvement',
'## Session Plan (30 min)
1. **Framework Overview** (10 min)
2. **BMAD Deep Dive** (10 min)
3. **Apply to Your Project** (10 min)',
'## BMAD Framework

**B**reak down the problem
**M**odel the solution
**A**sk the AI for help
**D**ebug and refine

Use this iteratively for each feature.',
true),

(7, 'Plugins and Helpful Commands', 3,
'## Overview
Discover plugins and commands that supercharge your development workflow.

## Learning Goals
- Find and use helpful plugins
- Create custom commands/shortcuts
- Optimize your development environment',
'## Pre-work
- Audit your current development setup
- Research plugins for your editor/tools
- List repetitive tasks to automate',
'## Session Plan (30 min)
1. **Essential Plugins** (10 min)
2. **Custom Commands** (10 min)
3. **Workflow Optimization** (10 min)',
'## Recommended Plugins

- **Cursor**: AI assistant, code actions
- **VSCode**: GitLens, Prettier, ESLint
- **Terminal**: Oh My Zsh, aliases, scripts',
true),

(8, 'Deploy Your App', 3,
'## Overview
Learn to deploy your application to the web. Cover Vercel, environment variables, and production considerations.

## Learning Goals
- Deploy to Vercel (or similar)
- Manage environment variables
- Handle production concerns',
'## Pre-work
- Create a Vercel account
- Prepare your app for deployment
- List environment variables needed',
'## Session Plan (30 min)
1. **Deployment Options** (5 min)
2. **Vercel Setup** (10 min)
3. **Environment Variables** (5 min)
4. **Live Deploy** (10 min)',
'## Deployment Checklist

- [ ] Remove console.logs
- [ ] Set up environment variables
- [ ] Test build locally
- [ ] Configure custom domain (optional)
- [ ] Set up error monitoring',
true),

(9, 'State Management + Persistence', 3,
'## Overview
Add persistence to your app with Supabase. Learn about state management and databases.

## Learning Goals
- Set up Supabase for your project
- Implement authentication
- Manage persistent data',
'## Pre-work
- Create a Supabase account
- Review your app''s data requirements
- Sketch out your database schema',
'## Session Plan (30 min)
1. **Why Persistence?** (5 min)
2. **Supabase Setup** (10 min)
3. **Authentication** (10 min)
4. **Database Basics** (5 min)',
'## Supabase Quick Start

```javascript
import { createClient } from ''@supabase/supabase-js''

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Fetch data
const { data } = await supabase
  .from(''table'')
  .select(''*'')
```',
true),

(10, 'Pitch + Awards', 3,
'## Overview
Present your final projects! Celebrate achievements and receive awards.

## Learning Goals
- Present your project effectively
- Give constructive feedback
- Celebrate the journey',
'## Pre-work
- Prepare your 3-minute pitch
- Test your demo thoroughly
- Practice, practice, practice!',
'## Session Plan (30 min)
1. **Final Pitches** (20 min)
2. **Voting & Awards** (5 min)
3. **Closing & Next Steps** (5 min)',
'## Pitch Structure

1. **Problem** (30 sec) - What problem does it solve?
2. **Solution** (30 sec) - What did you build?
3. **Demo** (1.5 min) - Show it working
4. **Learnings** (30 sec) - What did you learn?',
true);

-- Insert default badges
INSERT INTO badges (name, description, color) VALUES
('Shipped v1', 'Deployed your first working version', '#10B981'),
('Best Demo', 'Outstanding demo presentation', '#F59E0B'),
('Helped Someone', 'Provided valuable help to a peer', '#8B5CF6'),
('Great Testing', 'Thorough testing of your project', '#3B82F6'),
('Best Prompt', 'Crafted an exceptional AI prompt', '#EC4899'),
('Code Review Star', 'Provided excellent code review feedback', '#6366F1'),
('Early Bird', 'Submitted work ahead of schedule', '#14B8A6'),
('Persistence Hero', 'Overcame significant challenges', '#F97316'),
('Innovation Award', 'Most creative or innovative approach', '#EF4444'),
('Community Champion', 'Active contributor to the community', '#84CC16');
