// 🔊 Audio Utilities
// Helper functions for audio processing and duration detection

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';

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
      return ffmpegPath;
    } catch (error) {
      // Try next path
    }
  }
  throw new Error('FFmpeg not found. Please install FFmpeg and add it to your PATH.');
}

/**
 * Get audio duration using multiple methods for reliability
 */
export async function getAudioDuration(audioPath) {
  try {
    // Verify file exists
    if (!await fs.pathExists(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    
    // Method 1: FFprobe (most reliable)
    try {
      const duration = await getAudioDurationFFprobe(audioPath);
      if (duration > 0) {
        console.log(`🔊 Audio duration (FFprobe): ${duration.toFixed(2)}s`);
        return duration;
      }
    } catch (error) {
      console.warn('⚠️ FFprobe failed, trying alternative method');
    }
    
    // Method 2: FFmpeg info
    try {
      const duration = await getAudioDurationFFmpeg(audioPath);
      if (duration > 0) {
        console.log(`🔊 Audio duration (FFmpeg): ${duration.toFixed(2)}s`);
        return duration;
      }
    } catch (error) {
      console.warn('⚠️ FFmpeg info failed, using fallback');
    }
    
    // Fallback: Default duration
    console.warn('⚠️ Could not detect audio duration, using default 25s');
    return 25.0;
    
  } catch (error) {
    console.error('❌ Audio duration detection failed:', error);
    return 25.0; // Safe fallback
  }
}

/**
 * Get audio duration using FFprobe
 */
async function getAudioDurationFFprobe(audioPath) {
  const ffmpegPath = await getFFmpegPath();
  const ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
  
  const command = `"${ffprobePath}" -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
  const { stdout } = await execAsync(command);
  const duration = parseFloat(stdout.trim());
  
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Invalid duration from FFprobe');
  }
  
  return duration;
}

/**
 * Get audio duration using FFmpeg
 */
async function getAudioDurationFFmpeg(audioPath) {
  const ffmpegPath = await getFFmpegPath();
  const command = `"${ffmpegPath}" -i "${audioPath}" -f null - 2>&1`;
  const { stderr } = await execAsync(command);
  
  // Parse duration from FFmpeg output
  const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.?\d*)/);
  if (!durationMatch) {
    throw new Error('Could not parse duration from FFmpeg output');
  }
  
  const hours = parseInt(durationMatch[1]);
  const minutes = parseInt(durationMatch[2]);
  const seconds = parseFloat(durationMatch[3]);
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  if (totalSeconds <= 0) {
    throw new Error('Invalid duration calculated');
  }
  
  return totalSeconds;
}

/**
 * Validate audio file format and quality
 */
export async function validateAudioFile(audioPath) {
  try {
    if (!await fs.pathExists(audioPath)) {
      return { valid: false, error: 'File does not exist' };
    }
    
    const stats = await fs.stat(audioPath);
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    // Check if file is readable as audio
    const ffmpegPath = await getFFmpegPath();
    const ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
    
    const command = `"${ffprobePath}" -v quiet -print_format json -show_streams "${audioPath}"`;
    const { stdout } = await execAsync(command);
    const info = JSON.parse(stdout);
    
    const audioStream = info.streams?.find(stream => stream.codec_type === 'audio');
    if (!audioStream) {
      return { valid: false, error: 'No audio stream found' };
    }
    
    return {
      valid: true,
      duration: parseFloat(audioStream.duration) || 0,
      codec: audioStream.codec_name,
      bitrate: audioStream.bit_rate,
      sampleRate: audioStream.sample_rate,
      fileSize: stats.size
    };
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Convert audio to optimal format for video rendering
 */
export async function normalizeAudio(inputPath, outputPath) {
  try {
    const ffmpegPath = await getFFmpegPath();
    const command = `"${ffmpegPath}" -y -i "${inputPath}" -ar 44100 -ac 2 -c:a aac -b:a 128k "${outputPath}"`;
    await execAsync(command);
    
    console.log(`🔧 Audio normalized: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('❌ Audio normalization failed:', error);
    throw error;
  }
}
