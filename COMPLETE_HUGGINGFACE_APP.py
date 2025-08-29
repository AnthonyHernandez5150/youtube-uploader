import gradio as gr
from huggingface_hub import InferenceClient
import requests
import json

# Initialize the client with a lighter, more reliable model
client = InferenceClient("microsoft/DialoGPT-medium")

def get_bible_verse(book: str, chapter: int, verse: int) -> str:
    """Fetch verse from bible-api.com"""
    try:
        url = f"https://bible-api.com/{book}+{chapter}:{verse}"
        response = requests.get(url)
        return response.json().get("text", "Verse not found")
    except:
        return "Error fetching verse"

def analyze_verse(book: str, chapter: int, verse: int, question: str):
    """Original function for manual UI"""
    # Fetch verse
    verse_text = get_bible_verse(book, chapter, verse)
    
    # Generate analysis with strict limits
    prompt = f"""Analyze this Bible verse: {verse_text}
Question: {question}
Provide context and meaning in under 200 words."""
    
    try:
        response = client.text_generation(
            prompt,
            max_new_tokens=150,  # Reduced from 200
            temperature=0.3,
            return_full_text=False
        )
        
        # Ensure response isn't too long
        if len(response) > 300:
            response = response[:300] + "..."
            
        return response
    except Exception as e:
        return f"This verse speaks to God's love and grace. {verse_text[:100]}... offers wisdom for daily living and spiritual growth."

def analyze_verse_for_script(verse_text: str):
    """
    FIXED FUNCTION: Generate YouTube Short script from Bible verse
    Optimized to prevent Content-Length errors
    """
    # Limit input size
    if len(verse_text) > 200:
        verse_text = verse_text[:200] + "..."
    
    prompt = f"""Create a 30-second YouTube Short script:

VERSE: {verse_text}

Format:
HOOK: [attention grabber]
POINT: [main message]
CTA: [call to action]

Keep under 120 words total."""

    try:
        response = client.text_generation(
            prompt,
            max_new_tokens=100,  # Much smaller limit
            temperature=0.4,
            return_full_text=False,
            do_sample=True
        )
        
        # Strict size control
        if len(response) > 250:
            response = response[:250] + "..."
            
        return response.strip()
        
    except Exception as e:
        # Compact fallback script
        return f"""HOOK: This Bible verse will change your day!

POINT: {verse_text[:80]}... reminds us of God's love and guidance in our daily lives.

CTA: How does this verse speak to you? Comment below! Like and follow for daily inspiration.

#BibleVerse #Faith #DailyInspiration"""

def get_random_bible_verse():
    """Get a random popular Bible verse for testing"""
    popular_verses = [
        ("John", 3, 16),
        ("Philippians", 4, 13),
        ("Jeremiah", 29, 11),
        ("Romans", 8, 28),
        ("Proverbs", 3, 5),
        ("Isaiah", 41, 10),
        ("Matthew", 6, 26),
        ("Psalm", 23, 1)
    ]
    
    import random
    book, chapter, verse = random.choice(popular_verses)
    verse_text = get_bible_verse(book, chapter, verse)
    
    return f"{book} {chapter}:{verse} - {verse_text}"

# Gradio Interface with optimized settings
with gr.Blocks(title="Bible Verse Analyzer") as ui:
    gr.Markdown("# 📖 Bible Verse Analyzer & Script Generator")
    gr.Markdown("*Generate YouTube Short scripts from Bible verses*")
    
    with gr.Tabs():
        # Tab 1: YouTube Script Generator (primary for pipeline)
        with gr.TabItem("🎬 YouTube Script Generator"):
            gr.Markdown("### Generate engaging YouTube Short scripts")
            
            with gr.Row():
                with gr.Column():
                    verse_input = gr.Textbox(
                        label="Bible Verse Text",
                        placeholder="Enter verse text here...",
                        lines=2,
                        value="For God so loved the world that he gave his one and only Son..."
                    )
                    
                    with gr.Row():
                        generate_btn = gr.Button("🎯 Generate Script", variant="primary")
                        random_btn = gr.Button("🎲 Random Verse", variant="secondary")
                
                with gr.Column():
                    script_output = gr.Textbox(
                        label="YouTube Short Script",
                        lines=6,
                        placeholder="Script will appear here..."
                    )
            
            # Button actions
            generate_btn.click(
                analyze_verse_for_script,
                inputs=verse_input,
                outputs=script_output
            )
            
            random_btn.click(
                get_random_bible_verse,
                outputs=verse_input
            )
        
        # Tab 2: Bible Analysis
        with gr.TabItem("📚 Bible Analysis"):
            with gr.Row():
                book = gr.Textbox(label="Book", value="John")
                chapter = gr.Number(label="Chapter", value=3)
                verse = gr.Number(label="Verse", value=16)
            
            question = gr.Textbox(
                label="Question", 
                value="What does this mean?"
            )
            
            analyze_btn = gr.Button("🔍 Analyze", variant="primary")
            analysis_output = gr.Textbox(label="Analysis", lines=5)
            
            analyze_btn.click(
                analyze_verse,
                inputs=[book, chapter, verse, question],
                outputs=analysis_output
            )
    
    gr.Markdown("*Optimized for automated content creation*")

# Launch with minimal overhead
if __name__ == "__main__":
    ui.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True
    )
