#!/usr/bin/env node

// Test script to verify custom voice integration in the pipeline

import { generateVoice } from './tasks/generateVoice.mjs';

async function testCustomVoice() {
  console.log('🎯 Testing custom voice integration...');
  
  const testScript = {
    script: "And God said, Let there be light: and there was light. And God saw the light, that it was good.",
    scriptPath: './test_custom_voice_script.txt'
  };
  
  try {
    const result = await generateVoice(testScript);
    console.log('✅ Custom voice test successful!');
    console.log('📁 Audio saved to:', result.audioPath);
    console.log('⏱️  Duration:', result.duration, 'seconds');
    console.log('🔊 Method:', result.method);
    
    return result;
  } catch (error) {
    console.error('❌ Custom voice test failed:', error.message);
    return null;
  }
}

testCustomVoice();
