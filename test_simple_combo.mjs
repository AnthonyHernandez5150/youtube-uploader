// Test stream_loop method for proper video looping
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const videoPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-22T17-54-39-129Z.mp4";
const audioPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-22T17-28-46-422Z.wav";
const outputPath = "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\test_no_shortest.mp4";

console.log('🎥 Testing aggressive video looping - manual approach...');
console.log('🔄 Using high loop count to ensure video coverage...');

ffmpeg()
  .input(videoPath)
  .input(audioPath)
  .complexFilter([
    // Use a very high loop count (20 loops = 21 total plays)
    '[0:v]loop=loop=20:size=1:start=0[looped]',
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
    // Removed -shortest to let audio control duration
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
    console.log('� Video should now loop properly without freezing!');
  })
  .on('error', (err) => {
    console.error('❌ Test failed:', err);
  })
  .run();
