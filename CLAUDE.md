# IELTSBuddy V2

## Project Overview
IELTS preparation web app for Nepali students. Built with Next.js 15 (App Router) + TypeScript + Tailwind CSS. AI-powered with RAG from Cambridge IELTS past papers. Web app (not mobile).

## Design System

### Theme: Dark Premium (Navy + Indigo/Violet)
- Background: #0B0F1A
- Surface: #12172B
- Card: #1E2540
- Card border: #2A3150 (0.5px solid)
- Primary (CTA/accent): #6366F1 (indigo)
- Primary hover: #818CF8
- Primary text on button: #EEF2FF
- Text primary: #F8FAFC
- Text secondary: #94A3B8
- Text muted: #64748B
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444
- Border subtle: rgba(255,255,255,0.06)
- Border medium: rgba(255,255,255,0.1)

### Skill Colors (consistent everywhere)
- Speaking: #0EA5E9 (sky blue), bg: rgba(14,165,233,0.15)
- Writing: #F97316 (orange), bg: rgba(249,115,22,0.15)
- Reading: #A855F7 (purple), bg: rgba(168,85,247,0.15)
- Listening: #22C55E (green), bg: rgba(34,197,94,0.15)

### Typography
- Headings: Plus Jakarta Sans (font-weight: 600, 700)
- Body/UI: Inter (font-weight: 400, 500)
- Both loaded via next/font/google in layout.tsx
- Font sizes: hero 32-40px, h1 28px, h2 22px, h3 18px, body 14-15px, caption 12px, small 11px

### Components
- Cards: bg #1E2540, border 0.5px solid #2A3150, border-radius 12px, padding 16-20px
- Buttons primary: bg #6366F1, hover bg #818CF8, text #EEF2FF, border-radius 8px, padding 10px 20px
- Buttons secondary: bg transparent, border 0.5px solid #2A3150, text #94A3B8, hover border #6366F1
- Icon containers: 40x40px, border-radius 10px, bg uses skill color at 15% opacity, icon uses skill color
- Input fields: bg #12172B, border 0.5px solid #2A3150, focus border #6366F1, text #F8FAFC, border-radius 8px
- Pills/badges: border-radius 20px, padding 4px 12px, font-size 12px, font-weight 500
- Progress bars: bg #1E2540, fill uses relevant skill color, height 4px, border-radius 2px

### Icons
- Use lucide-react exclusively
- Size: 20px default, 16px small, 24px large
- Stroke-width: 1.75
- Common icons: Mic (speaking), PenLine (writing), BookOpen (reading), Headphones (listening), Target, Clock, BarChart3, Lock, ChevronRight, Search, Settings, User, Star, TrendingUp, Calendar, CheckCircle, Play, ArrowRight

### Layout
- Max content width: 1200px, centered with auto margins
- Sidebar: 240px fixed width on desktop, collapsible on mobile
- Page padding: 24px on desktop, 16px on mobile
- Card grid: 2 columns on mobile, 4 columns on desktop, gap 12-16px
- Bottom nav on mobile (sticky), sidebar on desktop

## Tech Stack
- Next.js 15 (App Router, server components by default)
- TypeScript (strict mode)
- Tailwind CSS v4
- lucide-react for icons
- next/font/google for Plus Jakarta Sans + Inter
- MongoDB + Mongoose (later)
- Claude API via @anthropic-ai/sdk (later)
- Ollama for local embeddings (later)

## Code Rules
- Use server components by default, 'use client' only when needed (interactivity, hooks, browser APIs)
- All pages MUST be fully responsive (mobile-first approach)
- Use Tailwind utility classes only, no inline styles, no CSS modules
- Components go in src/components/
- Shared types go in src/types/
- Utility functions go in src/lib/
- Use semantic HTML elements
- NO emojis anywhere in the UI or code comments
- Keep components small and focused (max ~150 lines)
- Use TypeScript interfaces for all props and data shapes

## Page Structure
1. Landing page (/) - hero, features, CTA
2. Onboarding (/onboarding) - multi-step form
3. Dashboard (/dashboard) - home with overview
4. Study Plan (/dashboard/plan) - daily/weekly tasks
5. Speaking (/dashboard/speaking) - AI speaking practice + tests
6. Reading (/dashboard/reading) - passages + questions
7. Writing (/dashboard/writing) - Task 1 & Task 2 practice
8. Listening (/dashboard/listening) - audio tests
9. Admin (/admin/upload) - PDF upload for RAG (later)

## Navigation
- Desktop: left sidebar (240px) with logo, nav links, user info
- Mobile: bottom tab bar (Home, Plan, Speaking, Reading, Writing)
- Sidebar nav items: Home, Study Plan, Speaking, Reading, Writing, Listening, Settings
- Active state: bg #6366F1/10%, text #818CF8, icon #818CF8

## Important Notes
- This is a web app, NOT a mobile app
- Target audience: Nepali students preparing for IELTS
- Freemium model: some tests free, most locked behind premium
- All test content comes from Cambridge IELTS Books 1-15 (via RAG from PDFs)
- AI features: speaking evaluation, writing feedback, personalized study plans