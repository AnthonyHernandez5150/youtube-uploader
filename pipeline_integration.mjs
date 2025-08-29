// Pipeline Integration (JavaScript/Node.js version)
// Drop-in replacement for HuggingFace Space calls using local script database

import fs from 'fs-extra';
import path from 'path';

const SCRIPTS_FILE = path.join(process.cwd(), 'data', 'bible_scripts.json');

export class ScriptManager {
  constructor() {
    this.scriptsFile = SCRIPTS_FILE;
  }
  
  async loadScripts() {
    try {
      if (await fs.pathExists(this.scriptsFile)) {
        const data = await fs.readJson(this.scriptsFile);
        return data;
      }
    } catch (error) {
      console.warn('Warning loading scripts:', error.message);
    }
    
    return {
      scripts: [],
      generated_at: new Date().toISOString()
    };
  }
  
  async saveScripts(data) {
    try {
      await fs.ensureDir(path.dirname(this.scriptsFile));
      await fs.writeJson(this.scriptsFile, data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving scripts:', error.message);
    }
  }
  
  async getNextScript(markUsed = true) {
    const data = await this.loadScripts();
    const unusedScripts = data.scripts.filter(s => !s.used);
    
    if (unusedScripts.length === 0) {
      return null;
    }
    
    // Get random unused script for variety
    const randomIndex = Math.floor(Math.random() * unusedScripts.length);
    const script = unusedScripts[randomIndex];
    
    if (markUsed) {
      // Mark as used and add usage count
      const scriptIndex = data.scripts.findIndex(s => s.id === script.id);
      if (scriptIndex !== -1) {
        data.scripts[scriptIndex].used = true;
        data.scripts[scriptIndex].used_at = new Date().toISOString();
        data.scripts[scriptIndex].usage_count = (data.scripts[scriptIndex].usage_count || 0) + 1;
        await this.saveScripts(data);
        
        // Check if we need to alert about low script count
        await this.checkScriptSupply();
      }
    }
    
    return script;
  }
  
  async checkScriptSupply() {
    const stats = await this.getScriptStats();
    const LOW_SCRIPT_THRESHOLD = 20;
    const CRITICAL_SCRIPT_THRESHOLD = 10;
    
    if (stats.unused <= CRITICAL_SCRIPT_THRESHOLD) {
      console.log('🚨 CRITICAL: Only ' + stats.unused + ' scripts remaining! Generate new scripts immediately!');
    } else if (stats.unused <= LOW_SCRIPT_THRESHOLD) {
      console.log('⚠️  LOW SUPPLY: Only ' + stats.unused + ' scripts remaining. Consider generating more scripts soon.');
    }
    
    return {
      needsRefresh: stats.unused <= LOW_SCRIPT_THRESHOLD,
      critical: stats.unused <= CRITICAL_SCRIPT_THRESHOLD,
      ...stats
    };
  }
  
  async getScriptStats() {
    const data = await this.loadScripts();
    const total = data.scripts.length;
    const used = data.scripts.filter(s => s.used).length;
    const unused = total - used;
    
    // Calculate usage stats
    const usageStats = data.scripts.reduce((acc, script) => {
      if (script.usage_count) {
        acc.totalUsages += script.usage_count;
        acc.multipleUses += script.usage_count > 1 ? 1 : 0;
      }
      return acc;
    }, { totalUsages: 0, multipleUses: 0 });
    
    return {
      total,
      used,
      unused,
      usage_percentage: total > 0 ? (used / total * 100) : 0,
      average_uses_per_script: used > 0 ? (usageStats.totalUsages / used) : 0,
      scripts_used_multiple_times: usageStats.multipleUses
    };
  }
  
  async getDetailedReport() {
    const data = await this.loadScripts();
    const stats = await this.getScriptStats();
    
    // Get most/least used scripts
    const usedScripts = data.scripts.filter(s => s.used).sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    const mostUsed = usedScripts.slice(0, 5);
    const recentlyUsed = data.scripts.filter(s => s.used_at).sort((a, b) => new Date(b.used_at) - new Date(a.used_at)).slice(0, 5);
    
    return {
      stats,
      mostUsed: mostUsed.map(s => ({ id: s.id, verse: s.verse, usage_count: s.usage_count || 1 })),
      recentlyUsed: recentlyUsed.map(s => ({ id: s.id, verse: s.verse, used_at: s.used_at }))
    };
  }
}

export async function analyze_verse_for_script(verseText = "") {
  /**
   * Drop-in replacement for HuggingFace Space function
   * Returns pre-generated script instead of calling API
   */
  
  const manager = new ScriptManager();
  
  // Check script supply
  const stats = await manager.getScriptStats();
  
  if (stats.unused < 10) {
    console.log("⚠️  Warning: Low script supply! Generate more scripts soon.");
  }
  
  // Get pre-generated script
  const scriptData = await manager.getNextScript();
  
  if (!scriptData) {
    // Fallback script if database is empty
    console.log("⚠️  No scripts available, using fallback");
    return `HOOK: This Bible verse will inspire you today!
VERSE: Trust in the Lord with all your heart.
MEANING: Complete faith brings peace and direction.
APPLICATION: Choose trust over worry in every situation.
CTA: Share your testimony! #Bible #Faith #Trust #Inspiration`;
  }
  
  console.log(`✅ Retrieved script from local database (${stats.unused - 1} remaining)`);
  return scriptData.script;
}

export async function checkScriptSupply() {
  /**
   * Check if we need to generate more scripts
   */
  const manager = new ScriptManager();
  const stats = await manager.getScriptStats();
  
  console.log(`📊 Script Supply Status:`);
  console.log(`   Total scripts: ${stats.total}`);
  console.log(`   Used: ${stats.used}`);
  console.log(`   Remaining: ${stats.unused}`);
  console.log(`   Usage: ${stats.usage_percentage.toFixed(1)}%`);
  
  if (stats.unused < 10) {
    console.log("\n⚠️  LOW SCRIPT SUPPLY!");
    console.log("   Run 'python batch_script_generator.py' to create more scripts");
    return false;
  } else if (stats.unused < 25) {
    console.log("\n🔔 Consider generating more scripts soon");
    return true;
  } else {
    console.log("\n✅ Good script supply");
    return true;
  }
}

// For testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing JavaScript Pipeline Integration');
  console.log('=' * 40);
  
  // Test getting several scripts
  for (let i = 0; i < 3; i++) {
    console.log(`\n📝 Test ${i+1}: Getting script...`);
    const script = await analyze_verse_for_script("John 3:16");
    console.log("Received script:");
    console.log(script.substring(0, 100) + "...");
    console.log("-".repeat(40));
  }
}
