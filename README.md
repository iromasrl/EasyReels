# EasyReels - Faceless Video Generator

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ 
- Docker (for Redis)
- API Keys:
  - OpenAI (https://platform.openai.com/api-keys)
  - Replicate (https://replicate.com/account/api-tokens)
  - Supabase (already configured)

### 2. Setup

```bash
# Install dependencies
npm install

# Start Redis
docker run -d --name redis-easy-reels -p 6379:6379 redis:alpine

# Configure environment variables
# Edit .env.local and add:
# - OPENAI_API_KEY=your_key_here
# - REPLICATE_API_TOKEN=your_token_here

# Verify environment
npx tsx scripts/check-env.ts

# Initialize database (run SQL in Supabase Dashboard)
# Copy content from supabase_schema.sql and run in SQL Editor
```

### 3. Run the Application

**Terminal 1 - Web App:**
```bash
npm run dev
```
Open http://localhost:3000

**Terminal 2 - Background Worker:**
```bash
npm run worker
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── page.tsx           # Main dashboard
│   ├── actions.ts         # Server actions
│   └── api/generate/      # REST API endpoint
├── lib/                   # Core libraries
│   ├── ai/               # AI services (GPT, TTS, Images)
│   ├── remotion/         # Video rendering
│   ├── supabase.ts       # Database client
│   └── redis.ts          # Queue client
├── remotion/             # Video composition components
│   ├── Composition.tsx   # Main video layout
│   └── Root.tsx          # Remotion entry
└── workers/              # Background job processors
    ├── video-processor.ts # Main pipeline
    └── run.ts            # Worker runner
```

## 🎬 How It Works

1. **User Input:** Topic + Style → Form submission
2. **Queue:** Job added to BullMQ (Redis)
3. **Worker Pipeline:**
   - Generate script with GPT-4o
   - Generate voiceover with OpenAI TTS
   - Generate images with Flux (Replicate)
   - Render video with Remotion
4. **Storage:** Upload final video to Supabase Storage
5. **Dashboard:** Auto-refresh shows progress & download link

## 🔧 Troubleshooting

### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# Restart if needed
docker restart redis-easy-reels
```

### Supabase DNS Error
- Verify URL in .env.local: `https://mftagtkxzbeokekjtkf.supabase.co`
- Check internet connection
- Try: `ping mftagtkxzbeokekjtkf.supabase.co`

### Missing API Keys
Run `npx tsx scripts/check-env.ts` to verify all keys are set.

## 📊 Database Schema

Run the SQL in `supabase_schema.sql` via Supabase Dashboard → SQL Editor.

Creates:
- `projects` table (stores video metadata & status)
- `assets` storage bucket (for audio, images, videos)

## 🎨 Customization

### Add New Visual Styles
Edit `src/app/page.tsx` → `<select name="style">` options

### Adjust Video Duration
Edit `src/lib/ai/script-generator.ts` → prompt (change "60-90 seconds")

### Change Voice
Edit `src/lib/ai/audio-generator.ts` → `voice: 'onyx'` (options: alloy, echo, fable, onyx, nova, shimmer)

## 💰 Cost Estimates (per 60s video)

- Script (GPT-4o): ~$0.02
- Audio (OpenAI TTS): ~$0.01
- Images (Flux @ 10 images): ~$0.20
- **Total: ~$0.23/video**

## 🚧 Known Limitations (MVP)

- Subtitles are placeholder (not synced yet)
- No A/B testing
- No multi-language support
- Single user (no auth)
- Manual database setup required

## 🔜 Next Steps

1. Add Whisper integration for word-level subtitle timing
2. Implement subtitle animations
3. Add background music with ducking
4. Social media auto-posting (TikTok, Instagram)
5. Multi-user support with authentication
