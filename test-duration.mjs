import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test our ffprobe-based duration detection
async function getRealAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`);
    const duration = parseFloat(stdout.trim());
    
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid duration from ffprobe');
    }
    
    console.log(`✅ ffprobe detected: ${duration.toFixed(2)}s`);
    return duration;
  } catch (error) {
    console.log(`⚠️  ffprobe failed: ${error.message}`);
    
    // Fallback to file size estimation
    const fs = await import('fs');
    try {
      const stats = await fs.promises.stat(audioPath);
      const estimatedDuration = Math.max(10, Math.min(60, stats.size / 68000));
      console.log(`📏 File size fallback: ${estimatedDuration.toFixed(2)}s (${(stats.size/1024/1024).toFixed(1)}MB)`);
      return estimatedDuration;
    } catch (fsErr) {
      console.log('⚠️  File size fallback failed, using 30s default');
      return 30;
    }
  }
}

// Test with a sample audio file if it exists
const testFiles = [
  './temp/audio.wav',
  './output/audio.wav',
  './temp/voice_chunk_1.wav'
];

console.log('🧪 Testing Real Audio Duration Detection\n');

for (const file of testFiles) {
  try {
    const duration = await getRealAudioDuration(file);
    console.log(`📁 ${file}: ${duration.toFixed(2)}s\n`);
  } catch (error) {
    console.log(`❌ ${file}: Not found or error\n`);
  }
}

console.log('✅ Duration detection test complete!');
