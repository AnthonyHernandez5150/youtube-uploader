// 🧠 BabyAGI - Content Planning Agent
// Generates creative Bible verse topics for YouTube Shorts

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize AI client - prioritize OpenRouter, fallback to OpenAI
const aiClient = process.env.OPENROUTER_API_KEY ? 
  new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  }) :
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const AI_MODEL = process.env.OPENROUTER_API_KEY ? 
  process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet' :
  process.env.OPENAI_MODEL || 'gpt-4';

const BIBLE_VERSE_PROMPTS = [
  "Give me a powerful Bible verse about overcoming anxiety that young people can relate to",
  "Find a Bible verse about love that applies to modern relationships",
  "Share a verse about finding purpose that speaks to career struggles",
  "Give me a verse about forgiveness that helps with family conflicts",
  "Find a Bible verse about hope that applies to financial stress",
  "Share a verse about strength that helps with mental health",
  "Give me a verse about peace that applies to social media pressure",
  "Find a Bible verse about wisdom that helps with decision making",
  "Share a verse about faith that applies to uncertainty",
  "Give me a verse about joy that helps during difficult times"
];

const CONTENT_THEMES = [
  "mental health and faith",
  "relationships and love",
  "career and purpose",
  "family and forgiveness",
  "money and provision",
  "anxiety and peace",
  "social media and identity",
  "decision making and wisdom",
  "uncertainty and trust",
  "depression and hope"
];

export async function planContent() {
  try {
    const randomPrompt = BIBLE_VERSE_PROMPTS[Math.floor(Math.random() * BIBLE_VERSE_PROMPTS.length)];
    const randomTheme = CONTENT_THEMES[Math.floor(Math.random() * CONTENT_THEMES.length)];

    const prompt = `
You are a creative content planner for Christian YouTube Shorts. 

Task: Generate ONE specific Bible verse with a modern, relatable angle.

Context: ${randomPrompt}
Theme: ${randomTheme}

Requirements:
- Choose a specific verse (e.g., "John 3:16", "Philippians 4:13")
- Create a modern hook that connects to real-life struggles
- Make it engaging for 18-35 year olds
- Keep it authentic and biblically sound
- Focus on practical application

Format your response as:
VERSE: [Book Chapter:Verse]
ANGLE: [Modern relatable hook/angle]
KEYWORDS: [3-5 relevant keywords for video search]

Example:
VERSE: Jeremiah 29:11
ANGLE: "When your 5-year plan falls apart - God's plan is better"
KEYWORDS: career, purpose, planning, future, trust
`;

    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a creative Bible content strategist who understands modern struggles and how scripture applies to daily life.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    const content = response.choices[0].message.content;
    console.log('🧠 Content idea generated:', content);
    
    return content;
  } catch (error) {
    console.error('❌ Error in planContent:', error);
    
    // Fallback content if API fails
    const fallbackTopics = [
      "VERSE: John 3:16\nANGLE: Why God's love hits different when you've given up on yourself\nKEYWORDS: love, hope, self-worth, acceptance, grace",
      "VERSE: Philippians 4:13\nANGLE: The strength to get through Monday when everything feels impossible\nKEYWORDS: strength, motivation, perseverance, faith, power",
      "VERSE: Jeremiah 29:11\nANGLE: When your career plans crash and burn, God's got something better\nKEYWORDS: purpose, plans, future, career, trust"
    ];
    
    return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
  }
}

export async function generateMultipleIdeas(count = 5) {
  const ideas = [];
  
  for (let i = 0; i < count; i++) {
    const idea = await planContent();
    ideas.push(idea);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return ideas;
}

// For testing purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧠 Testing BabyAGI Content Planner...');
  const idea = await planContent();
  console.log('Generated idea:', idea);
}
