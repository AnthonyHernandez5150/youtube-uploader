#!/usr/bin/env node

// ✝️ UPLOAD RECOVERY SCRIPT
// Standalone script to check for missed uploads and process retry queue
// Run this manually or set up as a scheduled task

import { 
  detectMissedUploads, 
  processRetryQueue, 
  cleanupOldRetries,
  showRetryStats 
} from "./systems/uploadRecovery.mjs";
import dotenv from "dotenv";

dotenv.config();

async function runRecovery() {
  try {
    console.log('🔧 Bible Shorts Upload Recovery');
    console.log('================================');
    
    // Show current retry queue status
    console.log('\n📊 Current retry queue status:');
    await showRetryStats();
    
    // Check for missed uploads from previous sessions
    console.log('\n🔍 Scanning for missed uploads...');
    const missedCount = await detectMissedUploads();
    
    if (missedCount > 0) {
      console.log(`📋 Found ${missedCount} missed uploads`);
    } else {
      console.log('✅ No missed uploads found');
    }
    
    // Process any pending retries
    console.log('\n♻️ Processing retry queue...');
    const processedCount = await processRetryQueue();
    
    if (processedCount > 0) {
      console.log(`✅ Processed ${processedCount} retry attempts`);
    } else {
      console.log('📭 No pending retries to process');
    }
    
    // Clean up old retry attempts
    console.log('\n🧹 Cleaning up old retries...');
    const cleanedCount = await cleanupOldRetries();
    
    if (cleanedCount > 0) {
      console.log(`🗑️ Cleaned up ${cleanedCount} old retry records`);
    } else {
      console.log('✨ No old retries to clean up');
    }
    
    // Final status
    console.log('\n📊 Final retry queue status:');
    await showRetryStats();
    
    console.log('\n🎉 Recovery process complete!');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    process.exit(1);
  }
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRecovery();
}

export { runRecovery };
