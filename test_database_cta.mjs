import fs from 'fs';
import { cleanScriptForSpeech } from './tasks/generateScript.mjs';

const scriptsData = JSON.parse(fs.readFileSync('./data/bible_scripts.json', 'utf8'));
const scripts = Array.isArray(scriptsData) ? scriptsData : scriptsData.scripts || [];

if (scripts.length > 0) {
    const script = scripts[0];
    console.log('=== DATABASE SCRIPT TEST ===');
    console.log('VERSE:', script.verse);
    console.log('\nRAW SCRIPT (first 150 chars):');
    console.log(script.script.substring(0, 150) + '...');
    
    const cleaned = cleanScriptForSpeech(script.script);
    console.log('\nCLEANED SCRIPT WITH CTA (last 100 chars):');
    console.log('...' + cleaned.substring(cleaned.length - 100));
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Raw length: ${script.script.length} chars`);
    console.log(`Cleaned length: ${cleaned.length} chars`);
    console.log(`Has CTA: ${cleaned.toLowerCase().includes('like') && cleaned.toLowerCase().includes('subscribe') ? 'YES' : 'NO'}`);
} else {
    console.log('No scripts found in database');
}
