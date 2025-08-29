// Automatic Script Refresher
// Monitors script supply and generates new ones when running low

import { ScriptManager } from './pipeline_integration.mjs';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const scriptManager = new ScriptManager();

export async function checkAndRefreshScripts() {
  console.log('🔍 Checking script supply...');
  
  const supplyCheck = await scriptManager.checkScriptSupply();
  
  if (supplyCheck.critical) {
    console.log('🚨 CRITICAL: Only ' + supplyCheck.unused + ' scripts left! Generating immediately...');
    return await generateNewScripts(50); // Generate 50 new scripts urgently
  } else if (supplyCheck.needsRefresh) {
    console.log('⚠️  LOW: Only ' + supplyCheck.unused + ' scripts left. Generating new batch...');
    return await generateNewScripts(30); // Generate 30 new scripts
  } else {
    console.log('✅ Script supply is good (' + supplyCheck.unused + ' unused scripts)');
    return { generated: false, reason: 'Supply sufficient' };
  }
}

async function generateNewScripts(count = 50) {
  console.log(`🤖 Generating ${count} new Bible scripts...`);
  
  try {
    // Check if Python script generator exists
    const generatorPath = path.join(process.cwd(), 'batch_script_generator.py');
    if (!(await fs.pathExists(generatorPath))) {
      console.log('❌ batch_script_generator.py not found. Please generate scripts manually.');
      return { generated: false, reason: 'Generator script not found' };
    }
    
    // Get current script count before generation
    const beforeStats = await scriptManager.getScriptStats();
    
    console.log('🐍 Running Python script generator...');
    
    // Run the Python script generator
    const result = await runPythonGenerator(count);
    
    if (result.success) {
      // Check script count after generation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for file to be written
      const afterStats = await scriptManager.getScriptStats();
      const newScripts = afterStats.total - beforeStats.total;
      
      console.log(`✅ Generated ${newScripts} new scripts successfully!`);
      console.log(`📊 Updated inventory: ${afterStats.unused} unused, ${afterStats.used} used`);
      
      return { 
        generated: true, 
        newScripts, 
        beforeTotal: beforeStats.total, 
        afterTotal: afterStats.total 
      };
    } else {
      console.log('❌ Script generation failed:', result.error);
      return { generated: false, reason: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error in script generation:', error.message);
    return { generated: false, reason: error.message };
  }
}

function runPythonGenerator(count) {
  return new Promise((resolve) => {
    // Check if we have a Python environment configured
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`🔄 Running: ${pythonCmd} batch_script_generator.py`);
    
    const pythonProcess = spawn(pythonCmd, ['batch_script_generator.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Show real-time output
      process.stdout.write(text);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: `Python process exited with code ${code}: ${errorOutput}` });
      }
    });
    
    pythonProcess.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

// Enhanced generateScript function that auto-refreshes when low
export async function generateScriptWithAutoRefresh(contentIdea) {
  // First check if we need to refresh scripts
  const refreshResult = await checkAndRefreshScripts();
  
  if (refreshResult.generated) {
    console.log(`🔄 Auto-generated ${refreshResult.newScripts} new scripts`);
  }
  
  // Import and use the existing generateScript function
  const { generateScript } = await import('./tasks/generateScript.mjs');
  return await generateScript(contentIdea);
}

// CLI interface for manual script refresh
async function handleCLI() {
  const command = process.argv[2];
  const count = parseInt(process.argv[3]) || 50;
  
  switch (command) {
    case 'check':
      await checkAndRefreshScripts();
      break;
    case 'force':
      console.log(`🔄 Force generating ${count} new scripts...`);
      const result = await generateNewScripts(count);
      if (result.generated) {
        console.log(`✅ Generated ${result.newScripts} new scripts!`);
      } else {
        console.log(`❌ Generation failed: ${result.reason}`);
      }
      break;
    default:
      console.log('🔄 SCRIPT REFRESHER');
      console.log('Usage: node script_refresher.mjs [command] [count]');
      console.log('');
      console.log('Commands:');
      console.log('  check     - Check supply and auto-generate if needed');
      console.log('  force [n] - Force generate n scripts (default: 50)');
      console.log('');
      console.log('Examples:');
      console.log('  node script_refresher.mjs check');
      console.log('  node script_refresher.mjs force 30');
      await checkAndRefreshScripts(); // Default action
  }
}

// Run CLI if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('script_refresher.mjs')) {
  handleCLI().catch(console.error);
}
