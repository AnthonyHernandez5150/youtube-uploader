import { generateScript } from './tasks/generateScript.mjs';

const testContent = 'VERSE: John 3:16\nANGLE: God\'s love\nKEYWORDS: love, salvation, eternal life';

try {
  console.log('🧪 Testing script generator...');
  const result = await generateScript(testContent);
  
  console.log('✅ Test successful!');
  console.log('Script length:', result.script.length);
  console.log('Verse:', result.verse);
  console.log('First 150 chars:', result.script.substring(0, 150));
  console.log('Keywords:', result.keywords);
  
} catch (err) {
  console.error('❌ Test failed:', err.message);
  console.error('Stack:', err.stack);
}
