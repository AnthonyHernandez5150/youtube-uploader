import { cleanScriptForSpeech } from './tasks/generateScript.mjs';

// Test with the Romans 12:2 script you mentioned
const testScript = "CTA: Romans twelve two This verse reminds us that were not meant to fit into the worlds mold, but to be transformed by our thoughts and perspectives. Take a moment today to quiet your mind and reflect on your values. Whats truly important to you? Let go of the noise and be the best version of yourself. Take a deep breath, be still, and let your mind be renewed.";

console.log('=== ORIGINAL SCRIPT ===');
console.log(testScript);
console.log('\n=== CLEANED WITH CTA ===');
const cleaned = cleanScriptForSpeech(testScript);
console.log(cleaned);
console.log('\n=== ANALYSIS ===');
console.log(`Original length: ${testScript.length} chars`);
console.log(`Cleaned length: ${cleaned.length} chars`);
console.log(`Has CTA: ${cleaned.toLowerCase().includes('like') && cleaned.toLowerCase().includes('subscribe') ? 'YES' : 'NO'}`);
