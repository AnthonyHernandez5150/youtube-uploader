// 🎬 Video Rendering Engine with Dynamic Visual Effects
// Renders final Bible verse videos with audio-driven duration and dynamic styling

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { getAudioDuration } from '../utils/audioUtils.mjs';
import { generateRandomStyle, logStyleUsage } from './visualEffects.mjs';

const execAsync = promisify(exec);

// FFmpeg path - try multiple locations
const FFMPEG_PATHS = [
  'ffmpeg', // If in PATH
  'C:\\ffmpeg\\bin\\ffmpeg.exe',
  `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe`
];

async function getFFmpegPath() {
  for (const ffmpegPath of FFMPEG_PATHS) {
    try {
      await execAsync(`"${ffmpegPath}" -version`);
      console.log(`🔧 Using FFmpeg at: ${ffmpegPath}`);
      return ffmpegPath;
    } catch (error) {
      // Try next path
    }
  }
  throw new Error('FFmpeg not found. Please install FFmpeg and add it to your PATH.');
}

/**
 * Main video rendering function with dynamic styling
 */
export async function renderVideo(scriptData, voiceData, assetData) {
  try {
    console.log('🎬 Starting video rendering with dynamic styling...');
    
    // Find FFmpeg executable
    const ffmpegPath = await getFFmpegPath();
    
    // Generate unique style for this video
    const style = await generateRandomStyle();
    console.log(`🎨 Generated style: ${style.fontFamily} font, ${style.textColor} text, ${style.position} position`);
    
    // Get audio duration to set video length
    const audioDuration = await getAudioDuration(voiceData.audioPath);
    // Extend video duration more to allow audio to fade out gracefully without cutting content
    const videoDuration = audioDuration + 1.5; // Add 1.5 second buffer for graceful fade-out
    
    console.log(`⏱️ Video duration: ${videoDuration.toFixed(1)}s (audio: ${audioDuration.toFixed(1)}s + 1.5s buffer)`);
    
    // Setup paths
    const timestamp = Date.now();
    const outputPath = path.join('./output', `bible_short_${timestamp}.mp4`);
    
    await fs.ensureDir('./output');
    
    // Create fade effects - start fade-out earlier to give room for graceful fade
    const fadeInEnd = 0.5;
    const fadeOutStart = Math.max(0, audioDuration - 0.5); // Start fade 0.5s before audio ends
    
    // Build FFmpeg command with dynamic styling
    const { command: ffmpegCommand, textFilePath } = buildFFmpegCommand({
      ffmpegPath: ffmpegPath,
      videoPath: assetData.videoPath,
      audioPath: voiceData.audioPath,
      outputPath: outputPath,
      duration: videoDuration,
      text: scriptData.verse,
      style: style,
      fadeInEnd: fadeInEnd,
      fadeOutStart: fadeOutStart
    });
    
    console.log('🔧 Rendering video with FFmpeg...');
    if (process.env.VERBOSE) {
      console.log('FFmpeg command:', ffmpegCommand);
    }
    
    const startTime = Date.now();
    
    try {
      await execAsync(ffmpegCommand);
    } finally {
      // Cleanup temporary text file
      if (textFilePath && fs.existsSync(textFilePath)) {
        fs.unlinkSync(textFilePath);
        console.log(`🧹 Cleaned up text file: ${textFilePath}`);
      }
    }
    
    const renderTime = Math.round((Date.now() - startTime) / 1000);
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    
    console.log(`✅ Video rendered successfully in ${renderTime}s`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    
    // Log style usage for analytics
    await logStyleUsage(style, {
      verse: scriptData.verse,
      duration: videoDuration,
      fileSize: fileSizeMB,
      renderTime: renderTime
    });
    
    return {
      videoPath: outputPath,
      duration: videoDuration,
      fileSize: `${fileSizeMB} MB`,
      renderTime: `${renderTime}s`,
      style: style
    };
    
  } catch (error) {
    console.error('❌ Video rendering failed:', error);
    throw new Error(`Video rendering failed: ${error.message}`);
  }
}

/**
 * Build FFmpeg command with dynamic styling
 */
function buildFFmpegCommand({ ffmpegPath, videoPath, audioPath, outputPath, duration, text, style, fadeInEnd, fadeOutStart }) {
  // Fallback: Use simple text overlay without textfile to avoid escaping issues
  // Clean and shorten text for inline use
  const cleanText = text
    .replace(/['"]/g, '')           // Remove quotes
    .replace(/[:;,]/g, ' ')         // Replace problematic chars with spaces
    .replace(/\s+/g, ' ')           // Normalize spaces
    .trim()
    .substring(0, 100);             // Limit length to avoid command line issues
  
  console.log(`📝 Using inline text: ${cleanText}`);
  
  // Calculate dynamic font size based on text length
  const baseFontSize = 48;
  const textLength = text.length;
  let fontSize = baseFontSize;
  
  if (textLength > 100) fontSize = 36;
  else if (textLength > 80) fontSize = 40;
  else if (textLength > 60) fontSize = 44;
  
  // Position calculations for 9:16 aspect ratio (1080x1920)
  const positions = {
    'center': 'x=(w-text_w)/2:y=(h-text_h)/2',
    'upper-center': 'x=(w-text_w)/2:y=h*0.25',
    'lower-center': 'x=(w-text_w)/2:y=h*0.75',
    'upper-left': 'x=w*0.1:y=h*0.25',
    'lower-right': 'x=w*0.6:y=h*0.75'
  };
  
  const textPosition = positions[style.position] || positions['center'];
  
  // TEMPORARY: Remove text overlay entirely to test basic video rendering
  // This will help us isolate whether the issue is with text rendering or FFmpeg command structure
  console.log('🚧 TESTING: Rendering video WITHOUT text overlay');
  
  // Video fade effects - use audio duration for fade timing to ensure full audio is captured
  const videoFade = `fade=t=in:st=0:d=${fadeInEnd},fade=t=out:st=${fadeOutStart}:d=0.5`;
  
  // Audio fade effects - match the video fade timing
  const audioFade = `afade=t=in:st=0:d=${fadeInEnd},afade=t=out:st=${fadeOutStart}:d=0.5`;
  
  // Enhanced filter complex WITH video looping to match audio duration
  // Loop the video, then apply scaling, cropping, and fades
  const filterComplex = `[0:v]loop=loop=-1:size=32767:start=0[looped];[looped]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${videoFade}[v];[1:a]${audioFade}[a]`;
  
  // Use exact duration to ensure we capture full audio
  const command = `"${ffmpegPath}" -y -i "${videoPath}" -i "${audioPath}" -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -t ${duration} -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
  
  return { command, textFilePath: null };
}

/**
 * Helper function to validate video output
 */
export async function validateVideoOutput(videoPath) {
  try {
    const stats = await fs.stat(videoPath);
    if (stats.size === 0) {
      throw new Error('Generated video file is empty');
    }
    
    // Quick FFprobe check with dynamic path
    const ffmpegPath = await getFFmpegPath();
    const ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
    
    const probeCommand = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(probeCommand);
    const info = JSON.parse(stdout);
    
    if (!info.streams || info.streams.length === 0) {
      throw new Error('Generated video has no streams');
    }
    
    console.log('✅ Video validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Video validation failed:', error);
    return false;
  }
}
