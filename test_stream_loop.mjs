// Test stream-loop method for reliable video looping
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const videoPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-22T17-54-39-129Z.mp4";
const audioPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-22T17-28-46-422Z.wav";
const outputPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\test_stream_loop.mp4";

console.log('🎥 Testing stream-loop method...');
console.log('🔄 Using input-level looping instead of complex filter...');

// Estimate durations for loop calculation
const videoDuration = 5; // Estimate: most stock videos are 3-8 seconds
const audioDuration = 35; // Estimate: typical Bible short narration
const loopsNeeded = Math.ceil(audioDuration / videoDuration) - 1; // -1 because original + loops

console.log(`📹 Video duration (estimated): ${videoDuration} seconds`);
console.log(`🔊 Audio duration (estimated): ${audioDuration} seconds`);
console.log(`🔄 Stream loops needed: ${loopsNeeded} (total: ${loopsNeeded + 1} plays)`);

ffmpeg()
  .addInput(videoPath)
  .addInputOptions(['-stream_loop', `${loopsNeeded}`]) // Add stream loop option
  .addInput(audioPath)
  .complexFilter([
    // Just scale to 9:16 format, no loop filter needed
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[final]'
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
    console.log('✅ Stream loop test complete!');
    console.log('📁 Test file:', outputPath);
    console.log('🎯 Video should now loop reliably without freezing!');
  })
  .on('error', (err) => {
    console.error('❌ Test failed:', err);
  })
  .run();
