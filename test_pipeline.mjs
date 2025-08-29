// Test complete pipeline step by step
import dotenv from 'dotenv';
import { planContent } from './agents/babyagi.mjs';
import { generateScript } from './tasks/generateScript.mjs';
import { generateVoice } from './tasks/generateVoice.mjs';
import { generateAssets } from './tasks/generateAssets.mjs';

dotenv.config();

async function testPipeline() {
  try {
    console.log('🚀 Testing complete pipeline...\n');
    
    // Step 1: Plan content
    console.log('📋 Step 1: Planning content...');
    const contentPlan = await planContent();
    console.log('✅ Content planned:', contentPlan.theme);
    
    // Step 2: Generate script
    console.log('\n📝 Step 2: Generating script...');
    const scriptData = await generateScript(contentPlan);
    console.log('✅ Script generated');
    console.log('📄 Script preview:', scriptData.script.substring(0, 100) + '...');
    
    // Step 3: Generate voice
    console.log('\n🔊 Step 3: Generating voice...');
    const voiceData = await generateVoice(scriptData);
    console.log('✅ Voice generated');
    console.log('🎵 Audio file:', voiceData.audioPath);
    console.log('⏱️  Duration:', voiceData.duration, 'seconds');
    
    // Step 4: Generate assets (this might fail without Pixabay API key)
    console.log('\n🎨 Step 4: Generating assets...');
    try {
      const assetData = await generateAssets(contentPlan);
      console.log('✅ Assets generated');
      console.log('🖼️  Video files:', assetData.videoPath ? 'Found' : 'None');
    } catch (error) {
      console.log('⚠️  Assets step failed (likely missing Pixabay API):', error.message);
    }
    
    console.log('\n🎉 Pipeline test completed successfully!');
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error.message);
    console.error(error.stack);
  }
}

testPipeline();
