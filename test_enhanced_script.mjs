import { generateScript } from './tasks/generateScript.mjs';

const testContent = 'VERSE: John 3:16\nANGLE: God\'s love\nKEYWORDS: love, salvation, eternal life';

try {
  console.log('🧪 Testing Enhanced Script Generator...');
  console.log('');
  
  const result = await generateScript(testContent);
  
  console.log('✅ Test successful!');
  console.log('📝 Script ID:', result.scriptId);
  console.log('📖 Verse:', result.verse.substring(0, 60) + '...');
  console.log('');
  console.log('🎤 CLEAN SCRIPT FOR VOICE:');
  console.log('='.repeat(50));
  console.log(result.script);
  console.log('');
  console.log('📊 Length:', result.script.length, 'characters');
  console.log('⏱️  Estimated speech time:', Math.round(result.script.length / 12), 'seconds');
  
  // Check if any formatting markers remain
  const hasFormatting = /HOOK:|VERSE:|MEANING:|APPLICATION:|CTA:|#\w+/i.test(result.script);
  if (hasFormatting) {
    console.log('⚠️  WARNING: Formatting markers still present!');
  } else {
    console.log('✅ Clean script - no formatting markers detected');
  }
  
} catch (err) {
  console.error('❌ Test failed:', err.message);
}
