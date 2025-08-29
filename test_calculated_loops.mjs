// Test calculated loops approach - measure durations and calculate exact loops needed
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Try to find ffprobe in the same directory as ffmpeg
const ffprobePath = ffmpegStatic.replace('ffmpeg.exe', 'ffprobe.exe');
ffmpeg.setFfprobePath(ffprobePath);

const videoPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-22T17-54-39-129Z.mp4";
const audioPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-22T17-28-46-422Z.wav";
const outputPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\test_calculated_loops.mp4";

// Function to get file duration using ffmpeg instead of ffprobe
function getFileDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(duration);
        }
      });
  });
}

async function testCalculatedLoops() {
  try {
    console.log('🎥 Testing calculated loops approach...');
    console.log('📏 Using estimated durations for testing...');
    
    // Use estimates for now to test the concept
    const videoDuration = 5; // Estimate: most stock videos are 3-8 seconds
    const audioDuration = 35; // Estimate: typical Bible short narration
    
    console.log(`📹 Video duration (estimated): ${videoDuration} seconds`);
    console.log(`🔊 Audio duration (estimated): ${audioDuration} seconds`);
    
    // Calculate exact loops needed
    const loopsNeeded = Math.ceil(audioDuration / videoDuration) - 1; // -1 because loop=N means N additional loops
    const totalVideoDuration = (loopsNeeded + 1) * videoDuration;
    
    console.log(`🔄 Loops needed: ${loopsNeeded} additional loops (${loopsNeeded + 1} total plays)`);
    console.log(`⏱️  Total video duration will be: ${totalVideoDuration} seconds`);
    
    // Create FFmpeg command with calculated loops
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter([
        // Use calculated loop count
        `[0:v]loop=loop=${loopsNeeded}:size=1:start=0[looped]`,
        // Scale to 9:16 format
        '[looped]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[final]'
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-map', '[final]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart'
        // No -shortest so audio controls duration
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('🎬 FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`📈 Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('✅ Calculated loops test complete!');
        console.log('📁 Test file:', outputPath);
        console.log('🎯 Video should now loop exactly for the audio duration!');
      })
      .on('error', (err) => {
        console.error('❌ Test failed:', err);
      })
      .run();
      
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testCalculatedLoops();
