# Bible Shorts AutoUploader

> **🚀 QUICK START: Just double-click `START_HERE.bat` to launch the GUI!**
> 
> Or run: `npm run gui` (your familiar way!)

An automated AI-powered pipeline that creates and uploads Bible verse YouTube Shorts with modern, engaging content.

## 🎯 What This App Does

1. **Content Planning** - Uses AI to brainstorm engaging Bible verse topics
2. **Script Generation** - Creates modern, conversational devotional scripts
3. **Voice Narration** - Generates AI voice-over using ElevenLabs or local Chatterbox
4. **Stock Footage** - Downloads relevant video content from Pixabay API
5. **Video Rendering** - Combines everything into a professional YouTube Short
6. **Auto-Upload** - Publishes to YouTube with optimized titles, descriptions, and tags

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd bible-shorts-autouploader
npm install
```

### 2. Environment Setup

Copy `.env` and fill in your API keys:

```bash
# Required APIs
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here  
PIXABAY_API_KEY=your_pixabay_api_key_here

# YouTube OAuth (get from Google Console)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

### 3. YouTube OAuth Setup

```bash
# Setup OAuth credentials  
npm run setup

# Follow the instructions to:
# 1. Create Google Cloud project
# 2. Enable YouTube Data API v3
# 3. Download client_secret.json to /auth folder
```

### 4. Run the Pipeline

```bash
# Create and upload 2 videos (default)
npm start

# Create just one video
npm start -- --single

# Test without uploading
npm start -- --dry-run --skip-upload
```

## 📁 Project Structure

```
bible-shorts-autouploader/
│
├── index.mjs                 # Main pipeline orchestrator
├── package.json              # Dependencies and scripts
├── .env                      # API keys and configuration
│
├── agents/
│   └── babyagi.mjs          # AI content planning agent
│
├── tasks/
│   ├── generateScript.mjs   # Script writer using GPT
│   ├── generateVoice.mjs    # Voice synthesis (ElevenLabs/Chatterbox)  
│   ├── generateAssets.mjs   # Stock video downloader (Pixabay)
│   └── uploadVideo.mjs      # YouTube uploader with OAuth
│
├── render/
│   └── renderVideo.mjs      # Video composition with ffmpeg
│
├── output/                  # Generated content
│   ├── narration_*.wav      # Voice files
│   ├── stock_*.mp4          # Downloaded videos
│   ├── final_video_*.mp4    # Finished shorts
│   └── script_*.txt         # Generated scripts
│
├── auth/
│   ├── client_secret.json   # Google OAuth credentials
│   └── token.json           # Stored auth tokens
│
└── logs/                    # Pipeline logs and analytics
    ├── daily_*.json         # Daily upload records
    └── pipeline_*.json      # Execution logs
```

## 🔧 Configuration Options

### Video Settings
```env
VIDEO_WIDTH=1080            # YouTube Shorts width
VIDEO_HEIGHT=1920           # YouTube Shorts height (9:16 ratio)
VIDEO_DURATION=30           # Seconds
VIDEO_FPS=30               # Frames per second
```

### Content Settings
```env
DAILY_VIDEO_COUNT=2         # Videos per run
PRIVACY_STATUS=public       # public/private/unlisted
```

### API Alternatives
```env
# Use local Chatterbox instead of ElevenLabs
CHATTERBOX_URL=http://localhost:5000

# Use OpenRouter instead of OpenAI
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=anthropic/claude-3-sonnet
```

## 🎬 Pipeline Workflow

### 1. Content Planning (`babyagi.mjs`)
- Generates creative Bible verse angles
- Output: `"VERSE: John 3:16\nANGLE: Why God's love hits different when you've given up on yourself\nKEYWORDS: love, hope, self-worth"`

### 2. Script Generation (`generateScript.mjs`)
- Converts verse + angle into 30-second spoken script
- Optimized for young adult audience
- Natural, conversational tone

### 3. Voice Generation (`generateVoice.mjs`)
- **ElevenLabs**: Professional AI voices with emotion
- **Chatterbox**: Local voice cloning server
- Output: High-quality WAV narration

### 4. Asset Generation (`generateAssets.mjs`)
- Searches Pixabay for mood-matching stock footage
- Filters for vertical videos (9:16 aspect ratio)
- Auto-selects based on script keywords

### 5. Video Rendering (`renderVideo.mjs`)
- Combines voice + video using ffmpeg
- Scales to 1080x1920 (YouTube Shorts format)
- Optional text overlays and effects

### 6. YouTube Upload (`uploadVideo.mjs`)
- OAuth2 authentication
- Optimized titles and descriptions
- Auto-generated hashtags
- Optional thumbnail upload

## 🛠️ CLI Commands

```bash
# Standard operations
npm start                    # Run full pipeline
npm start -- --single       # Create one video only
npm start -- --dry-run      # Test without uploading

# Maintenance  
npm start setup             # Setup YouTube OAuth
npm start test              # Test pipeline components
npm start clean             # Clean temporary files
npm start stats             # Show upload statistics
```

