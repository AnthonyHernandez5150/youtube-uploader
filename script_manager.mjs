// Script Management Utility
// Use this to monitor, manage, and generate new Bible scripts

import { ScriptManager } from './pipeline_integration.mjs';
import fs from 'fs-extra';
import path from 'path';

const scriptManager = new ScriptManager();

async function showStatus() {
  console.log('📊 BIBLE SCRIPTS STATUS REPORT');
  console.log('='.repeat(50));
  
  const report = await scriptManager.getDetailedReport();
  const stats = report.stats;
  
  console.log(`📦 Total Scripts: ${stats.total}`);
  console.log(`✅ Used Scripts: ${stats.used}`);
  console.log(`📝 Unused Scripts: ${stats.unused}`);
  console.log(`📈 Usage Percentage: ${stats.usage_percentage.toFixed(1)}%`);
  console.log(`🔄 Average Uses per Script: ${stats.average_uses_per_script.toFixed(1)}`);
  console.log(`♻️  Scripts Used Multiple Times: ${stats.scripts_used_multiple_times}`);
  
  // Supply status
  const supplyCheck = await scriptManager.checkScriptSupply();
  if (supplyCheck.critical) {
    console.log('🚨 STATUS: CRITICAL - Generate scripts immediately!');
  } else if (supplyCheck.needsRefresh) {
    console.log('⚠️  STATUS: LOW - Consider generating more scripts');
  } else {
    console.log('✅ STATUS: GOOD - Plenty of scripts available');
  }
  
  console.log('\n🏆 MOST USED SCRIPTS:');
  report.mostUsed.forEach((script, i) => {
    console.log(`${i+1}. ${script.verse.substring(0, 40)}... (used ${script.usage_count} times)`);
  });
  
  console.log('\n🕒 RECENTLY USED SCRIPTS:');
  report.recentlyUsed.forEach((script, i) => {
    const date = new Date(script.used_at).toLocaleString();
    console.log(`${i+1}. ${script.verse.substring(0, 40)}... (${date})`);
  });
}

async function cleanupOldScripts() {
  console.log('🧹 CLEANUP: Finding scripts used multiple times...');
  
  const data = await scriptManager.loadScripts();
  const multipleUseScripts = data.scripts.filter(s => s.usage_count > 1);
  
  if (multipleUseScripts.length === 0) {
    console.log('✅ No scripts used multiple times found');
    return;
  }
  
  console.log(`Found ${multipleUseScripts.length} scripts used multiple times:`);
  multipleUseScripts.forEach(script => {
    console.log(`- ${script.verse.substring(0, 50)}... (used ${script.usage_count} times)`);
  });
  
  console.log('💡 TIP: You can manually review and delete these from data/bible_scripts.json');
}

async function resetAllUsage() {
  console.log('🔄 RESET: Marking all scripts as unused...');
  
  const data = await scriptManager.loadScripts();
  data.scripts.forEach(script => {
    script.used = false;
    delete script.used_at;
    delete script.usage_count;
  });
  
  await scriptManager.saveScripts(data);
  console.log(`✅ Reset complete! All ${data.scripts.length} scripts are now available for use.`);
}

async function generateNewScripts() {
  console.log('🤖 GENERATE: Starting new script generation...');
  console.log('💡 TIP: This would typically call your batch_script_generator.py');
  console.log('📝 For now, run: python batch_script_generator.py');
  console.log('🔄 Then the new scripts will be automatically merged into your existing collection');
}

// CLI Interface
async function handleCLI() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
    case 'cleanup':
      await cleanupOldScripts();
      break;
    case 'reset':
      await resetAllUsage();
      break;
    case 'generate':
      await generateNewScripts();
      break;
    default:
      console.log('📋 BIBLE SCRIPTS MANAGER');
      console.log('Usage: node script_manager.mjs [command]');
      console.log('');
      console.log('Commands:');
      console.log('  status    - Show detailed script usage report');
      console.log('  cleanup   - Find scripts used multiple times');
      console.log('  reset     - Mark all scripts as unused (fresh start)');
      console.log('  generate  - Generate new scripts (calls Python generator)');
      console.log('');
      console.log('Examples:');
      console.log('  node script_manager.mjs status');
      console.log('  node script_manager.mjs cleanup');
      await showStatus(); // Show status by default
  }
}

// Run CLI
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('script_manager.mjs')) {
  handleCLI().catch(console.error);
}
