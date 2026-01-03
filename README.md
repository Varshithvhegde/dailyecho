# 🎥 Daily Echo

A beautiful, private video journaling app that lets you record daily video diary entries, track your mood over time, and relive your memories through immersive story modes and interactive visual walls.

## ✨ Features

### 🎬 Immersive Story Modes (New!)
- **Memory Stories** - Watch your entries in a sequential, story-like format similar to social media.
- **Auto-Curated Playlists** - Choose from "Recent Moments", "Moments of Joy" (happy/excited/grateful), or "Flashback" (random picks from the past).
- **Smooth Navigation** - Interactive progress bars, auto-advance, and gesture/keyboard support.

### 🧱 Echo Wall (Mosaic Mode)
- **Living Visual History** - A dynamic masonry grid of your life in motion.
- **Living Video Tiles** - Each tile plays a Mux-generated animated GIF preview simultaneously for a "Harry Potter" newspaper effect.
- **Interactive Previews** - Retro CRT scanline overlays and cinematic hover effects.

### 📹 Video Recording & Playback
- **Mux-powered streaming** - Professional-grade video processing and playback with adaptive streaming.
- **Mux GIFs** - Hover over any entry card to see a living preview of that memory.
- **Professional Playback** - Integrated Mux Player with caption support and auto-transcription.

### 🧠 AI & Smart Features
- **AI Reflection Companion** - Advanced analysis of your entries using OpenAI GPT-4o-mini.
- **Automatic Summarization** - Get 2-sentence summaries of your day effortlessly.
- **Emotional Insights** - AI detects sentiment levels and offers personalized daily advice.
- **Time Capsule** - Rediscover memories from exactly 1 month or 1 year ago.

### 🏆 Achievements & Gamification
- **Milestones** - Track your progress with badges like "Zen Master", "Night Owl", and "Weekend Warrior".
- **Goal Tracking** - Visual progress bars for recording streaks and mood varieties.

### 🎨 Next-Gen UI/UX
- **Animated Background** - Immersive, parallax-driven ambient blobs and interactive mouse effects.
- **Noise Texture** - Subtle high-end film grain texture for a premium "analogue" digital feel.
- **Responsive Branding** - Custom animated SVG logo and consistent glassmorphism design.

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion (animations)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Video**: Mux Video API (Direct Uploads, GIFs, Playback)
- **AI**: OpenAI (GPT-4o-mini)
- **State**: TanStack Query (React Query)

---

## ☁️ Edge Functions

### `analyze-entry`
Analyzes the transcript using OpenAI to generate insights.
**Endpoint**: `POST /functions/v1/analyze-entry`

### `mux-upload`
Creates a new diary entry and initializes Mux direct upload with transcription enabled.
**Endpoint**: `POST /functions/v1/mux-upload`

### `mux-webhook`
Handles Mux events (`video.asset.ready`, etc.) to update statuses and transcripts in the DB.
**Endpoint**: `POST /functions/v1/mux-webhook`

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | **Home** - Memory Stories, Today's Prompt, Quick Stats, Time Capsule |
| `/record` | **Recording Studio** - Record & upload your thoughts |
| `/entry/:id` | **Memory View** - Video, AI advice & detailed analysis |
| `/timeline` | **Timeline** - Choose between Grid, Calendar, or the **Mosaic Wall** |
| `/insights` | **Insights** - Mood distribution, habit streaks, and Achievements |
| `/auth` | **Security** - Branded login/signup page |

---

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone <YOUR_GIT_URL>
   npm install
   ```

2. **Run Dev Server**
   ```bash
   npm run dev
   ```

3. **Configure Secrets**
   - Add `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` to your Supabase project.
   - Add `OPENAI_API_KEY`.

---
## Explanation

https://player.mux.com/CCj4qM26bpO6r6Zlx37CFqh01dDZNAaYmt9FaJXDPkEY
## 🛡️ Security

- **Row Level Security (RLS)** ensures users only access their own memories.
- **JWT Validation** for all Edge Function calls.
- **Mux Webhook Verification** using signature headers.

---

## 📄 License
MIT License - feel free to use this for your own projects!