## 🔌 API Requirements

### Required APIs
1. **OpenAI** - Script generation ($20/month gets you ~1000 videos)
2. **ElevenLabs** - Voice synthesis ($5/month for 30,000 characters)  
3. **Pixabay** - Stock footage (Free tier: 5,000 downloads/month)
4. **YouTube Data API v3** - Video uploads (Free: 10,000 requests/day)

### Optional APIs
- **OpenRouter** - Alternative to OpenAI with more model options
- **Chatterbox** - Local voice server for voice cloning

## 🤖 Voice Setup Options

### Option 1: ElevenLabs (Easiest)

```env
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB  # Default: Adam
```

### Option 2: Local Chatterbox (Advanced)

```bash
# Clone and run Chatterbox server
git clone https://github.com/resemble-ai/chatterbox.git
cd chatterbox
python app.py
```

### Option 3: Custom Voice Cloning (Recommended)

Use your own voice for narration with Chatterbox voice cloning:

1. **Record your voice sample** (10-30 seconds of clear speech)
2. **Save as `your_voice.wav`** in the `chatterbox/` folder
3. **Configure in .env**:

   ```env
   CHATTERBOX_CUSTOM_VOICE_PATH=./chatterbox/your_voice.wav
   ```

4. **Run the pipeline** - it will automatically use your voice!

The app will:

- ✅ Automatically detect your voice file
- ✅ Clone your voice for all narration
- ✅ Fall back to default voice if your file is missing
- ✅ Work with both single and chunked script generation

# Then set in .env:
CHATTERBOX_URL=http://localhost:5000
```

## 📅 Automation & Scheduling

### CRON Setup (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line to run twice daily at 6am and 6pm:
0 6,18 * * * cd /path/to/bible-shorts-autouploader && node index.mjs
```

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 6:00 AM
4. Action: Start Program
5. Program: `node`
6. Arguments: `index.mjs`
7. Start in: Your project directory

## 📊 Analytics & Monitoring

The pipeline automatically logs:
- Upload success/failure rates
- Processing times per video
- API usage statistics
- YouTube video performance (views, likes)

Check logs in `/logs` directory:
```bash
npm start stats              # View recent statistics
```

## 🛠️ Customization

### Custom Voice Training
```javascript
// Clone your voice with Chatterbox
import { cloneVoice } from './tasks/generateVoice.mjs';
await cloneVoice('./your_voice_sample.wav', 'my_voice');
```

### Custom Video Effects
```javascript
// Add effects in renderVideo.mjs
await addVideoEffects(videoPath, outputPath, {
  brightness: 0.1,
  contrast: 1.2,
  fadeIn: 2,
  fadeOut: 2
});
```

### Custom Content Themes
Edit `MOOD_KEYWORDS` in `generateAssets.mjs` to match videos to your content style.

## 🔧 Troubleshooting

### Common Issues

**"OAuth setup required"**
- Complete YouTube API setup in Google Console
- Download `client_secret.json` to `/auth` folder
- Run `npm start setup`

**"Pixabay API key not configured"**
- Get free API key from pixabay.com
- Add to `.env` file

**"FFmpeg not found"**
- Install included with `ffmpeg-static` package
- On Windows: May need to install Visual C++ Redistributable

**"Voice generation failed"**
- Check ElevenLabs API key and credits
- Try Chatterbox local server as backup
- Fallback creates silent placeholder audio

### Debug Mode
```bash
npm start -- --verbose       # Show detailed logs
npm start test               # Test each component
```

## 📈 Content Strategy

### Successful Video Types
- **Modern applications** of classic verses
- **Practical advice** for real struggles  
- **Emotional hooks** that resonate with young adults
- **Authentic tone** that doesn't feel preachy

### Optimization Tips
- Upload consistently (same times daily)
- Use trending hashtags alongside faith tags
- Keep scripts conversational and relatable
- Choose visually appealing stock footage
- Respond to comments to boost engagement

## 🤝 Contributing

This is a template for your own Bible content automation. Feel free to:
- Add new video effects
- Integrate additional APIs
- Improve content generation prompts
- Add analytics dashboards
- Create mobile apps for content management

## 📜 License & Usage

- Scripture content used under fair use for educational/inspirational purposes
- Stock footage properly licensed through Pixabay
- AI-generated content is original and copyright-free
- Open source for personal and ministry use

## 🙏 Credits

Built with love for spreading Biblical wisdom through modern technology.

**APIs Used:**
- OpenAI GPT for intelligent script writing
- ElevenLabs for professional voice synthesis  
- Pixabay for beautiful stock footage
- YouTube Data API for seamless uploads
- FFmpeg for professional video rendering

---

*"Your word is a lamp for my feet, a light on my path." - Psalm 119:105* ✝️
