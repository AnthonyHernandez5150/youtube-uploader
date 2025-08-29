# YouTube Shorts Upload Setup Guide

## 🎯 Complete Setup for Daily YouTube Shorts Upload

### Step 1: Google Cloud Console Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "New Project" or select existing project
   - Name it "Bible Shorts AutoUploader"

2. **Enable YouTube Data API v3**
   - Go to "APIs & Services" > "Library"
   - Search "YouTube Data API v3"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Desktop Application"
   - Name it "Bible Shorts Uploader"
   - Download the JSON file

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Fill in app information:
     - App name: "Bible Shorts AutoUploader"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `../auth/youtube.upload`
   - Add test users: your YouTube channel email

### Step 2: Install Credentials

1. **Rename downloaded file** to `client_secret.json`
2. **Place in auth folder**: `./auth/client_secret.json`

### Step 3: YouTube Channel Optimization

1. **Channel Settings for Shorts**
   - Go to YouTube Studio
   - Settings > Channel > Basic info
   - Add channel description mentioning daily Bible content
   - Add channel art optimized for faith content

2. **Shorts-Specific Settings**
   - Enable community posts
   - Set up channel sections
   - Add channel trailer (optional)

### Step 4: First-Time Authentication

Run the authentication setup:
```bash
npm run setup
```

This will:
- Open browser for OAuth consent
- Generate access/refresh tokens
- Store tokens securely

### Step 5: Daily Scheduling Setup

#### Option A: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 6 AM and 6 PM
4. Action: Start Program
   - Program: `node`
   - Arguments: `index.mjs`
   - Start in: `C:\Users\mrtig\Desktop\Bible Shorts AutoUploader`

#### Option B: GitHub Actions (Recommended)
- Automatically runs in cloud
- No need to keep computer on
- Free for public repos

### Step 6: Upload Configuration

Configure in `.env`:
```env
# YouTube Upload Settings
PRIVACY_STATUS=public
DAILY_VIDEO_COUNT=2
UPLOAD_SCHEDULE=6,18
```

## 🎬 YouTube Shorts Best Practices

### Title Optimization
- Keep under 60 characters for mobile
- Include verse reference
- Use emojis strategically
- Include "#Shorts" hashtag

### Description Structure
1. Hook line (first 125 characters visible)
2. Scripture reference
3. Call to action (subscribe)
4. Relevant hashtags
5. Credits/disclaimer

### Tags Strategy
- Use all 15 tag slots
- Mix broad + specific tags
- Include Bible book names
- Add trending faith hashtags

### Upload Timing
- 6 AM: Morning devotional crowd
- 6 PM: Evening reflection audience
- Avoid Sundays (high church content competition)

## 🔧 Troubleshooting

### "OAuth setup required"
- Run authentication setup
- Check client_secret.json exists
- Verify OAuth consent screen approved

### "Quota exceeded"
- YouTube API has daily limits
- Wait 24 hours or request quota increase
- Consider spreading uploads across time

### "Upload failed"
- Check internet connection
- Verify video file exists and isn't corrupted
- Check YouTube API quotas

## 📊 Analytics & Optimization

### Track Performance
- Views per video
- Click-through rates
- Subscriber growth
- Comment engagement

### Content Optimization
- Test different verse types
- A/B test titles
- Monitor trending hashtags
- Adjust posting times based on analytics

## 🚀 Advanced Features

### Custom Thumbnails
- Auto-generate thumbnails with verse text
- Use consistent branding
- High contrast for mobile viewing

### Community Features
- Auto-reply to comments
- Community posts with daily verses
- Polls about favorite Bible books

### Multi-Channel Support
- Upload to multiple channels
- Different content themes per channel
- Coordinated release schedules
