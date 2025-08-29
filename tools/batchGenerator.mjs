// 🚀 Script Batch Generator - Generate scripts in bulk when HuggingFace is working
// Standalone tool for pre-generating scripts

import { ScriptDatabase } from '../database/scriptDatabase.mjs';
import dotenv from 'dotenv';

dotenv.config();

// HuggingFace Space API function
async function generateWithHuggingFace(book, chapter, verse) {
  const question = `Create a compelling 45-second YouTube Shorts script about this verse. Include: 
1) An attention-grabbing hook (relatable problem)
2) The Bible verse naturally integrated 
3) Modern application/takeaway
4) End with: "Don't forget to like and subscribe for daily Bible verses!"

Requirements:
- 60-65 words TOTAL maximum
- Conversational, modern language
- Speak directly to viewer ("you", "your")
- NO formatting markers like [HOOK] or brackets
- Output ONLY clean, speakable text

Make it punchy and engaging for young adults!`;

  try {
    console.log(`🎭 Starting HuggingFace generation for ${book} ${chapter}:${verse}...`);
    
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
    
    console.log(`🎬 Event started: ${eventId}`);
    
    // Step 2: Poll for the result (reduced timeout for batch processing)
    for (let i = 0; i < 8; i++) { // 16 seconds max per script
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const resultResponse = await fetch(`https://dim-lizard-dim-gpt.hf.space/gradio_api/call/analyze_verse_for_script/${eventId}`);
        
        if (resultResponse.ok) {
          const text = await resultResponse.text();
          
          if (text.includes('"output"') && text.includes('"data"')) {
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.output && data.output.data && data.output.data[0]) {
                    console.log(`✅ Generated script for ${book} ${chapter}:${verse}`);
                    return data.output.data[0];
                  }
                } catch (e) {
                  // Continue looking
                }
              }
            }
          }
        }
      } catch (pollError) {
        console.log(`⚠️  Poll attempt ${i + 1} failed, retrying...`);
      }
    }
    
    throw new Error('HuggingFace Space timeout after 16 seconds');
    
  } catch (error) {
    console.error(`❌ HuggingFace generation failed:`, error.message);
    throw error;
  }
}

// Main batch generation function
async function runBatchGeneration(count = 20) {
  console.log('🚀 Starting Script Batch Generator...');
  console.log(`📊 Target: ${count} scripts`);
  
  try {
    const scriptDB = new ScriptDatabase();
    await scriptDB.init();
    
    const initialStats = scriptDB.getStats();
    console.log(`📈 Current inventory: ${initialStats.unused} unused, ${initialStats.used} used`);
    
    const results = await scriptDB.batchGenerateScripts(count, generateWithHuggingFace);
    
    const finalStats = scriptDB.getStats();
    console.log(`📊 Final inventory: ${finalStats.unused} unused, ${finalStats.used} used`);
    console.log(`✨ Successfully generated ${results.success} scripts!`);
    
    if (results.failed > 0) {
      console.log(`⚠️  ${results.failed} scripts failed to generate`);
      console.log('Errors:', results.errors);
    }
    
  } catch (error) {
    console.error('💥 Batch generation failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const count = parseInt(process.argv[2]) || 20;
  runBatchGeneration(count);
}

export { runBatchGeneration, generateWithHuggingFace };
