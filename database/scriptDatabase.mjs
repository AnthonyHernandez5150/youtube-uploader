// 📝 Script Database Manager - Pre-generation and rotation system
// Manages a local database of AI-generated scripts for reliable video creation

import fs from 'fs-extra';
import path from 'path';

const SCRIPT_DB_PATH = path.join(process.cwd(), 'data', 'scriptDatabase.json');

// Popular Bible verses for script generation
const BIBLE_VERSES = [
  'John 3:16', 'Philippians 4:13', 'Jeremiah 29:11', 'Romans 8:28', 'Proverbs 3:5-6',
  'Isaiah 40:31', 'Matthew 6:26', 'Psalm 23:1', 'Romans 8:38-39', 'John 14:6',
  'Ephesians 2:8-9', 'Matthew 28:20', 'Psalm 46:10', 'Isaiah 41:10', 'John 10:10',
  'Romans 12:2', 'Galatians 2:20', 'Philippians 4:19', 'Matthew 11:28', 'Psalm 139:14',
  'Colossians 3:23', 'Joshua 1:9', 'Psalm 37:4', 'Romans 8:1', 'John 8:32',
  'Matthew 5:16', 'Psalm 119:105', 'Hebrews 11:1', 'James 1:2-3', 'Matthew 6:33',
  'Proverbs 27:17', 'Romans 15:13', 'Psalm 34:8', 'John 15:13', 'Galatians 5:22-23',
  'Ephesians 4:32', 'Matthew 7:7', 'Psalm 27:1', 'Romans 10:9', 'John 1:12',
  'Philippians 1:6', 'Isaiah 53:5', 'Matthew 22:37', 'Psalm 121:1-2', 'John 16:33',
  'Romans 6:23', 'Ephesians 6:10', 'Psalm 18:2', 'Matthew 5:14', 'John 11:25'
];

class ScriptDatabase {
  constructor() {
    this.dbPath = SCRIPT_DB_PATH;
    this.data = null;
  }

  async init() {
    await fs.ensureDir(path.dirname(this.dbPath));
    await this.loadDatabase();
  }

  async loadDatabase() {
    try {
      if (await fs.pathExists(this.dbPath)) {
        this.data = await fs.readJSON(this.dbPath);
      } else {
        // Initialize with default structure
        this.data = {
          scripts: [],
          metadata: {
            total_generated: 0,
            last_used_index: -1,
            created_date: new Date().toISOString(),
            last_batch_generation: null,
            target_inventory: 100,
            minimum_threshold: 20
          },
          sources: {
            huggingface: 0,
            fallback: 0,
            manual: 0
          }
        };
        await this.saveDatabase();
      }
    } catch (error) {
      console.error('❌ Error loading script database:', error);
      throw error;
    }
  }

  async saveDatabase() {
    try {
      await fs.writeJSON(this.dbPath, this.data, { spaces: 2 });
    } catch (error) {
      console.error('❌ Error saving script database:', error);
      throw error;
    }
  }

  // Add a new script to the database
  async addScript(verse, script, keywords = [], source = 'huggingface') {
    const scriptEntry = {
      id: this.data.metadata.total_generated + 1,
      verse: verse,
      script: script.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      source: source,
      generated_date: new Date().toISOString(),
      used: false,
      used_date: null,
      quality_score: null // Could be used for manual rating later
    };

    this.data.scripts.push(scriptEntry);
    this.data.metadata.total_generated++;
    this.data.sources[source] = (this.data.sources[source] || 0) + 1;
    
    await this.saveDatabase();
    console.log(`✅ Added script #${scriptEntry.id} for ${verse} (${source})`);
    return scriptEntry;
  }

  // Get the next unused script for video generation
  async getNextScript() {
    const unusedScripts = this.data.scripts.filter(script => !script.used);
    
    if (unusedScripts.length === 0) {
      console.log('⚠️  No unused scripts available');
      return null;
    }

    // Get the next script in rotation
    this.data.metadata.last_used_index++;
    if (this.data.metadata.last_used_index >= unusedScripts.length) {
      this.data.metadata.last_used_index = 0;
    }

    const selectedScript = unusedScripts[this.data.metadata.last_used_index];
    
    // Mark as used
    selectedScript.used = true;
    selectedScript.used_date = new Date().toISOString();
    
    await this.saveDatabase();
    console.log(`📝 Selected script #${selectedScript.id}: ${selectedScript.verse}`);
    
    return selectedScript;
  }

  // Get database statistics
  getStats() {
    const total = this.data.scripts.length;
    const used = this.data.scripts.filter(s => s.used).length;
    const unused = total - used;
    
    return {
      total,
      used,
      unused,
      sources: { ...this.data.sources },
      needsRefill: unused <= this.data.metadata.minimum_threshold,
      lastBatchGeneration: this.data.metadata.last_batch_generation
    };
  }

  // Reset all scripts to unused (for testing or reset)
  async resetAllScripts() {
    this.data.scripts.forEach(script => {
      script.used = false;
      script.used_date = null;
    });
    this.data.metadata.last_used_index = -1;
    await this.saveDatabase();
    console.log('🔄 Reset all scripts to unused');
  }

  // Get a random verse for generation
  getRandomVerse() {
    return BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
  }

  // Batch generate scripts using HuggingFace
  async batchGenerateScripts(count = 20, generateFunction) {
    console.log(`🔥 Starting batch generation of ${count} scripts...`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < count; i++) {
      try {
        const verse = this.getRandomVerse();
        console.log(`📝 Generating script ${i + 1}/${count} for ${verse}...`);
        
        // Parse verse (e.g., "John 3:16" -> book=John, chapter=3, verse=16)
        const verseMatch = verse.match(/(\w+)\s+(\d+):(\d+)/);
        if (!verseMatch) {
          throw new Error(`Invalid verse format: ${verse}`);
        }
        
        const [, book, chapter, verseNum] = verseMatch;
        
        // Generate script using the provided function
        const script = await generateFunction(book, parseInt(chapter), parseInt(verseNum));
        
        if (script && script.trim().length > 50) {
          await this.addScript(verse, script, [], 'huggingface');
          results.success++;
        } else {
          throw new Error('Generated script too short or empty');
        }
        
        // Small delay between generations to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to generate script ${i + 1}:`, error.message);
        results.failed++;
        results.errors.push(`Script ${i + 1}: ${error.message}`);
      }
    }

    this.data.metadata.last_batch_generation = new Date().toISOString();
    await this.saveDatabase();

    console.log(`🎯 Batch generation complete: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

export { ScriptDatabase, BIBLE_VERSES };
