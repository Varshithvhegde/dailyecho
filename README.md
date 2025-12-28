# 🎥 Video Diary

A beautiful, private video journaling app that lets you record daily video diary entries, track your mood over time, and automatically transcribe your thoughts.

## ✨ Features

### 📹 Video Recording & Playback
- **One-tap recording** - Record video diary entries directly in browser
- **Mux-powered streaming** - Professional-grade video processing and playback
- **Auto-generated thumbnails** - Beautiful previews for each entry
- **Adaptive streaming** - Videos automatically adjust quality based on connection

### 🧠 AI & Smart Features (New!)
- **AI Reflection Companion** - Advanced analysis of your entries using OpenAI
- **Automatic Summarization** - Get 2-sentence summaries of your day
- **Emotional Insights** - AI detects sentiment and offers personalized advice
- **Real-time Updates** - Transcripts and analysis appear instantly without refreshing
- **Time Capsule** - Rediscover memories from exactly 1 month or 1 year ago

### 🎭 Mood Tracking
- **8 mood options** - Happy, Sad, Anxious, Excited, Calm, Stressed, Grateful, Reflective
- **Visual mood selector** - Colorful, emoji-based mood selection
- **Mood analytics** - Track mood patterns over time with charts

### 📝 Auto-Transcription
- **AI-powered transcription** - Automatic speech-to-text via Mux
- **Full transcript display** - Read back what you said in each entry
- **Caption support** - Watch with auto-generated captions

### 📊 Insights & Analytics
- **Mood distribution chart** - See your emotional patterns
- **Streak tracking** - Build a daily journaling habit
- **Visual Calendar** - Browse entries by date with video thumbnails
- **Timeline view** - Scroll through all entries chronologically

### 🔐 Private & Secure
- **User authentication** - Email-based signup/login
- **Row-level security** - Each user only sees their own entries
- **Secure video storage** - Videos stored securely via Mux

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Video**: Mux Video API
- **AI**: OpenAI (GPT-4o-mini)
- **State**: TanStack Query

### Database Schema

#### `diary_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner's user ID |
| date | date | Entry date |
| mood | enum | One of 8 mood types |
| duration | integer | Video duration in seconds |
| mux_upload_id | text | Mux upload identifier |
| mux_asset_id | text | Mux asset identifier |
| mux_playback_id | text | Mux playback identifier |
| mux_track_id | text | Caption track identifier |
| video_status | text | pending/processing/ready/error |
| thumbnail_url | text | Auto-generated thumbnail |
| transcript | text | Auto-generated transcript |
| ai_analysis | jsonb | AI-generated insights (title, advice, score) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID (matches auth.users) |
| email | text | User's email |
| display_name | text | Display name |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

---

## ☁️ Edge Functions

### `analyze-entry` (New!)
Analyzes the transcript using OpenAI to generate insights.

**Endpoint**: `POST /functions/v1/analyze-entry`

**Request Body**:
```json
{
  "entryId": "uuid"
}
```

**Response**:
```json
{
  "title": "A Day of Peace",
  "summary": "You felt calm after a long walk...",
  "mood_analysis": "Your tone matches your selected 'calm' mood.",
  "sentiment_score": 85,
  "advice": "Keep taking these walks, they are good for you."
}
```

### `mux-upload`
Creates a new diary entry and initializes Mux direct upload.

**Endpoint**: `POST /functions/v1/mux-upload`

### `mux-webhook`
Handles Mux webhook events to update video processing status.

**Endpoint**: `POST /functions/v1/mux-webhook`

### `mux-status`
Polls Mux API to check current video processing status.

**Endpoint**: `POST /functions/v1/mux-status`

---

## 🔑 Required Secrets

| Secret | Description |
|--------|-------------|
| `MUX_TOKEN_ID` | Mux API token ID |
| `MUX_TOKEN_SECRET` | Mux API token secret |
| `MUX_WEBHOOK_SECRET` | Mux webhook signing secret |
| `OPENAI_API_KEY` | OpenAI API Key for insights |

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Home - Time Capsule, Today's Prompt, Recent Entries |
| `/record` | Record new video diary entry |
| `/entry/:id` | View entry with Video, Transcript & AI Insights |
| `/timeline` | Visual calendar & chronological feed |
| `/insights` | Mood analytics and streak tracking |
| `/auth` | Login/signup page |

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Configure Secrets**
   - Add `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`
   - Add `OPENAI_API_KEY`

5. **Set up Mux Webhook**
   - URL: `https://<project-id>.supabase.co/functions/v1/mux-webhook`
   - Events: `video.upload.asset_created`, `video.asset.ready`, `video.asset.track.ready`

---

## 🛡️ Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only CRUD their own entries
- Edge functions validate JWT tokens
- Mux webhooks verified with signature
- No public data access

---

## 📄 License

MIT License - feel free to use this for your own projects!
