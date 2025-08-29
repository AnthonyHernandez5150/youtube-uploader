# 🎬 YouTube Shorts Upload - Complete Setup Guide

## 📋 **STEP-BY-STEP SETUP CHECKLIST**

### ✅ **Phase 1: Google Cloud Console Setup**

1. **Create/Select Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Create new project: "Bible Shorts AutoUploader"
   - Note your Project ID

2. **Enable YouTube Data API v3**
   - Navigation: APIs & Services > Library
   - Search: "YouTube Data API v3"
   - Click: Enable

3. **Configure OAuth Consent Screen** (IMPORTANT!)
   - Navigation: APIs & Services > OAuth consent screen
   - User Type: External (unless Google Workspace)
   - App Information:
     - App name: "Bible Shorts AutoUploader"
     - User support email: your email
     - Developer contact: your email
   - Scopes: Add `../auth/youtube.upload`
   - Test users: Add your YouTube channel email

4. **Create OAuth 2.0 Credentials**
   - Navigation: APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client IDs
   - Application type: Desktop application
   - Name: "Bible Shorts Uploader"
   - Download JSON file

### ✅ **Phase 2: Local Setup**

1. **Install credentials**
   ```bash
   # Rename downloaded file to client_secret.json
   # Move to: ./auth/client_secret.json
   ```

2. **Run OAuth setup**
   ```bash
   npm run setup
   ```
   
   This will:
   - Open browser for authentication
   - Generate access/refresh tokens
   - Test YouTube API connection
   - Show your channel information

3. **Verify setup**
   ```bash
   npm run channel-info
   ```

### ✅ **Phase 3: Upload Configuration**

Update your `.env` file:
```env
# YouTube Upload Settings
PRIVACY_STATUS=public
DAILY_VIDEO_COUNT=2
UPLOAD_SCHEDULE=6,18

# Required APIs
PIXABAY_API_KEY=your_key_here
CHATTERBOX_CUSTOM_VOICE_PATH=./chatterbox/your_voice.wav
```

### ✅ **Phase 4: Automation Setup**

#### Option A: Windows Task Scheduler (Recommended)

1. **Open Task Scheduler**
   - Windows key + R → `taskschd.msc`

2. **Create Morning Task (6 AM)**
   - Action: Create Basic Task
   - Name: "Bible Shorts Upload - Morning"
   - Trigger: Daily at 6:00 AM
   - Action: Start a program
     - Program: `C:\Users\mrtig\Desktop\Bible Shorts AutoUploader\run_daily.bat`
     - Start in: `C:\Users\mrtig\Desktop\Bible Shorts AutoUploader`

3. **Create Evening Task (6 PM)**
   - Same steps but at 6:00 PM
   - Name: "Bible Shorts Upload - Evening"

4. **Test the task**
   - Right-click task → Run
   - Check output folder for new video

#### Option B: Manual Daily Runs
```bash
# Create one video and upload
npm run single

# Create 2 videos and upload
npm start
```

### ✅ **Phase 5: YouTube Channel Optimization**

1. **Channel Setup for Shorts**
   - Go to YouTube Studio
   - Settings > Channel > Basic info
   - Description: "Daily Bible wisdom for modern life #Shorts"
   - Add channel keywords: bible, faith, christian, shorts, devotional

2. **Enable Features**
   - YouTube Studio > Settings > Channel > Feature eligibility
   - Ensure all features are enabled (especially custom thumbnails)

3. **Shorts Settings**
   - Upload defaults: Set category to "People & Blogs"
   - Enable comments and community features

## 🚀 **TESTING YOUR SETUP**

### Test 1: Authentication
```bash
npm run setup
# Should show: ✅ Successfully connected to YouTube channel
```

### Test 2: Single Video Creation
```bash
npm start -- --single --skip-upload
# Should create video in output folder
```

### Test 3: Full Upload Test
```bash
npm start -- --single
# Should create AND upload video to YouTube
```

## 📊 **WHAT GETS UPLOADED**

Each video includes:

### **Optimized Title** (Under 60 chars for mobile)
- "John 3:16: God's love hits different 💯 #Shorts"
- "📖 Proverbs 3:5-6 - Stop overthinking... #Shorts"

### **SEO Description** (First 125 chars crucial)
- Hook line for mobile preview
- Scripture reference
- Call to action (subscribe, like, comment)
- 20+ relevant hashtags
- Upload schedule info

### **Strategic Tags** (15 tags max)
- Bible book names
- Faith keywords
- Trending hashtags
- Verse-specific terms

### **Video Specs** (YouTube Shorts optimized)
- Resolution: 1080x1920 (9:16 aspect ratio)
- Duration: 30 seconds
- Format: MP4, H.264 codec
- Audio: AAC, stereo
- Subtitles: Verse overlay text

## 🔧 **TROUBLESHOOTING**

### "OAuth setup required"
```bash
# Delete existing tokens and re-authenticate
rm auth/token.json
npm run setup
```

### "Quota exceeded"
- YouTube API limit: 10,000 units/day
- Each upload uses ~1,600 units
- Max ~6 uploads per day
- Solution: Request quota increase or spread uploads

### "Video upload failed"
- Check file size (max 256GB, but aim for <50MB)
- Verify video format (MP4 recommended)
- Ensure internet connection stable
- Check YouTube API status

### "Channel not found"
- Ensure you have a YouTube channel
- Use same Google account for OAuth
- Check channel is not suspended

## 📈 **OPTIMIZATION TIPS**

### **Content Strategy**
- Test different posting times
- Monitor which verses perform best
- A/B test title formats
- Track subscriber growth

### **Technical Optimization**
- Keep videos under 30MB for faster upload
- Use consistent video quality settings
- Monitor API quota usage
- Set up error logging

### **Growth Hacks**
- Reply to early comments quickly
- Post consistently (same times daily)
- Cross-promote on other platforms
- Collaborate with other faith creators

## ⏰ **DAILY WORKFLOW**

### **Automated (Recommended)**
1. 6:00 AM: Morning video auto-uploads
2. 6:00 PM: Evening video auto-uploads
3. Check YouTube Studio for performance
4. Reply to comments

### **Manual Oversight**
1. Review generated content weekly
2. Adjust .env settings if needed
3. Monitor API quota usage
4. Check for failed uploads

## 🎯 **SUCCESS METRICS**

Track these in YouTube Analytics:
- Views per video (target: 1,000+)
- Subscriber growth (target: 10+ daily)
- Comment engagement (target: 5%+)
- Click-through rate (target: 8%+)
- Watch time (target: 70%+)

## 🆘 **SUPPORT**

If you need help:
1. Check logs in `./logs/` folder
2. Review error messages in console
3. Verify all API keys are valid
4. Check YouTube API quotas
5. Test individual pipeline components

Your setup is now complete! 🎉

Run `npm start` to create your first automated Bible Shorts! 🚀
