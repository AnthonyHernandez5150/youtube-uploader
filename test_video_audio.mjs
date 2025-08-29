// Test video rendering with existing audio
import { renderVideo } from './render/renderVideo.mjs';

const scriptData = {
  script: "Test script for audio rendering",
  verse: "1 Corinthians 13:4-5"
};

const voiceData = {
  audioPath: "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\narration_2025-07-22T17-28-46-422Z.wav",
  duration: 30,
  method: "chatterbox-python-chunked"
};

const assetData = {
  videoPath: "c:\\Users\\mrtig\\Desktop\\Bible Shorts AutoUploader\\output\\stock_2025-07-22T17-54-39-129Z.mp4"
};

console.log('🎥 Testing video rendering with working audio...');
console.log('🔊 Audio file:', voiceData.audioPath);
console.log('🎬 Video file:', assetData.videoPath);

try {
  const result = await renderVideo(scriptData, voiceData, assetData);
  console.log('✅ Test video created:', result.videoPath);
  console.log('📊 File size:', result.fileSize);
  console.log('🎉 Now check if this video has sound!');
} catch (error) {
  console.error('❌ Test failed:', error);
}
