#!/usr/bin/env python3
"""
Test script to verify custom voice cloning with Chatterbox
"""

import sys
import os

# Add the chatterbox directory to the path
chatterbox_dir = os.path.join(os.path.dirname(__file__), 'chatterbox')
sys.path.insert(0, chatterbox_dir)

import torchaudio as ta
import torch
from chatterbox.tts import ChatterboxTTS

def test_custom_voice():
    """Test TTS with custom voice"""
    
    # Automatically detect the best available device
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    print(f"Using device: {device}")

    try:
        # Load the model
        print("Loading Chatterbox TTS model...")
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # Test text
        text = "In the beginning was the Word, and the Word was with God, and the Word was God."
        
        # Path to your voice sample
        your_voice_path = os.path.join(chatterbox_dir, "your_voice.wav")
        
        if not os.path.exists(your_voice_path):
            print(f"Error: Voice file not found at {your_voice_path}")
            return False
            
        print(f"Using voice sample from: {your_voice_path}")
        
        # Generate with your voice
        print("Generating speech with your voice...")
        wav = model.generate(text, audio_prompt_path=your_voice_path)
        
        # Save the result
        output_path = os.path.join("output", "test_custom_voice.wav")
        os.makedirs("output", exist_ok=True)
        ta.save(output_path, wav, model.sr)
        
        print(f"Custom voice test completed! Audio saved to: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error during custom voice test: {e}")
        return False

if __name__ == "__main__":
    test_custom_voice()
