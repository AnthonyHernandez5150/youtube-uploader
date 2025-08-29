// ✍️ Script Generator - Uses pre-generated Bible scripts for YouTube Shorts
// Replaced HuggingFace Space with local batch script database

import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { ScriptManager } from '../pipeline_integration.mjs';

dotenv.config();

// AI client function using your HuggingFace Space (DEPRECATED - now using local batch system)
/*
async function generateWithHuggingFace(book, chapter, verse, question) {
  try {
    // Step 1: Start the prediction
    const startResponse = await fetch('https://dim-lizard-dim-gpt.hf.space/gradio_api/call/analyze_verse_for_script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [book, chapter, verse, question]
      })
    });
    
    if (!startResponse.ok) {
      throw new Error(`HuggingFace Space start error: ${startResponse.status}`);
    }
    
    const startResult = await startResponse.json();
    const eventId = startResult.event_id;
    
    if (!eventId) {
      throw new Error('No event_id received from HuggingFace Space');
    }
    
    console.log('🎭 HuggingFace Space event started:', eventId);
    
    // Step 2: Poll for the result (with reduced timeout for faster fallback)
    for (let i = 0; i < 10; i++) { // Try for 20 seconds total (reduced from 30)
      console.log(`🔄 Polling attempt ${i + 1}/10 for HuggingFace Space...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const resultResponse = await fetch(`https://dim-lizard-dim-gpt.hf.space/gradio_api/call/analyze_verse_for_script/${eventId}`);
        
        if (resultResponse.ok) {
          const text = await resultResponse.text();
          console.log(`📄 Response length: ${text.length} chars`);
          
          // Look for complete data in the response
          if (text.includes('"output"') && text.includes('"data"')) {
            console.log('🎯 Found output data in response');
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.output && data.output.data && data.output.data[0]) {
                    console.log('✅ HuggingFace Space response received');
                    return data.output.data[0]; // Return the generated text
                  }
                } catch (e) {
                  // Continue looking
                }
              }
            }
          } else {
            console.log('⏳ Response not ready yet...');
          }
        } else {
          console.log(`❌ HTTP ${resultResponse.status}: ${resultResponse.statusText}`);
        }
      } catch (pollError) {
        console.log(`⚠️  Poll attempt ${i + 1} failed: ${pollError.message}`);
      }
    }
    
    throw new Error('Timeout: No result received from HuggingFace Space after 20 seconds');
    
  } catch (error) {
    console.error('❌ HuggingFace Space error:', error.message);
    throw error;
  }
}
*/

// New local script generator using batch system
function generateLocalScript(verse) {
  return analyze_verse_for_script(verse);
}

