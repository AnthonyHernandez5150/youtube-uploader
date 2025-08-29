// 📊 Script Status Tool - Check script database inventory and stats
// Quick tool to see how many scripts are available

import { ScriptDatabase } from '../database/scriptDatabase.mjs';

async function showScriptStatus() {
  console.log('📊 Script Database Status');
  console.log('========================\n');
  
  try {
    const scriptDB = new ScriptDatabase();
    await scriptDB.init();
    
    const stats = scriptDB.getStats();
    
    console.log('📈 Inventory:');
    console.log(`   Total Scripts: ${stats.total}`);
    console.log(`   Available: ${stats.unused} 📝`);
    console.log(`   Used: ${stats.used} ✅`);
    console.log('');
    
    console.log('🔧 Sources:');
    Object.entries(stats.sources).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });
    console.log('');
    
    console.log('🚨 Status:');
    if (stats.needsRefill) {
      console.log(`   ⚠️  LOW INVENTORY! Only ${stats.unused} scripts left`);
      console.log(`   💡 Run: npm run generate-scripts`);
    } else {
      console.log(`   ✅ Good inventory level (${stats.unused} scripts)`);
    }
    
    if (stats.lastBatchGeneration) {
      const lastGen = new Date(stats.lastBatchGeneration);
      console.log(`   📅 Last batch: ${lastGen.toLocaleDateString()} ${lastGen.toLocaleTimeString()}`);
    } else {
      console.log(`   📅 No batch generation yet`);
    }
    
  } catch (error) {
    console.error('❌ Error checking script status:', error);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  showScriptStatus();
}

export { showScriptStatus };
