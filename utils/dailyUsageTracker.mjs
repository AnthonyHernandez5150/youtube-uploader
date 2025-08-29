// 📊 Daily Usage Tracker - Manages API quotas and stock video reuse
// Tracks daily Pixabay usage and implements smart reuse strategy

import fs from 'fs-extra';
import path from 'path';

const USAGE_FILE = path.join(process.cwd(), 'logs', 'daily_usage.json');
const DAILY_PIXABAY_LIMIT = 2; // First 2 videos per day use Pixabay

export class DailyUsageTracker {
  constructor() {
    this.usageData = null;
  }

  async loadUsageData() {
    try {
      if (await fs.pathExists(USAGE_FILE)) {
        this.usageData = await fs.readJson(USAGE_FILE);
      } else {
        this.usageData = {
          date: new Date().toDateString(),
          pixabayCount: 0,
          videosGenerated: 0,
          lastReset: new Date().toISOString()
        };
        await this.saveUsageData();
      }
    } catch (error) {
      console.error('❌ Error loading usage data:', error);
      this.resetUsageData();
    }
  }

  async saveUsageData() {
    try {
      await fs.ensureDir(path.dirname(USAGE_FILE));
      await fs.writeJson(USAGE_FILE, this.usageData, { spaces: 2 });
    } catch (error) {
      console.error('❌ Error saving usage data:', error);
    }
  }

  resetUsageData() {
    this.usageData = {
      date: new Date().toDateString(),
      pixabayCount: 0,
      videosGenerated: 0,
      lastReset: new Date().toISOString()
    };
  }

  async checkAndResetDaily() {
    const today = new Date().toDateString();
    
    if (!this.usageData || this.usageData.date !== today) {
      console.log('📅 New day detected, resetting usage counters');
      this.resetUsageData();
      await this.saveUsageData();
      return true;
    }
    return false;
  }

  async canUsePixabay() {
    await this.loadUsageData();
    await this.checkAndResetDaily();
    
    const canUse = this.usageData.pixabayCount < DAILY_PIXABAY_LIMIT;
    
    console.log(`📊 Pixabay usage: ${this.usageData.pixabayCount}/${DAILY_PIXABAY_LIMIT} today`);
    
    if (canUse) {
      console.log('✅ Can use Pixabay API (fresh content)');
    } else {
      console.log('🔄 Daily Pixabay limit reached, will reuse existing stock videos');
    }
    
    return canUse;
  }

  async recordPixabayUsage() {
    await this.loadUsageData();
    this.usageData.pixabayCount++;
    this.usageData.videosGenerated++;
    await this.saveUsageData();
    
    console.log(`📈 Recorded Pixabay usage: ${this.usageData.pixabayCount}/${DAILY_PIXABAY_LIMIT}`);
  }

  async recordVideoGeneration() {
    await this.loadUsageData();
    this.usageData.videosGenerated++;
    await this.saveUsageData();
    
    console.log(`🎬 Total videos generated today: ${this.usageData.videosGenerated}`);
  }

  async getUsageStats() {
    await this.loadUsageData();
    await this.checkAndResetDaily();
    
    return {
      date: this.usageData.date,
      pixabayUsed: this.usageData.pixabayCount,
      pixabayLimit: DAILY_PIXABAY_LIMIT,
      pixabayRemaining: Math.max(0, DAILY_PIXABAY_LIMIT - this.usageData.pixabayCount),
      videosGenerated: this.usageData.videosGenerated,
      canUsePixabay: this.usageData.pixabayCount < DAILY_PIXABAY_LIMIT
    };
  }
}

export async function getRandomExistingStockVideo() {
  try {
    const outputDir = path.join(process.cwd(), 'output');
    const files = await fs.readdir(outputDir);
    
    // Find all stock video files
    const stockVideos = files.filter(file => 
      file.startsWith('stock_') && file.endsWith('.mp4')
    );
    
    if (stockVideos.length === 0) {
      console.log('❌ No existing stock videos found');
      return null;
    }
    
    // Randomly select one
    const randomVideo = stockVideos[Math.floor(Math.random() * stockVideos.length)];
    const videoPath = path.join(outputDir, randomVideo);
    
    console.log(`🎲 Selected random stock video: ${randomVideo}`);
    console.log(`📁 Available stock videos: ${stockVideos.length}`);
    
    return videoPath;
    
  } catch (error) {
    console.error('❌ Error getting random stock video:', error);
    return null;
  }
}

export async function listStockVideos() {
  try {
    const outputDir = path.join(process.cwd(), 'output');
    const files = await fs.readdir(outputDir);
    
    const stockVideos = files.filter(file => 
      file.startsWith('stock_') && file.endsWith('.mp4')
    );
    
    return stockVideos.map(file => ({
      filename: file,
      path: path.join(outputDir, file),
      created: fs.statSync(path.join(outputDir, file)).birthtime
    })).sort((a, b) => b.created - a.created); // Newest first
    
  } catch (error) {
    console.error('❌ Error listing stock videos:', error);
    return [];
  }
}
