// Test voice generation step
import dotenv from 'dotenv';
import { generateVoice } from './tasks/generateVoice.mjs';

dotenv.config();

const scriptData = {
  script: "Fear not, for I am with you always. In moments of doubt, remember that God's love surrounds you like the morning light.",
  scriptPath: "test_script.txt"
};

console.log('🔊 Testing voice generation...');
console.log('📄 Script:', scriptData.script);

try {
  const voiceResult = await generateVoice(scriptData);
  console.log('✅ Voice generation successful!');
  console.log('📁 Audio file:', voiceResult.audioPath);
  console.log('⏱️  Duration:', voiceResult.duration, 'seconds');
  console.log('🔊 Method:', voiceResult.method);
} catch (error) {
  console.error('❌ Voice generation failed:', error.message);
}
