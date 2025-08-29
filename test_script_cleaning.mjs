import fs from 'fs';
import { cleanScriptForSpeech } from './tasks/generateScript.mjs';

const scriptsData = JSON.parse(fs.readFileSync('./data/bible_scripts.json', 'utf8'));
const scripts = Array.isArray(scriptsData) ? scriptsData : scriptsData.scripts || [];
const script = scripts.find(s => s.id === 'script_1753738347_14');

if (script) {
    console.log('=== RAW SCRIPT ===');
    console.log(script.script);
    console.log('\n=== CLEANED SCRIPT ===');
    const cleaned = cleanScriptForSpeech(script.script);
    console.log(cleaned);
    console.log('\n=== ANALYSIS ===');
    console.log(`Raw length: ${script.script.length} chars`);
    console.log(`Cleaned length: ${cleaned.length} chars`);
    console.log(`Reduction: ${script.script.length - cleaned.length} chars`);
} else {
    console.log('Script not found!');
}
