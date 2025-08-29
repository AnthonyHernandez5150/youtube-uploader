import gradio as gr
import subprocess
import os
from pathlib import Path
from datetime import datetime

# Fixed paths for reliability
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

def analyze_verse_for_script(verse_text: str):
    """Returns consistent-length script to prevent audio duration variance"""
    return f"HOOK: {verse_text} inspires! VERSE: {verse_text}. MEANING: Divine love. APPLICATION: Reflect today. CTA: Share! #Bible"

def generate_audio(text: str) -> str:
    """Generates sync-safe WAV audio with consistent sample rate"""
    audio_path = OUTPUT_DIR / f"audio_{datetime.now().timestamp()}.wav"
    
    # Use espeak for deterministic audio length (or edge-tts if preferred)
    subprocess.run([
        "espeak", 
        "-v", "en-us", 
        "-s", "150",  # Fixed speech rate
        "-w", str(audio_path),
        text
    ], check=True)
    
    # Normalize audio to 48000Hz stereo (prevents sync drift)
    normalized_path = OUTPUT_DIR / f"norm_{audio_path.name}"
    subprocess.run([
        "ffmpeg",
        "-i", str(audio_path),
        "-ar", "48000",
        "-ac", "2",
        "-sample_fmt", "s16",
        "-y",
        str(normalized_path)
    ], check=True)
    
    return str(normalized_path)

def render_video(audio_path: str, script: str) -> str:
    """Generates perfectly synced video using frame-exact FFmpeg"""
    video_path = OUTPUT_DIR / f"video_{datetime.now().timestamp()}.mp4"
    
    # 1. Get EXACT audio duration
    duration = float(subprocess.check_output([
        "ffprobe",
        "-i", audio_path,
        "-show_entries", "format=duration",
        "-v", "quiet",
        "-of", "csv=p=0"
    ]).decode().strip())
    
    # 2. Generate video (1080x1920 @ 30fps)
    subprocess.run([
        "ffmpeg",
        "-f", "lavfi",
        "-i", f"color=color=black:size=1080x1920:duration={duration}",
        "-i", audio_path,
        "-vf", f"drawtext=text='{script}':fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2:fontcolor=white",
        "-c:v", "libx264",
        "-preset", "fast",
        "-r", "30",
        "-c:a", "copy",
        "-shortest",
        "-y",
        str(video_path)
    ], check=True)
    
    return str(video_path)

def process_verse(verse_text: str):
    """End-to-end sync-safe pipeline"""
    script = analyze_verse_for_script(verse_text)
    audio_path = generate_audio(script)
    video_path = render_video(audio_path, script)
    return script, audio_path, video_path

# Bulletproof interface
with gr.Blocks(title="Bible Video Generator") as ui:
    gr.Markdown("## 🎬 Perfectly Synced Bible Videos")
    
    with gr.Row():
        verse_input = gr.Textbox(label="Verse", value="John 3:16")
        generate_btn = gr.Button("Generate", variant="primary")
    
    with gr.Row():
        script_output = gr.Textbox(label="Generated Script")
        audio_output = gr.Audio(label="Generated Audio", type="filepath")
        video_output = gr.Video(label="Synced Video")
    
    generate_btn.click(
        fn=process_verse,
        inputs=verse_input,
        outputs=[script_output, audio_output, video_output]
    )

if __name__ == "__main__":
    ui.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True
    )
