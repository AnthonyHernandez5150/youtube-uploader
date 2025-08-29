// Test the enhanced cleaning with the problematic intro text
const testScript = `Here is a compelling YouTube Shorts script for the Bible verse Romans 12:2:

HOOK: "Want to stand out from the crowd and unlock your true potential?"

VERSE: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind." - Romans 12:2

MEANING: This verse challenges us to resist societal pressures and embrace God's transformative power in our lives.

APPLICATION: Instead of following trends that don't align with your values, focus on what God wants for you. Let His truth reshape your thinking and actions.

CTA: "What's one way you can resist conforming today? Share in the comments below! #Faith #Transformation #Romans12"`;

// Apply cleaning manually to test
let cleaned = testScript;

// Remove meta-descriptions (NEW)
cleaned = cleaned.replace(/Here is a compelling YouTube Shorts script for the Bible verse?[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/Here's a compelling YouTube Shorts script for[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/Here is a YouTube Shorts script based on[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/Here's a YouTube Shorts script based on[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/This is a compelling script for[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/Here's a script for[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/Here is a script for[^.]*\.?\s*/gi, '');
cleaned = cleaned.replace(/^Here is[^:]*:\s*/gi, '');
cleaned = cleaned.replace(/^Here's[^:]*:\s*/gi, '');

// Remove formatting markers
cleaned = cleaned.replace(/HOOK:\s*/gi, '');
cleaned = cleaned.replace(/VERSE:\s*/gi, '');
cleaned = cleaned.replace(/MEANING:\s*/gi, '');
cleaned = cleaned.replace(/APPLICATION:\s*/gi, '');
cleaned = cleaned.replace(/CTA:\s*/gi, '');
cleaned = cleaned.replace(/#\w+/g, '');
cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
cleaned = cleaned.replace(/["""'']/g, '');

console.log('🧪 TESTING ENHANCED SCRIPT CLEANING...');
console.log('');
console.log('📝 ORIGINAL:');
console.log('='.repeat(60));
console.log(testScript);
console.log('');
console.log('✨ CLEANED:');
console.log('='.repeat(60));
console.log(cleaned);
console.log('');
console.log('📊 Length:', cleaned.length, 'characters');
console.log('⏱️  Estimated speech time:', Math.round(cleaned.length / 12), 'seconds');
