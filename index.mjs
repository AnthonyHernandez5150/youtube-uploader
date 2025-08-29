// ✝️ AUTO-YOUTUBER PIPELINE FOR BIBLE VERSE SHORTS
// Main orchestration script that runs the entire content creation pipeline

import { generateScript } from "./tasks/generateScript.mjs";
import { checkAndRefreshScripts } from "./script_refresher.mjs";
import { generateVoice } from "./tasks/generateVoice.mjs";
import { generateAssets } from "./tasks/generateAssets.mjs";
import { renderVideo } from "./render/renderVideo.mjs";
import { uploadToYouTube } from "./tasks/uploadVideo.mjs";
import { 
  detectMissedUploads, 
  processRetryQueue, 
  addToRetryQueue,
  cleanupOldRetries 
} from "./systems/uploadRecovery.mjs";
import fs from 'fs-extra';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

// Configuration
const CONFIG = {
  dailyVideoCount: parseInt(process.env.DAILY_VIDEO_COUNT) || 2,
  outputDir: process.env.OUTPUT_DIR || './output',
  tempDir: process.env.TEMP_DIR || './temp',
  dryRun: process.argv.includes('--dry-run'),
  singleVideo: process.argv.includes('--single'),
  skipUpload: process.argv.includes('--skip-upload'),
  verbose: process.argv.includes('--verbose')
};

// Pipeline state tracking
let pipelineStats = {
  totalVideos: 0,
  successfulUploads: 0,
  errors: [],
  startTime: new Date(),
  endTime: null
};

export async function runPipeline() {
  try {
    console.log('🚀 Starting Bible Shorts Auto-Uploader Pipeline');
    console.log('⚙️  Configuration:', CONFIG);
    
    // Skip retry processing if we're already in a retry context
    if (!process.argv.includes('--skip-retry-check')) {
      // Check for missed uploads from previous sessions
      console.log('🔍 Checking for missed uploads...');
      await detectMissedUploads();
      
      // Process any pending retries first
      console.log('♻️ Processing retry queue...');
      await processRetryQueue();
      
      // Clean up old retry attempts
      await cleanupOldRetries();
    }

    await runPipelineCore();
  } catch (error) {
    console.error('💥 Pipeline Error:', error);
    pipelineStats.errors.push({
      error: error.message,
      timestamp: new Date()
    });
    
    if (!CONFIG.skipUpload && !CONFIG.dryRun) {
      await addToRetryQueue(error.message, 'Pipeline failed');
    }
    
    throw error;
  }
}

export async function runPipelineCore() {
  try {
    // Setup directories
    await setupDirectories();
    
    // Check script supply before starting
    console.log('📋 Checking script supply...');
    await checkAndRefreshScripts();
    
    // Determine how many videos to create
    const videoCount = CONFIG.singleVideo ? 1 : CONFIG.dailyVideoCount;
    
    console.log(`🎬 Creating ${videoCount} video(s)...`);
    
    for (let i = 0; i < videoCount; i++) {
      console.log(`\n📹 === VIDEO ${i + 1} OF ${videoCount} ===`);
      
      try {
        await createSingleVideo(i + 1);
        pipelineStats.successfulUploads++;
      } catch (error) {
        console.error(`❌ Video ${i + 1} failed:`, error.message);
        pipelineStats.errors.push({
          videoNumber: i + 1,
          error: error.message,
          timestamp: new Date()
        });
        
        // Continue with next video unless it's a critical error
        if (error.message.includes('CRITICAL')) {
          throw error;
        }
      }
      
      // Small delay between videos to respect API limits
      if (i < videoCount - 1) {
        console.log('⏳ Waiting 30 seconds before next video...');
        await sleep(30000);
      }
    }
    
    // Pipeline completed
    pipelineStats.endTime = new Date();
    await logPipelineResults();
    
  } catch (error) {
    console.error('💥 Pipeline failed:', error);
    pipelineStats.endTime = new Date();
    await logPipelineResults();
    process.exit(1);
  }
}

