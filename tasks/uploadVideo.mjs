// 📤 YouTube Uploader - Handles OAuth authentication and video uploads
// Uploads videos with titles, descriptions, tags, and thumbnails

import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = path.join(process.cwd(), 'auth', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'auth', 'client_secret.json');

export async function uploadToYouTube(videoResult, contentIdea, scriptData) {
  try {
    console.log('📤 Starting YouTube upload...');
    
    // Authenticate with YouTube API
    const auth = await authenticateYouTube();
    const youtube = google.youtube({ version: 'v3', auth });
    
    // Generate video metadata
    const metadata = generateVideoMetadata(contentIdea, scriptData);
    
    // Upload the video
    const uploadResult = await uploadVideo(youtube, videoResult.videoPath, metadata);
    
    // Upload thumbnail if available
    if (metadata.thumbnailPath && await fs.pathExists(metadata.thumbnailPath)) {
      await uploadThumbnail(youtube, uploadResult.id, metadata.thumbnailPath);
    }
    
    console.log('✅ Video uploaded successfully!');
    console.log('🔗 Video URL:', `https://www.youtube.com/watch?v=${uploadResult.id}`);
    console.log('📊 Video ID:', uploadResult.id);
    
    return {
      videoId: uploadResult.id,
      videoUrl: `https://www.youtube.com/watch?v=${uploadResult.id}`,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      uploadTime: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ YouTube upload failed:', error);
    throw error;
  }
}

async function authenticateYouTube() {
  try {
    // Load client credentials
    const credentials = await fs.readJson(CREDENTIALS_PATH);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    
    // Check if we have a stored token
    if (await fs.pathExists(TOKEN_PATH)) {
      const token = await fs.readJson(TOKEN_PATH);
      oAuth2Client.setCredentials(token);
      
      // Check if token is still valid
      try {
        await oAuth2Client.getAccessToken();
        console.log('✅ Using existing authentication token');
        return oAuth2Client;
      } catch (error) {
        console.log('🔄 Token expired, need to re-authenticate');
        // Token expired, need to refresh or re-authenticate
        if (token.refresh_token) {
          try {
            const { tokens } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(tokens);
            await fs.writeJson(TOKEN_PATH, tokens, { spaces: 2 });
            console.log('✅ Token refreshed successfully');
            return oAuth2Client;
          } catch (refreshError) {
            console.log('❌ Token refresh failed, need full re-authentication');
          }
        }
      }
    }
    
    // Need to authenticate - direct user to setup script
    throw new Error('Authentication required. Please run: npm run setup');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

function generateVideoMetadata(contentIdea, scriptData) {
  // Parse content idea
  const lines = contentIdea.split('\n');
  const verse = lines.find(line => line.startsWith('VERSE:'))?.replace('VERSE:', '').trim();
  const angle = lines.find(line => line.startsWith('ANGLE:'))?.replace('ANGLE:', '').trim();
  const keywords = lines.find(line => line.startsWith('KEYWORDS:'))?.replace('KEYWORDS:', '').trim();
  
  // Generate title
  const title = generateTitle(verse, angle);
  
  // Generate description
  const description = generateDescription(verse, angle, scriptData?.script);
  
  // Generate tags
  const tags = generateTags(keywords, verse);
  
  // Generate thumbnail path
  const thumbnailPath = path.join(process.cwd(), 'output', 'thumbnail.png');
  
  return {
    title,
    description,
    tags,
    thumbnailPath,
    categoryId: '22', // People & Blogs
    privacyStatus: process.env.PRIVACY_STATUS || 'public',
    verse,
    angle
  };
}

function generateTitle(verse, angle) {
  // Optimize titles for YouTube Shorts
  const shortTitles = [
    `${verse}: ${angle.substring(0, 40)}... #Shorts`,
    `📖 ${verse} - ${angle.substring(0, 35)}... #Shorts`,
    `${verse} Hits Different 💯 #Faith #Shorts`,
    `Bible Truth: ${angle.substring(0, 30)}... (${verse})`,
    `✝️ ${verse}: ${angle.substring(0, 35)}... #Bible`,
    `🔥 ${angle.substring(0, 40)}... - ${verse} #Shorts`
  ];
  
  let selectedTitle = shortTitles[Math.floor(Math.random() * shortTitles.length)];
  
  // Ensure title is under 100 characters for optimal display
  if (selectedTitle.length > 100) {
    // Create a shorter version
    const verseShort = verse.split(' ').slice(0, 2).join(' '); // e.g., "John 3:16" -> "John 3"
    selectedTitle = `${verseShort}: ${angle.substring(0, 50)}... #Shorts`;
    
    if (selectedTitle.length > 100) {
      selectedTitle = `${verseShort}: ${angle.substring(0, 40)}... #Shorts`;
    }
  }
  
  return selectedTitle;
}

function generateDescription(verse, angle, script) {
  // First 125 characters are crucial for mobile preview
  const hook = angle.length > 120 ? angle.substring(0, 117) + '...' : angle;
  
  const description = `${hook}

📖 Scripture: ${verse}

${script ? '💭 ' + script.substring(0, 150) + '...' : ''}

🔔 SUBSCRIBE for daily Bible wisdom that hits different!
👍 LIKE if this spoke to your heart
� COMMENT your favorite verse below
🔄 SHARE to spread God's love

📱 More faith content:
• Daily Bible insights
• Modern devotionals  
• Real faith talk
• Biblical life guidance

⏰ New videos daily at 6 AM & 6 PM

---

#Bible #Faith #Christian #Shorts #${verse.replace(/[^a-zA-Z0-9]/g, '')} #Devotional #Scripture #God #Jesus #Hope #Love #Peace #Strength #Purpose #Prayer #Spiritual #Daily #Modern #Youth #Inspiration #Motivation #Truth #Gospel #BibleVerse #ChristianLife #Wisdom #Blessed #Amen

---

🙏 Video created with love and faith
© Bible content used under fair use for educational purposes

📧 For questions or prayer requests: [your email]
🌐 More content: [your website/social]`;

  return description;
}

function generateTags(keywords, verse) {
  const baseTags = [
    'bible',
    'faith',
    'christian',
    'shorts',
    'devotional',
    'scripture',
    'god',
    'jesus',
    'wisdom',
    'inspiration',
    'spiritual',
    'prayer',
    'hope',
    'love'
  ];
  
  const keywordTags = keywords ? 
    keywords.split(',').map(k => k.trim().toLowerCase()) : [];
  
  const verseTags = [
    verse.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    verse.split(' ')[0].toLowerCase() // Book name
  ];
  
  // Combine all tags and limit to 15 (YouTube limit is 500 characters total)
  const allTags = [...baseTags, ...keywordTags, ...verseTags];
  const uniqueTags = [...new Set(allTags)];
  
  return uniqueTags.slice(0, 15);
}

async function uploadVideo(youtube, videoPath, metadata) {
  console.log('📹 Uploading video file...');
  console.log('📋 Title:', metadata.title);
  console.log('🏷️  Tags:', metadata.tags.join(', '));
  
  const requestBody = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId,
      defaultLanguage: 'en',
      defaultAudioLanguage: 'en'
    },
    status: {
      privacyStatus: metadata.privacyStatus,
      selfDeclaredMadeForKids: false,
      embeddable: true,
      publicStatsViewable: true
    }
  };
  
  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(videoPath)
  };
  
  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media
    });
    
    console.log('✅ Video uploaded with ID:', response.data.id);
    return response.data;
    
  } catch (error) {
    console.error('❌ Video upload failed:', error);
    throw error;
  }
}

