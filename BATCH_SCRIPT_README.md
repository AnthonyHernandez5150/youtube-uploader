# Bible Script Batch Generation System

This system generates hundreds of YouTube Bible scripts in advance using Groq's free API, eliminating the need for real-time generation during video creation.

## Quick Start

### 1. Get Free Groq API Key
1. Go to https://console.groq.com/
2. Sign up for free account
3. Get your API key from the dashboard

### 2. Set Up Environment
```bash
# Copy environment file
copy .env.example .env

# Edit .env and add your Groq API key
set GROQ_API_KEY=your_actual_key_here
```

### 3. Generate Scripts
```bash
# Generate 100 scripts in one batch
python batch_script_generator.py
```

### 4. Use in Your Pipeline
```python
from pipeline_integration import analyze_verse_for_script

# Instead of calling HuggingFace Space:
script = analyze_verse_for_script("John 3:16")
# Returns pre-generated script instantly!
```

## Files

- **`batch_script_generator.py`** - Generates 100+ scripts using Groq API
- **`script_manager.py`** - Manages the script database, tracks usage
- **`pipeline_integration.py`** - Drop-in replacement for HF Space calls
- **`data/bible_scripts.json`** - Script database (auto-created)

## Features

✅ **Free**: Uses Groq's free API tier
✅ **Fast**: No real-time API calls during video generation  
✅ **Reliable**: Pre-generated scripts always available
✅ **Variety**: 8 different styles, 15+ Bible verses
✅ **Efficient**: Generate 100 scripts in ~2 minutes
✅ **Smart**: Auto-tracks usage, warns when supply is low

## Usage Examples

### Generate Scripts
```bash
python batch_script_generator.py
```

### Check Script Supply
```bash
python script_manager.py
```

### Pipeline Integration
```python
# Old way (HuggingFace Space)
response = requests.post(hf_space_url, json={"verse": verse})
script = response.json()["script"]

# New way (Local database)
from pipeline_integration import analyze_verse_for_script
script = analyze_verse_for_script(verse)  # Instant!
```

## Script Format

Each script follows YouTube Shorts best practices:
```
HOOK: [Attention-grabbing opening]
VERSE: [Bible verse text]  
MEANING: [Practical interpretation]
APPLICATION: [How to apply today]
CTA: [Call to action + hashtags]
```

## Automation

The system automatically:
- Warns when <20 scripts remain
- Tracks which scripts have been used
- Provides variety in styles and verses
- Falls back to templates if API fails

## Cost

**Completely FREE!**
- Groq API: Free tier (very generous limits)
- No HuggingFace Space crashes
- No rate limiting during video generation
- No monthly fees

## Next Steps

1. Generate your first batch of scripts
2. Update your video pipeline to use `analyze_verse_for_script()`  
3. Run batch generation weekly to keep supply fresh
4. Scale to 1000+ scripts for long-term automation