async function createSingleVideo(videoNumber) {
  const videoStartTime = new Date();
  console.log(`⏰ Video ${videoNumber} started at ${videoStartTime.toLocaleTimeString()}`);
  
  try {
    // Step 1: Generate script (using local database - no planning needed)
    console.log('✍️ Step 1: Generating script...');
    const scriptData = await generateScript(); // No contentIdea needed - using local scripts
    
    if (CONFIG.verbose) {
      console.log('📝 Script preview:', scriptData.script.substring(0, 100) + '...');
    }
    
    // Step 2: Generate voice narration
    console.log('🔊 Step 2: Generating voice narration...');
    const voiceData = await generateVoice(scriptData);
    
    if (CONFIG.verbose) {
      console.log('🎤 Voice file:', voiceData.audioPath);
    }
    
    // Step 3: Get stock footage
    console.log('🎬 Step 3: Downloading stock footage...');
    const assetData = await generateAssets(scriptData.verse, scriptData);
    
    if (CONFIG.verbose) {
      console.log('🎥 Video file:', assetData.videoPath);
    }
    
    // Step 4: Render final video
    console.log('🎥 Step 4: Rendering final video...');
    const videoResult = await renderVideo(scriptData, voiceData, assetData);
    
    console.log('✅ Video rendered:', videoResult.videoPath);
    console.log('📊 File size:', videoResult.fileSize);
    
    // Step 5: Upload to YouTube (unless skipped)
    if (!CONFIG.skipUpload && !CONFIG.dryRun) {
      console.log('📤 Step 5: Uploading to YouTube...');
      
      try {
        const uploadResult = await uploadToYouTube(videoResult, scriptData.verse, scriptData);
        
        console.log('🎉 Upload successful!');
        console.log('🔗 YouTube URL:', uploadResult.videoUrl);
        
        // Save upload results
        await saveUploadRecord(videoNumber, {
          scriptData,
          voiceData,
          assetData,
          videoResult,
          uploadResult,
          processingTime: new Date() - videoStartTime
        });
        
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError.message);
        
        // Add to retry queue for later processing
        await addToRetryQueue({
          videoNumber,
          scriptData,
          voiceData,
          assetData,
          videoResult,
          error: uploadError.message,
          processingTime: new Date() - videoStartTime
        });
        
        console.log('📋 Video added to retry queue for later upload');
        
        // Don't throw - this allows the pipeline to continue with other videos
        pipelineStats.errors.push({
          videoNumber,
          error: `Upload failed: ${uploadError.message}`,
          timestamp: new Date(),
          addedToRetryQueue: true
        });
      }
      
    } else {
      console.log('⏭️  Step 5: Upload skipped (dry run or skip-upload flag)');
      
      // Save local results
      await saveLocalRecord(videoNumber, {
        scriptData,
        voiceData,
        assetData,
        videoResult,
        processingTime: new Date() - videoStartTime
      });
    }
    
    const videoEndTime = new Date();
    const processingTime = Math.round((videoEndTime - videoStartTime) / 1000);
    console.log(`⏱️  Video ${videoNumber} completed in ${processingTime} seconds`);
    
    pipelineStats.totalVideos++;
    
  } catch (error) {
    console.error(`❌ Video ${videoNumber} creation failed:`, error);
    throw error;
  }
}

