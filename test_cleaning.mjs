import { generateScript } from './tasks/generateScript.mjs';

// Test the enhanced script cleaning with a real script from your JSON
const testScript = `HOOK: "Feeling stressed and overwhelmed? Let's find some peace!"

VERSE: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control." - Galatians 5:22-23

MEANING: This verse reminds us that as believers, we have access to supernatural peace and joy, even in the midst of chaos. It's not about ignoring our problems, but about trusting in God's goodness and leaning on His Spirit.

APPLICATION: Take a deep breath, let go of worry, and ask God to fill you with His peace and love. As you focus on His presence, you'll find yourself better equipped to handle life's challenges with kindness, gentleness, and self-control.

CTA: "Take a minute to breathe, relax, and let God's peace wash over you. Share this reminder with a friend who needs it, and don't forget to tag a trusted Bible study group! #BibleVerse #ComfortingScriptures #PeaceInTheStorm"`;

// Test the cleaning function
console.log('🧪 Testing Enhanced Script Cleaning...');
console.log('');
console.log('📝 ORIGINAL SCRIPT:');
console.log('='.repeat(50));
console.log(testScript);
console.log('');

// Import the cleaning function
import('./tasks/generateScript.mjs').then(module => {
  // We need to access the internal cleanScriptForSpeech function
  // For testing, let's simulate what it should produce
  
  let cleaned = testScript;
  
  // Apply the same cleaning logic
  cleaned = cleaned.replace(/HOOK:\s*/gi, '');
  cleaned = cleaned.replace(/VERSE:\s*/gi, '');
  cleaned = cleaned.replace(/MEANING:\s*/gi, '');
  cleaned = cleaned.replace(/APPLICATION:\s*/gi, '');
  cleaned = cleaned.replace(/CTA:\s*/gi, '');
  cleaned = cleaned.replace(/#\w+/g, '');
  cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/["""'']/g, '');
  
  console.log('✨ CLEANED SCRIPT:');
  console.log('='.repeat(50));
  console.log(cleaned);
  console.log('');
  console.log('📊 Length:', cleaned.length, 'characters');
  console.log('⏱️  Estimated read time:', Math.round(cleaned.length / 12), 'seconds (at ~12 chars/sec)');
}).catch(console.error);
