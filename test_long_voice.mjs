// Test voice generation with actual pipeline script
import dotenv from 'dotenv';
import { generateVoice } from './tasks/generateVoice.mjs';

dotenv.config();

const scriptData = {
  script: `Ever notice how the moment you get your paycheck, it feels like everyone's got their hand out? Rent's due, your car needs repairs, and now your parents need help with their bills too. That pit in your stomach? I've been there.

But check this out - Philippians 4:19 says "My God will supply all your needs according to His riches in glory in Christ Jesus." Not some of your needs. ALL of them.

Here's the truth: God didn't promise we'd be rich, but He promised we'd be provided for. So when those money fears creep in, remember - you serve a God who owns everything and He's got your back. Every. Single. Time.`,
  scriptPath: "test_script.txt"
};

console.log('🔊 Testing voice generation with longer script...');
console.log('📄 Script length:', scriptData.script.length, 'characters');
console.log('📄 Script preview:', scriptData.script.substring(0, 100) + '...');

try {
  const voiceResult = await generateVoice(scriptData);
  console.log('✅ Voice generation successful!');
  console.log('📁 Audio file:', voiceResult.audioPath);
  console.log('⏱️  Duration:', voiceResult.duration, 'seconds');
  console.log('🔊 Method:', voiceResult.method);
} catch (error) {
  console.error('❌ Voice generation failed:', error.message);
}
