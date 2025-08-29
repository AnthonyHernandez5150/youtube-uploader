// Test the duration fix with a longer audio file
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs-extra';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const videoPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-24T17-26-19-827Z.mp4";
const audioPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-24T17-09-10-371Z.wav"; // The 2MB file
const outputPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\test_duration_fix.mp4";

console.log('🧪 Testing duration fix with longer audio...');

async function testDurationFix() {
  try {
    // Get actual audio duration
    const audioInfo = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          // Estimate duration based on file size
          fs.stat(audioPath)
            .then(stats => {
              const estimatedDuration = Math.max(10, Math.min(60, stats.size / 68000));
              console.log(`⚠️  Using file size estimation: ${estimatedDuration.toFixed(1)}s (${(stats.size/1024/1024).toFixed(1)}MB)`);
              resolve({ duration: estimatedDuration });
            })
            .catch(() => {
              console.log('⚠️  Could not get audio duration, using estimated 30 seconds');
              resolve({ duration: 30 });
            });
        } else {
          console.log(`✅ Actual audio duration: ${metadata.format.duration.toFixed(1)}s`);
          resolve(metadata.format);
        }
      });
    });
    
    let actualAudioDuration = audioInfo.duration || 30;
    
    // Cap at 59.9 seconds for YouTube Shorts compliance
    const cappedDuration = Math.min(actualAudioDuration, 59.9);
    
    // Add small buffer to prevent cutting off end of speech
    const safeDuration = Math.min(cappedDuration + 1.0, 59.9);
    
    const estimatedVideoDuration = 5;
    const loopsNeeded = Math.ceil(safeDuration / estimatedVideoDuration) - 1;
    
    console.log(`🎵 Audio duration: ${cappedDuration.toFixed(1)}s (safe: ${safeDuration.toFixed(1)}s)`);
    console.log(`🔄 Calculated ${loopsNeeded} loops needed for ${safeDuration.toFixed(1)}s video`);
    
    // Create video with exact same logic as main pipeline
    ffmpeg()
      .addInput(videoPath)
      .addInputOptions(['-stream_loop', `${loopsNeeded}`])
      .addInput(audioPath)
      .complexFilter([
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[scaled]',
        '[scaled]drawtext=text=\'DURATION TEST\':fontfile=arial.ttf:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-150:shadowcolor=black:shadowx=2:shadowy=2[video_with_text]'
      ])
      .videoCodec('libx264')
      .videoBitrate('5000k')
      .fps(30)
      .audioCodec('aac')
      .audioBitrate('128k')
      .audioChannels(2)
      .duration(safeDuration)
      .outputOptions([
        '-map', '[video_with_text]',
        '-map', '1:a',
        '-movflags', '+faststart',
        '-avoid_negative_ts', 'make_zero'
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
        console.log('✅ Duration test complete!');
        console.log('📁 Test file:', outputPath);
        console.log(`🎯 Video should be ${safeDuration.toFixed(1)}s and include complete audio!`);
      })
      .on('error', (err) => {
        console.error('❌ Test failed:', err);
      })
      .run();
      
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

testDurationFix();