async function uploadThumbnail(youtube, videoId, thumbnailPath) {
  try {
    console.log('📸 Uploading thumbnail...');
    
    const media = {
      mimeType: 'image/png',
      body: fs.createReadStream(thumbnailPath)
    };
    
    await youtube.thumbnails.set({
      videoId,
      media
    });
    
    console.log('✅ Thumbnail uploaded successfully');
    
  } catch (error) {
    console.error('❌ Thumbnail upload failed:', error);
    // Don't throw - thumbnail upload failure shouldn't stop the process
  }
}

export async function scheduleUpload(videoResult, contentIdea, scriptData, scheduledTime) {
  // This would implement scheduled uploads
  // For now, just upload immediately
  console.log('⏰ Scheduled uploads not yet implemented, uploading now...');
  return await uploadToYouTube(videoResult, contentIdea, scriptData);
}

export async function updateVideoMetadata(videoId, newMetadata) {
  try {
    const auth = await authenticateYouTube();
    const youtube = google.youtube({ version: 'v3', auth });
    
    const response = await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: newMetadata
      }
    });
    
    console.log('✅ Video metadata updated');
    return response.data;
    
  } catch (error) {
    console.error('❌ Metadata update failed:', error);
    throw error;
  }
}

export async function getVideoAnalytics(videoId) {
  try {
    const auth = await authenticateYouTube();
    const youtube = google.youtube({ version: 'v3', auth });
    
    const response = await youtube.videos.list({
      part: ['statistics', 'snippet'],
      id: [videoId]
    });
    
    if (response.data.items.length > 0) {
      const video = response.data.items[0];
      return {
        views: video.statistics.viewCount,
        likes: video.statistics.likeCount,
        comments: video.statistics.commentCount,
        title: video.snippet.title,
        publishedAt: video.snippet.publishedAt
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Analytics retrieval failed:', error);
    throw error;
  }
}

// Setup OAuth credentials
export async function setupOAuth() {
  try {
    const authDir = path.join(process.cwd(), 'auth');
    await fs.ensureDir(authDir);
    
    console.log('🔐 OAuth Setup Instructions:');
    console.log('1. Go to https://console.developers.google.com/');
    console.log('2. Create a new project or select existing');
    console.log('3. Enable YouTube Data API v3');
    console.log('4. Create OAuth 2.0 credentials');
    console.log('5. Download the client_secret.json file');
    console.log(`6. Place it in: ${path.join(authDir, 'client_secret.json')}`);
    console.log('7. Run the upload function to complete authentication');
    
    const sampleCredentials = {
      "installed": {
        "client_id": "your-client-id.googleusercontent.com",
        "project_id": "your-project-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "your-client-secret",
        "redirect_uris": ["http://localhost:8080"]
      }
    };
    
    const samplePath = path.join(authDir, 'client_secret_sample.json');
    await fs.writeJson(samplePath, sampleCredentials, { spaces: 2 });
    
    console.log(`📄 Sample credentials file created: ${samplePath}`);
    
  } catch (error) {
    console.error('❌ OAuth setup failed:', error);
    throw error;
  }
}

// For testing purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📤 Testing YouTube Uploader...');
  await setupOAuth();
}
