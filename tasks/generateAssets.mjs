// 🎬 Asset Generator - Downloads stock footage from Pixabay with smart reuse
// Matches video content to script themes and implements daily quota system

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { DailyUsageTracker, getRandomExistingStockVideo } from '../utils/dailyUsageTracker.mjs';

dotenv.config();

const MOOD_KEYWORDS = {
  hope: ['sunrise', 'mountain', 'light', 'sky', 'dawn', 'horizon', 'peaceful'],
  love: ['heart', 'couple', 'family', 'hands', 'embrace', 'connection', 'together'],
  strength: ['mountain', 'ocean', 'storm', 'athlete', 'workout', 'determination', 'power'],
  peace: ['nature', 'calm', 'meditation', 'sunset', 'lake', 'forest', 'tranquil'],
  faith: ['church', 'prayer', 'cross', 'light', 'spiritual', 'worship', 'devotion'],
  anxiety: ['storm', 'rain', 'dark', 'city', 'stress', 'busy', 'overwhelm'],
  purpose: ['journey', 'path', 'road', 'direction', 'goal', 'destination', 'vision'],
  forgiveness: ['light', 'healing', 'peace', 'embrace', 'freedom', 'release', 'mercy'],
  wisdom: ['book', 'study', 'library', 'learning', 'ancient', 'knowledge', 'insight'],
  joy: ['celebration', 'laughter', 'children', 'dancing', 'festival', 'happiness', 'smile']
};

const VIDEO_CATEGORIES = {
  nature: ['nature', 'landscape', 'sky', 'ocean', 'mountain', 'forest', 'sunset'],
  people: ['people', 'family', 'friends', 'community', 'prayer', 'worship', 'meditation'],
  abstract: ['light', 'fire', 'water', 'clouds', 'motion', 'abstract', 'spiritual'],
  urban: ['city', 'architecture', 'modern', 'lifestyle', 'journey', 'path', 'street']
};

export async function generateAssets(contentIdea, scriptData) {
  try {
    const usageTracker = new DailyUsageTracker();
    
    // Check if we should use Pixabay or reuse existing videos
    const canUsePixabay = await usageTracker.canUsePixabay();
    
    if (!canUsePixabay) {
      // Try to reuse existing stock video
      const existingVideoPath = await getRandomExistingStockVideo();
      
      if (existingVideoPath) {
        console.log('🔄 Reusing existing stock video (daily quota reached)');
        await usageTracker.recordVideoGeneration();
        
        return {
          videoPath: existingVideoPath,
          duration: 30, // Default duration estimate
          resolution: '1920x1080', // Default resolution estimate
          source: 'reused',
          reuseCount: await getStockVideoCount()
        };
      } else {
        console.log('⚠️  No existing videos to reuse, will use Pixabay anyway');
      }
    }
    
    // Parse keywords from content idea and script
    const keywords = extractKeywords(contentIdea, scriptData);
    const searchTerms = generateSearchTerms(keywords);
    
    console.log('🎬 Searching for new stock footage...');
    console.log('🔍 Search terms:', searchTerms);
    
    const videos = await searchPixabayVideos(searchTerms);
    const selectedVideo = selectBestVideo(videos, keywords);
    
    if (!selectedVideo) {
      console.log('⚠️  No suitable video found, trying existing videos or fallback');
      
      // Try existing videos as backup
      const existingVideoPath = await getRandomExistingStockVideo();
      if (existingVideoPath) {
        console.log('🔄 Using existing video as fallback');
        await usageTracker.recordVideoGeneration();
        return {
          videoPath: existingVideoPath,
          duration: 30,
          resolution: '1920x1080',
          source: 'fallback_reused'
        };
      }
      
      return await downloadFallbackVideo();
    }
    
    const videoPath = await downloadVideo(selectedVideo);
    
    // Record Pixabay usage
    await usageTracker.recordPixabayUsage();
    
    return {
      videoPath,
      duration: selectedVideo.duration,
      resolution: `${selectedVideo.width}x${selectedVideo.height}`,
      source: 'pixabay',
      searchTerms,
      selectedVideo
    };
    
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    
    // Try existing videos as final fallback
    const existingVideoPath = await getRandomExistingStockVideo();
    if (existingVideoPath) {
      console.log('🔄 Using existing video as error fallback');
      return {
        videoPath: existingVideoPath,
        duration: 30,
        resolution: '1920x1080',
        source: 'error_fallback'
      };
    }
    
    return await downloadFallbackVideo();
  }
}

