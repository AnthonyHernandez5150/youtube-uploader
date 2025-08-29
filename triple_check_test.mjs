// 🧪 COMPREHENSIVE TEST - Triple check everything works perfectly
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs-extra';
import path from 'path';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

console.log('🧪 TRIPLE CHECK TEST - Verifying complete Bible Shorts pipeline');
console.log('=' .repeat(60));

async function tripleCheckTest() {
  try {
    // Use existing files
    const videoPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-24T17-26-19-827Z.mp4";
    const audioPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-24T17-09-10-371Z.wav"; // 2MB file - longer
    const outputPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\TRIPLE_CHECK_TEST.mp4";
    
    console.log('📁 Input files:');
    console.log(`   Video: ${path.basename(videoPath)}`);
    console.log(`   Audio: ${path.basename(audioPath)}`);
    
    // Check file sizes
    const videoStats = await fs.stat(videoPath);
    const audioStats = await fs.stat(audioPath);
    
    console.log(`📊 File sizes:`);
    console.log(`   Video: ${(videoStats.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Audio: ${(audioStats.size / 1024 / 1024).toFixed(1)}MB`);
    
    // Get REAL audio duration using ffprobe
    console.log('⏱️  Getting actual audio duration...');
    const audioInfo = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          console.log('⚠️  FFprobe failed, using file size estimation');
          const estimatedDuration = Math.max(10, Math.min(60, audioStats.size / 68000));
          console.log(`📐 Estimated duration: ${estimatedDuration.toFixed(1)}s`);
          resolve({ duration: estimatedDuration, method: 'estimated' });
        } else {
          console.log(`✅ Real audio duration: ${metadata.format.duration.toFixed(1)}s`);
          resolve({ duration: metadata.format.duration, method: 'actual' });
        }
      });
    });
    
    const realAudioDuration = audioInfo.duration;
    console.log(`🎵 Audio duration (${audioInfo.method}): ${realAudioDuration.toFixed(1)}s`);
    
    // Apply our fix logic
    const cappedDuration = Math.min(realAudioDuration, 59.9);
    const safeDuration = Math.min(cappedDuration + 1.0, 59.9); // 1-second buffer
    const estimatedVideoDuration = 5;
    const loopsNeeded = Math.ceil(safeDuration / estimatedVideoDuration) - 1;
    
    console.log('🔧 Duration calculations:');
    console.log(`   Real audio: ${realAudioDuration.toFixed(1)}s`);
    console.log(`   Capped (≤59.9s): ${cappedDuration.toFixed(1)}s`);
    console.log(`   Safe (with buffer): ${safeDuration.toFixed(1)}s`);
    console.log(`   Video loops needed: ${loopsNeeded} (${loopsNeeded + 1} total plays)`);
    console.log(`   Expected video length: ~${((loopsNeeded + 1) * estimatedVideoDuration).toFixed(1)}s`);
    
    console.log('🎬 Starting video rendering with EXACT pipeline logic...');
    
    // Use EXACT same logic as main pipeline
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .addInput(videoPath)
        .addInputOptions(['-stream_loop', `${loopsNeeded}`]) // Stream-level looping
        .addInput(audioPath)
        .complexFilter([
          // Exact same filter chain as main pipeline
          '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[scaled]',
          '[scaled]drawtext=text=\'TRIPLE CHECK - COMPLETE AUDIO TEST\':fontfile=arial.ttf:fontsize=32:fontcolor=yellow:x=(w-text_w)/2:y=50:shadowcolor=black:shadowx=2:shadowy=2[video_with_text]'
        ])
        .videoCodec('libx264')
        .videoBitrate('5000k')
        .fps(30)
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2)
        .duration(safeDuration)      // Use safe duration with buffer
        .outputOptions([
          '-map', '[video_with_text]',
          '-map', '1:a',
          '-movflags', '+faststart',
          '-avoid_negative_ts', 'make_zero'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎬 FFmpeg command:');
          console.log(commandLine);
          console.log('');
        })
        .on('progress', (progress) => {
          if (progress.percent && progress.percent % 10 === 0) {
            console.log(`📈 Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log('✅ Rendering complete!');
          console.log(`⏱️  Render time: ${renderTime}s`);
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Rendering failed:', err);
          reject(err);
        })
        .run();
    });
    
    // Check output file
    const outputStats = await fs.stat(outputPath);
    console.log('');
    console.log('📊 FINAL RESULTS:');
    console.log(`📁 Output file: ${path.basename(outputPath)}`);
    console.log(`📦 File size: ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Get actual output duration
    const outputInfo = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(outputPath, (err, metadata) => {
        if (err) {
          console.log('⚠️  Could not probe output duration');
          resolve({ duration: 'unknown' });
        } else {
          resolve({ duration: metadata.format.duration });
        }
      });
    });
    
    if (outputInfo.duration !== 'unknown') {
      console.log(`⏱️  Actual output duration: ${outputInfo.duration.toFixed(1)}s`);
      console.log(`🎯 Target was: ${safeDuration.toFixed(1)}s`);
      
      const difference = Math.abs(outputInfo.duration - safeDuration);
      if (difference < 0.5) {
        console.log('✅ Duration is PERFECT!');
      } else {
        console.log(`⚠️  Duration difference: ${difference.toFixed(1)}s`);
      }
    }
    
    console.log('');
    console.log('🔍 WHAT TO CHECK:');
    console.log('1. Play the video and verify audio plays from start to finish');
    console.log('2. Check that video loops smoothly without freezing');
    console.log('3. Confirm call-to-action is not cut off');
    console.log('4. Verify duration is reasonable for YouTube Shorts');
    console.log('');
    console.log('📁 Test file ready for review:');
    console.log(`   ${outputPath}`);
    console.log('');
    console.log('🎉 TRIPLE CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Triple check test failed:', error);
  }
}

tripleCheckTest();