async function setupDirectories() {
  const dirs = [
    CONFIG.outputDir,
    CONFIG.tempDir,
    './auth',
    './logs'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
  
  console.log('📁 Directories setup complete');
}

async function saveUploadRecord(videoNumber, data) {
  const record = {
    videoNumber,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  const logPath = path.join('./logs', `upload_${Date.now()}.json`);
  await fs.writeJson(logPath, record, { spaces: 2 });
  
  // Also append to daily log
  const today = new Date().toISOString().split('T')[0];
  const dailyLogPath = path.join('./logs', `daily_${today}.json`);
  
  let dailyLog = [];
  if (await fs.pathExists(dailyLogPath)) {
    dailyLog = await fs.readJson(dailyLogPath);
  }
  
  dailyLog.push(record);
  await fs.writeJson(dailyLogPath, dailyLog, { spaces: 2 });
}

async function saveLocalRecord(videoNumber, data) {
  const record = {
    videoNumber,
    timestamp: new Date().toISOString(),
    status: 'local_only',
    ...data
  };
  
  const logPath = path.join('./logs', `local_${Date.now()}.json`);
  await fs.writeJson(logPath, record, { spaces: 2 });
}

async function logPipelineResults() {
  const duration = Math.round((pipelineStats.endTime - pipelineStats.startTime) / 1000);
  
  console.log('\n📊 === PIPELINE RESULTS ===');
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log(`📹 Videos created: ${pipelineStats.totalVideos}`);
  console.log(`✅ Successful uploads: ${pipelineStats.successfulUploads}`);
  console.log(`❌ Errors: ${pipelineStats.errors.length}`);
  
  if (pipelineStats.errors.length > 0) {
    console.log('\n🚨 Error details:');
    pipelineStats.errors.forEach(error => {
      console.log(`  - Video ${error.videoNumber}: ${error.error}`);
    });
  }
  
  // Save pipeline stats
  const statsPath = path.join('./logs', `pipeline_${Date.now()}.json`);
  await fs.writeJson(statsPath, pipelineStats, { spaces: 2 });
  
  console.log(`📄 Full results saved to: ${statsPath}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Pipeline interrupted by user');
  pipelineStats.endTime = new Date();
  await logPipelineResults();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Pipeline terminated');
  pipelineStats.endTime = new Date();
  await logPipelineResults();
  process.exit(0);
});

// CLI Commands
async function handleCLI() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupOAuth();
      break;
    case 'test':
      await testPipeline();
      break;
    case 'clean':
      await cleanupFiles();
      break;
    case 'stats':
      await showStats();
      break;
    default:
      await runPipeline();
  }
}

async function testPipeline() {
  console.log('🧪 Testing pipeline components...');
  
  // Test each component individually
  try {
    console.log('Testing script generation...');
    const script = await generateScript(); // No idea needed - using local scripts
    console.log('✅ Script generation works');
    
    console.log('🧪 Pipeline test completed');
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  }
}

async function cleanupFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  const cleanupDirs = [CONFIG.tempDir, CONFIG.outputDir];
  
  for (const dir of cleanupDirs) {
    if (await fs.pathExists(dir)) {
      await fs.emptyDir(dir);
      console.log(`✅ Cleaned ${dir}`);
    }
  }
  
  console.log('🧹 Cleanup complete');
}

async function showStats() {
  console.log('📊 Pipeline Statistics');
  
  const logsDir = './logs';
  if (!(await fs.pathExists(logsDir))) {
    console.log('No logs found');
    return;
  }
  
  const logFiles = await fs.readdir(logsDir);
  const dailyLogs = logFiles.filter(f => f.startsWith('daily_'));
  
  console.log(`📄 Found ${dailyLogs.length} daily log(s)`);
  
  for (const logFile of dailyLogs.slice(-7)) { // Last 7 days
    const logPath = path.join(logsDir, logFile);
    const logData = await fs.readJson(logPath);
    const date = logFile.replace('daily_', '').replace('.json', '');
    console.log(`📅 ${date}: ${logData.length} video(s) created`);
  }
}

// CRON schedule suggestion (add to your system crontab):
// 0 6,18 * * * cd /path/to/bible-shorts-autouploader && node index.mjs
// This runs at 6am & 6pm daily. Adjust times as needed.

// Run the application
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('index.mjs')) {
  handleCLI().catch(console.error);
}