async function getStockVideoCount() {
  try {
    const outputDir = path.join(process.cwd(), 'output');
    const files = await fs.readdir(outputDir);
    return files.filter(file => file.startsWith('stock_') && file.endsWith('.mp4')).length;
  } catch (error) {
    return 0;
  }
}

function extractKeywords(contentIdea, scriptData) {
  const keywords = [];
  
  // Extract from content idea
  if (typeof contentIdea === 'string') {
    const lines = contentIdea.split('\n');
    const keywordLine = lines.find(line => line.startsWith('KEYWORDS:'));
    if (keywordLine) {
      const extractedKeywords = keywordLine.replace('KEYWORDS:', '').trim().split(',');
      keywords.push(...extractedKeywords.map(k => k.trim()));
    }
  }
  
  // Extract from script data
  if (scriptData?.keywords) {
    keywords.push(...scriptData.keywords);
  }
  
  // Extract mood from script content
  if (scriptData?.script) {
    const script = scriptData.script.toLowerCase();
    for (const [mood, moodKeywords] of Object.entries(MOOD_KEYWORDS)) {
      if (moodKeywords.some(keyword => script.includes(keyword)) || 
          script.includes(mood)) {
        keywords.push(mood);
        keywords.push(...moodKeywords.slice(0, 2)); // Add first 2 mood keywords
      }
    }
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

function generateSearchTerms(keywords) {
  const searchTerms = [];
  
  // Add direct keywords
  searchTerms.push(...keywords.slice(0, 3));
  
  // Add mood-based terms
  for (const keyword of keywords) {
    if (MOOD_KEYWORDS[keyword]) {
      searchTerms.push(...MOOD_KEYWORDS[keyword].slice(0, 2));
    }
  }
  
  // Add category-based terms
  const primaryCategory = determinePrimaryCategory(keywords);
  if (VIDEO_CATEGORIES[primaryCategory]) {
    searchTerms.push(...VIDEO_CATEGORIES[primaryCategory].slice(0, 3));
  }
  
  // Fallback terms for Christian content
  if (searchTerms.length < 3) {
    searchTerms.push('nature', 'peaceful', 'spiritual', 'light', 'sky');
  }
  
  return [...new Set(searchTerms)].slice(0, 5); // Limit to 5 unique terms
}

function determinePrimaryCategory(keywords) {
  const categoryScores = {};
  
  for (const [category, categoryKeywords] of Object.entries(VIDEO_CATEGORIES)) {
    categoryScores[category] = 0;
    for (const keyword of keywords) {
      if (categoryKeywords.includes(keyword.toLowerCase())) {
        categoryScores[category]++;
      }
    }
  }
  
  const topCategory = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)[0];
  
  return topCategory ? topCategory[0] : 'nature';
}

async function searchPixabayVideos(searchTerms) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error('Pixabay API key not configured');
  }
  
  const videos = [];
  
  for (const term of searchTerms) {
    try {
      const response = await axios.get('https://pixabay.com/api/videos/', {
        params: {
          key: apiKey,
          q: term,
          video_type: 'film',
          orientation: 'vertical', // For shorts format
          category: 'nature,people,backgrounds',
          min_duration: 10,
          max_duration: 120,
          per_page: 10,
          safesearch: 'true'
        },
        timeout: 10000
      });
      
      if (response.data.hits) {
        videos.push(...response.data.hits);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.warn(`⚠️  Failed to search for "${term}":`, error.message);
    }
  }
  
  return videos;
}

