#!/usr/bin/env node

// YouTube OAuth Setup Script
// Run this once to authenticate with YouTube API

import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = path.join(process.cwd(), 'auth', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'auth', 'client_secret.json');

async function setupYouTubeAuth() {
  console.log('� YouTube OAuth Setup');
  console.log('======================\n');
  
  try {
    // Check if credentials exist
    if (!await fs.pathExists(CREDENTIALS_PATH)) {
      console.error('❌ Error: client_secret.json not found!');
      console.log('📋 Please follow these steps:');
      console.log('1. Go to Google Cloud Console');
      console.log('2. Enable YouTube Data API v3');
      console.log('3. Create OAuth 2.0 credentials');
      console.log('4. Download and save as: auth/client_secret.json');
      console.log('\n📖 Full guide: ./YOUTUBE_SETUP.md');
      return false;
    }

    // Load client credentials
    const credentials = await fs.readJson(CREDENTIALS_PATH);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    if (!client_id || !client_secret) {
      console.error('❌ Invalid client_secret.json format');
      return false;
    }

    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    
    // Check if we already have a valid token
    if (await fs.pathExists(TOKEN_PATH)) {
      try {
        const token = await fs.readJson(TOKEN_PATH);
        oAuth2Client.setCredentials(token);
        await oAuth2Client.getAccessToken();
        
        console.log('✅ YouTube authentication already configured!');
        console.log('🎬 You can now run: npm start');
        return true;
      } catch (error) {
        console.log('🔄 Existing token expired, getting new one...');
      }
    }

    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent screen to get refresh token
    });

    console.log('🌐 Open this URL in your browser:');
    console.log('='.repeat(60));
    console.log(authUrl);
    console.log('='.repeat(60));
    console.log('');
    
    // Get authorization code from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise((resolve) => {
      rl.question('📋 Paste the code from the browser here: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    // Exchange code for tokens
    console.log('🔄 Exchanging code for access token...');
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save tokens
    await fs.ensureDir(path.dirname(TOKEN_PATH));
    await fs.writeJson(TOKEN_PATH, tokens, { spaces: 2 });

    console.log('✅ Authentication successful!');
    console.log('💾 Tokens saved to:', TOKEN_PATH);
    
    // Test the authentication
    console.log('🧪 Testing YouTube API access...');
    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
    
    try {
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
        return true;
      } else {
        console.log('⚠️  Authentication successful but no channels found');
        console.log('📺 Make sure you have a YouTube channel associated with this account');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Failed to test YouTube API:', error.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify client_secret.json is valid');
    console.log('2. Check OAuth consent screen is configured');
    console.log('3. Ensure YouTube Data API v3 is enabled');
    console.log('4. Make sure you copied the full authorization code');
    return false;
  }
}

async function showChannelInfo() {
  try {
    if (!await fs.pathExists(TOKEN_PATH)) {
      console.log('❌ Not authenticated. Run: npm run setup');
      return;
    }

    const credentials = await fs.readJson(CREDENTIALS_PATH);
    const tokens = await fs.readJson(TOKEN_PATH);
    
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
    
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings'],
      mine: true
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      const stats = channel.statistics;
      
      console.log('📺 YouTube Channel Information:');
      console.log('='.repeat(40));
      console.log(`📛 Name: ${channel.snippet.title}`);
      console.log(`🆔 ID: ${channel.id}`);
      console.log(`📊 Subscribers: ${stats.subscriberCount || 'Hidden'}`);
      console.log(`🎬 Videos: ${stats.videoCount || '0'}`);
      console.log(`👀 Total Views: ${stats.viewCount || '0'}`);
      console.log(`📅 Created: ${new Date(channel.snippet.publishedAt).toLocaleDateString()}`);
      
      if (channel.snippet.description) {
        console.log(`📝 Description: ${channel.snippet.description.substring(0, 100)}...`);
      }
      
      console.log('='.repeat(40));
      console.log('✅ Ready for uploads!');
    }
    
  } catch (error) {
    console.error('❌ Failed to get channel info:', error.message);
  }
}

// Handle command line arguments
const command = process.argv[2];

async function main() {
  switch (command) {
    case 'info':
      await showChannelInfo();
      break;
    case 'setup':
    default:
      await setupYouTubeAuth();
      break;
  }
}

main().catch(console.error);
