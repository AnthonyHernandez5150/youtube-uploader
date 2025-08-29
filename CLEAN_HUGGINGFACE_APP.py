import gradio as gr

def analyze_verse_for_script(verse_text: str):
    """Ultra-simple script generator - NO AI model calls"""
    
    # Input validation
    if not verse_text or len(verse_text.strip()) < 10:
        verse_text = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
    
    # Truncate to prevent length issues
    if len(verse_text) > 150:
        verse_text = verse_text[:150] + "..."
    
    # Simple template-based script (NO AI calls)
    script = f"""HOOK: This Bible verse will transform your day!

VERSE: {verse_text}

MEANING: This powerful scripture reminds us of God's love and guidance in our daily walk.

APPLICATION: Take a moment today to reflect on these words and how they apply to your current situation.

CTA: What does this verse mean to you? Share your thoughts below! 

#BibleVerse #Faith #DailyInspiration"""
    
    # Ensure response is under 300 characters total
    if len(script) > 280:
        script = script[:280] + "..."
    
    return script

def analyze_verse(book: str, chapter: int, verse: int, question: str):
    """Simple analysis without AI"""
    return f"Analysis of {book} {chapter}:{verse} - This verse offers timeless wisdom and spiritual guidance for believers seeking to understand God's word in their daily lives."

# Ultra-minimal interface
with gr.Blocks(title="Bible Verse Analyzer") as ui:
    gr.Markdown("# 📖 Bible Verse Script Generator")
    
    with gr.Row():
        verse_input = gr.Textbox(
            label="Bible Verse Text",
            lines=2,
            value="For God so loved the world..."
        )
        script_output = gr.Textbox(
            label="YouTube Script", 
            lines=4
        )
    
    generate_btn = gr.Button("Generate Script")
    generate_btn.click(
        analyze_verse_for_script,
        inputs=verse_input,
        outputs=script_output
    )

if __name__ == "__main__":
    ui.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True
    )
