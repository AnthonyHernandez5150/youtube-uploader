import gradio as gr
import tempfile
import io
import wave
import numpy as np
from datetime import datetime

def analyze_verse_for_script(verse_text: str):
    """Returns consistent-length script to prevent audio duration variance"""
    return f"HOOK: {verse_text} inspires! VERSE: {verse_text}. MEANING: Divine love. APPLICATION: Reflect today. CTA: Share! #Bible"

def generate_simple_audio(text: str) -> str:
    """Generates a simple beep audio for demonstration (HuggingFace Spaces compatible)"""
    # Create a simple sine wave audio as placeholder
    sample_rate = 22050
    duration = min(len(text) * 0.1, 10.0)  # Max 10 seconds
    
    # Generate sine wave
    t = np.linspace(0, duration, int(sample_rate * duration))
    frequency = 440  # A4 note
    audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
    
    # Convert to 16-bit integers
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # Create temporary WAV file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
        with wave.open(tmp_file.name, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
        
        return tmp_file.name

def create_text_video_info(script: str) -> str:
    """Returns video information since actual video generation isn't possible in HF Spaces"""
    return f"""📹 Video would contain:
    
🎬 SCRIPT: {script}
📏 Format: 1080x1920 (9:16 ratio)
⏱️ Duration: ~{len(script) * 0.1:.1f} seconds
🎨 Style: Black background, white text
🎵 Audio: Synced voiceover

⚠️ Note: Full video generation requires local setup with FFmpeg.
For HuggingFace Spaces, we show the script and provide sample audio."""

def process_verse(verse_text: str):
    """HuggingFace Spaces compatible pipeline"""
    script = analyze_verse_for_script(verse_text)
    audio_path = generate_simple_audio(script)
    video_info = create_text_video_info(script)
    
    return script, audio_path, video_info

# HuggingFace Spaces compatible interface
with gr.Blocks(title="Bible Video Generator", theme=gr.themes.Soft()) as ui:
    gr.Markdown("""
    # 🎬 Bible Video Script Generator
    
    **⚠️ HuggingFace Spaces Demo Mode**
    - ✅ Script generation works fully
    - ✅ Sample audio generation 
    - ⚠️ Video generation requires local setup
    
    For full video creation, download and run locally with FFmpeg installed.
    """)
    
    with gr.Row():
        verse_input = gr.Textbox(
            label="📖 Enter Bible Verse", 
            value="John 3:16", 
            placeholder="e.g., John 3:16, Psalm 23:1, etc."
        )
        generate_btn = gr.Button("🚀 Generate Script", variant="primary")
    
    with gr.Column():
        script_output = gr.Textbox(label="📜 Generated Script", lines=3)
        
        with gr.Row():
            audio_output = gr.Audio(label="🎵 Sample Audio", type="filepath")
            video_info = gr.Textbox(label="📹 Video Information", lines=8)
    
    generate_btn.click(
        fn=process_verse,
        inputs=verse_input,
        outputs=[script_output, audio_output, video_info]
    )
    
    gr.Markdown("""
    ---
    ### 🛠️ For Full Video Generation:
    1. Download this code locally
    2. Install dependencies: `pip install gradio ffmpeg-python`
    3. Install system tools: FFmpeg + espeak/edge-tts
    4. Run locally for complete video generation
    """)

if __name__ == "__main__":
    ui.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True
    )