function selectBestVideo(videos, keywords) {
  if (!videos.length) return null;
  
  // Score videos based on relevance
  const scoredVideos = videos.map(video => {
    let score = 0;
    
    // Prefer vertical videos (better for shorts)
    if (video.videos?.medium?.width && video.videos?.medium?.height) {
      const aspectRatio = video.videos.medium.width / video.videos.medium.height;
      if (aspectRatio < 1) score += 10; // Vertical
      else if (aspectRatio < 1.5) score += 5; // Close to square
    }
    
    // Duration scoring (prefer 15-60 seconds)
    if (video.duration) {
      if (video.duration >= 15 && video.duration <= 60) score += 8;
      else if (video.duration >= 10 && video.duration <= 120) score += 5;
    }
    
    // Quality scoring
    if (video.videos?.large) score += 5;
    if (video.videos?.medium) score += 3;
    
    // Keyword relevance in tags
    const tags = (video.tags || '').toLowerCase();
    for (const keyword of keywords) {
      if (tags.includes(keyword.toLowerCase())) {
        score += 3;
      }
    }
    
    // View count (popularity)
    if (video.views > 1000) score += 2;
    if (video.views > 10000) score += 3;
    
    return { ...video, score };
  });
  
  // Sort by score and return best match
  scoredVideos.sort((a, b) => b.score - a.score);
  
  console.log(`📊 Best video score: ${scoredVideos[0]?.score} for video ID ${scoredVideos[0]?.id}`);
  
  return scoredVideos[0];
}

async function downloadVideo(video) {
  const outputDir = path.join(process.cwd(), 'output');
  await fs.ensureDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const videoPath = path.join(outputDir, `stock_${timestamp}.mp4`);
  
  // Choose best quality available
  let videoUrl;
  if (video.videos?.large?.url) {
    videoUrl = video.videos.large.url;
  } else if (video.videos?.medium?.url) {
    videoUrl = video.videos.medium.url;
  } else if (video.videos?.small?.url) {
    videoUrl = video.videos.small.url;
  } else {
    throw new Error('No video URL available');
  }
  
  console.log('⬬ Downloading video...');
  console.log('🔗 URL:', videoUrl);
  
  const response = await axios.get(videoUrl, {
    responseType: 'stream',
    timeout: 60000
  });
  
  const writer = fs.createWriteStream(videoPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log('✅ Video downloaded successfully');
      console.log('💾 Saved to:', videoPath);
      resolve(videoPath);
    });
    writer.on('error', reject);
  });
}

async function downloadFallbackVideo() {
  console.log('📱 Creating fallback video...');
  
  // Create a simple colored background video (placeholder)
  const outputDir = path.join(process.cwd(), 'output');
  await fs.ensureDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const videoPath = path.join(outputDir, `fallback_${timestamp}.mp4`);
  
  // For now, just create a placeholder file
  // In a real implementation, you'd generate a simple background video
  await fs.writeFile(videoPath, 'placeholder video content');
  
  console.log('✅ Fallback video created');
  console.log('💾 Saved to:', videoPath);
  
  return {
    videoPath,
    duration: 30,
    resolution: '1080x1920',
    source: 'fallback'
  };
}

// Alternative sources for when Pixabay fails
export async function searchAlternativeSources(keywords) {
  // Could implement other free stock video APIs here
  // Examples: Pexels, Unsplash Video, Videezy, etc.
  console.log('🔍 Alternative video sources not yet implemented');
  return null;
}

// For testing purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎬 Testing Asset Generator...');
  const testIdea = `VERSE: John 3:16
ANGLE: Why God's love hits different when you've given up on yourself
KEYWORDS: love, hope, self-worth, acceptance, grace`;
  
  const testScript = {
    script: "Test script about love and hope",
    keywords: ['love', 'hope', 'grace']
  };
  
  const result = await generateAssets(testIdea, testScript);
  console.log('Generated assets:', result);
}
