#!/usr/bin/env node

// Simplified YouTube OAuth Setup - Manual Code Entry
// This version lets you manually enter the authorization code

import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];
const TOKEN_PATH = path.join(process.cwd(), 'auth', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'auth', 'client_secret.json');

async function setupWithManualCode() {
  console.log('🔐 YouTube OAuth Setup - Manual Code Entry');
  console.log('==========================================\n');
  
  try {
    // Load client credentials
    const credentials = await fs.readJson(CREDENTIALS_PATH);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    
    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    console.log('📋 STEP 1: Copy this URL and open it in your browser:');
    console.log('='.repeat(80));
    console.log(authUrl);
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 STEP 2: Complete the OAuth flow in your browser');
    console.log('📋 STEP 3: Copy the authorization code from the browser');
    console.log('📋 STEP 4: Edit this file and paste the code below:');
    console.log('');
    
    // Manual code entry area - user needs to edit this
    const AUTHORIZATION_CODE = '4/0AVMBsJijcwSkA3C5MBCxR2NABj4AR6Zh-iEbWddjlDWzbVRtHf7c2WOqFLmiVT8F7ewlEQ';
    
    if (AUTHORIZATION_CODE === 'PASTE_YOUR_CODE_HERE') {
      console.log('❌ Please edit this file and replace PASTE_YOUR_CODE_HERE with your actual authorization code');
      console.log('📁 File to edit: setup_manual.mjs');
      console.log('🔍 Look for the line: const AUTHORIZATION_CODE = \'PASTE_YOUR_CODE_HERE\';');
      console.log('✏️  Replace PASTE_YOUR_CODE_HERE with your code');
      console.log('💾 Save the file and run: node setup_manual.mjs');
      return;
    }
    
    // Exchange code for tokens
    console.log('🔄 Exchanging code for access token...');
    const { tokens } = await oAuth2Client.getToken(AUTHORIZATION_CODE);
    oAuth2Client.setCredentials(tokens);

    // Save tokens
    await fs.ensureDir(path.dirname(TOKEN_PATH));
    await fs.writeJson(TOKEN_PATH, tokens, { spaces: 2 });

    console.log('✅ Authentication successful!');
    console.log('💾 Tokens saved to:', TOKEN_PATH);
    
    // Test the authentication
    console.log('🧪 Testing YouTube API access...');
    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
    
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      console.log('✅ Successfully connected to YouTube channel:');
      console.log(`📺 Channel: ${channel.snippet.title}`);
      console.log(`🆔 Channel ID: ${channel.id}`);
      console.log('');
      console.log('🎬 Setup complete! You can now run: npm start');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n🔧 The authorization code might be:');
      console.log('- Expired (codes expire quickly)');
      console.log('- Already used (codes can only be used once)');
      console.log('- Incorrectly copied');
      console.log('\n🔄 Please get a fresh authorization code and try again');
    }
  }
}

setupWithManualCode();