export function cleanScriptForSpeech(script) {
  let cleaned = script;
  
  // Remove meta-descriptions about the script itself (the new issue!)
  cleaned = cleaned.replace(/Here is a compelling YouTube Shorts script for the Bible verse?[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/Here's a compelling YouTube Shorts script for[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/Here is a YouTube Shorts script based on[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/Here's a YouTube Shorts script based on[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/This is a compelling script for[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/Here's a script for[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/Here is a script for[^.]*\.?\s*/gi, '');
  cleaned = cleaned.replace(/^Here is[^:]*:\s*/gi, ''); // Remove any "Here is..." intro
  cleaned = cleaned.replace(/^Here's[^:]*:\s*/gi, ''); // Remove any "Here's..." intro
  
  // Remove structured formatting markers from JSON scripts
  cleaned = cleaned.replace(/HOOK:\s*/gi, ''); // Remove "HOOK: "
  cleaned = cleaned.replace(/VERSE:\s*/gi, ''); // Remove "VERSE: "
  cleaned = cleaned.replace(/MEANING:\s*/gi, ''); // Remove "MEANING: "
  cleaned = cleaned.replace(/APPLICATION:\s*/gi, ''); // Remove "APPLICATION: "
  cleaned = cleaned.replace(/CTA:\s*/gi, ''); // Remove "CTA: "
  
  // Remove other formatting markers that might exist
  cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove [HOOK], [APPLICATION], etc.
  cleaned = cleaned.replace(/\(.*?\)/g, ''); // Remove parenthetical notes
  cleaned = cleaned.replace(/\{.*?\}/g, ''); // Remove curly brace notes
  
  // Remove hashtags and social media elements for cleaner speech
  cleaned = cleaned.replace(/#\w+/g, ''); // Remove hashtags like #Bible #Faith
  
  // Fix Bible verse pronunciation
  cleaned = cleaned.replace(/(\w+)\s+(\d+):(\d+)(-\d+)?/g, (match, book, chapter, verse, range) => {
    const chapterNum = convertNumberToWords(parseInt(chapter));
    const verseNum = convertNumberToWords(parseInt(verse));
    let result = `${book} ${chapterNum} ${verseNum}`;
    
    if (range) {
      const endVerse = convertNumberToWords(parseInt(range.substring(1)));
      result += ` to ${endVerse}`;
    }
    
    return result;
  });
  
  // Clean up multiple spaces, line breaks, and trim
  cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Remove quotes that might make speech sound odd
  cleaned = cleaned.replace(/["""'']/g, '');
  
  // Ensure proper sentence flow by adding periods where needed
  cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
  
  // Add call-to-action for likes and subscribes
  if (!cleaned.toLowerCase().includes('like') && !cleaned.toLowerCase().includes('subscribe')) {
    // Ensure the script ends with proper punctuation
    if (!cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    cleaned += ' If this encouraged you, hit that like button and subscribe for daily Bible wisdom!';
  }
  
  return cleaned;
}

function convertNumberToWords(num) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
                'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num < 20) return ones[num];
  if (num < 100) {
    const tenDigit = Math.floor(num / 10);
    const oneDigit = num % 10;
    return tens[tenDigit] + (oneDigit ? ' ' + ones[oneDigit] : '');
  }
  // For simplicity, handle up to 999
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ones[hundred] + ' hundred' + (remainder ? ' ' + convertNumberToWords(remainder) : '');
  }
  return num.toString(); // Fallback for larger numbers
}

export async function generateScript(contentIdea) {
  // Initialize script manager
  const scriptManager = new ScriptManager();
  
  // Check script supply status
  const supplyCheck = await scriptManager.checkScriptSupply();
  
  console.log(`📊 Script inventory: ${supplyCheck.unused} unused, ${supplyCheck.used} used (${supplyCheck.usage_percentage.toFixed(1)}% used)`);
  
  if (supplyCheck.critical) {
    console.log('� CRITICAL: Script supply critically low!');
  } else if (supplyCheck.needsRefresh) {
    console.log('⚠️  WARNING: Script supply running low');
  }
  
  if (supplyCheck.unused > 0) {
    console.log('🎯 Using pre-generated script from database...');
    const script = await scriptManager.getNextScript(true); // Mark as used
    
    if (script) {
      // Clean the script - remove formatting markers
      const cleanScript = cleanScriptForSpeech(script.script);
      
      // Save script to output directory for compatibility
      const outputDir = path.join(process.cwd(), 'output');
      await fs.ensureDir(outputDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scriptPath = path.join(outputDir, `script_${timestamp}.txt`);
      await fs.writeFile(scriptPath, cleanScript, 'utf8');
      
      console.log('✅ Using pre-generated script from database');
      console.log('📝 Script ID:', script.id);
      console.log('📖 Verse:', script.verse.substring(0, 50) + '...');
      console.log('📝 Preview:', cleanScript.substring(0, 100) + '...');
      
      return {
        script: cleanScript,
        scriptPath,
        verse: script.verse,
        angle: 'Pre-generated content',
        keywords: script.keywords || [],
        scriptId: script.id,
        supplyStatus: supplyCheck
      };
    }
  }
  
  console.log('⚠️  No pre-generated scripts available, falling back to simple script...');
  
  // Parse the content idea from BabyAGI for fallback script
  const lines = contentIdea.split('\n');
  const verse = lines.find(line => line.startsWith('VERSE:'))?.replace('VERSE:', '').trim();
  const angle = lines.find(line => line.startsWith('ANGLE:'))?.replace('ANGLE:', '').trim();
  const keywords = lines.find(line => line.startsWith('KEYWORDS:'))?.replace('KEYWORDS:', '').trim();

  try {
    // Since we don't have pre-generated scripts, create a basic fallback
    console.log('🔄 Creating fallback script...');
    console.log('📖 Verse:', verse);
    
    // Create a simple fallback script based on the verse
    let fallbackScript = `Today's verse reminds us of an important truth. ${verse || 'The Bible'} shows us God's love and guidance. When life gets challenging, remember that God has a plan for you. Trust in His timing and His ways. Don't forget to like and subscribe for daily Bible verses!`;
    
    // Clean the script
    const cleanScript = cleanScriptForSpeech(fallbackScript);
    
    // Save script to output directory
    const outputDir = path.join(process.cwd(), 'output');
    await fs.ensureDir(outputDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scriptPath = path.join(outputDir, `script_${timestamp}.txt`);
    
    await fs.writeFile(scriptPath, cleanScript, 'utf8');
    
    console.log('✅ Fallback script created');
    console.log('📝 Preview:', cleanScript.substring(0, 100) + '...');
    console.log('💾 Saved to:', scriptPath);
    
    return {
      script: cleanScript,
      scriptPath,
      verse,
      angle,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
    };

  } catch (error) {
    console.error('❌ Error creating fallback script:', error);
    
    // Dynamic fallback script based on verse
    let fallbackScript = '';
    let verseReference = 'Philippians 4:13';
    let angle = 'God\'s strength in weakness';
    let keywords = ['strength', 'faith', 'overcoming', 'Christ'];
    
    // Create a more appropriate fallback based on the verse content
    if (verse && verse.includes('Philippians')) {
      fallbackScript = `Feeling weak? Philippians four thirteen says "I can do all things through Christ who strengthens me." When you feel like giving up, remember God's strength is made perfect in your weakness. You don't have to be strong enough - He is. Let that truth change your day. Don't forget to like and subscribe for daily Bible verses!`;
      verseReference = 'Philippians 4:13';
      angle = 'God\'s strength in weakness';
      keywords = ['strength', 'faith', 'overcoming', 'Christ'];
    } else if (verse && verse.includes('John')) {
      fallbackScript = `Feel worthless? John three sixteen says "God so loved the world that he gave his one and only Son." That includes you. God's love never changes. You are chosen, you are loved, you are enough. Don't forget to like and subscribe for daily Bible verses!`;
      verseReference = 'John 3:16';
      angle = 'God\'s unconditional love';
      keywords = ['love', 'acceptance', 'worth', 'grace'];
    } else if (verse && verse.includes('Jeremiah')) {
      fallbackScript = `Life feeling overwhelming? Jeremiah twenty nine eleven says "I know the plans I have for you, plans to prosper you and not to harm you, to give you hope and a future." When everything feels uncertain, trust that God is working behind the scenes. Your breakthrough is coming. Don't forget to like and subscribe for daily Bible verses!`;
      verseReference = 'Jeremiah 29:11';
      angle = 'God\'s good plans';
      keywords = ['hope', 'future', 'trust', 'breakthrough'];
    } else {
      fallbackScript = `Life feeling overwhelming? God's word reminds us that His plans for us are good, to give us hope and a future. When everything feels uncertain, trust that God is working behind the scenes. Your breakthrough is coming. Don't forget to like and subscribe for daily Bible verses!`;
      verseReference = verse || 'Jeremiah 29:11';
      angle = 'God\'s good plans';
      keywords = ['hope', 'future', 'trust', 'breakthrough'];
    }
    
    const outputDir = path.join(process.cwd(), 'output');
    await fs.ensureDir(outputDir);
    const scriptPath = path.join(outputDir, 'script_fallback.txt');
    await fs.writeFile(scriptPath, fallbackScript, 'utf8');
    
    return {
      script: fallbackScript,
      scriptPath,
      verse: verseReference,
      angle,
      keywords
    };
  }
}

export async function validateScriptLength(script) {
  // Estimate speaking time (average 150 words per minute, target 30 seconds)
  const words = script.split(' ').length;
  const estimatedSeconds = (words / 150) * 60;
  
  console.log(`📊 Script stats: ${words} words, ~${estimatedSeconds.toFixed(1)} seconds`);
  
  if (estimatedSeconds > 35) {
    console.log('⚠️  Script might be too long for 30-second short');
  } else if (estimatedSeconds < 25) {
    console.log('⚠️  Script might be too short');
  } else {
    console.log('✅ Script length looks good');
  }
  
  return estimatedSeconds;
}

// For testing purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('✍️ Testing Script Generator...');
  const testIdea = `VERSE: John 3:16
ANGLE: Why God's love hits different when you've given up on yourself
KEYWORDS: love, hope, self-worth, acceptance, grace`;
  
  const result = await generateScript(testIdea);
  console.log('Generated script:', result.script);
  await validateScriptLength(result.script);
}
