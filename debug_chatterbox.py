#!/usr/bin/env python3
import sys
import os
import time

# Add the chatterbox src directory to path
sys.path.append(r'C:\Users\mrtig\Desktop\Bible Shorts AutoUploader\chatterbox\src')

print("Starting Python script...")
print("Python path added")

try:
    print("Importing torchaudio...")
    import torchaudio as ta
    print("torchaudio imported successfully")
    
    print("Importing Chatterbox...")
    from chatterbox.tts import ChatterboxTTS
    print("Chatterbox imported successfully")
    
    print("Loading model...")
    start_time = time.time()
    model = ChatterboxTTS.from_pretrained(device="cpu")
    load_time = time.time() - start_time
    print(f"Model loaded in {load_time:.2f} seconds")
    
    print("Generating speech...")
    text = "This is a test of the Chatterbox TTS system."
    start_time = time.time()
    wav = model.generate(text)
    gen_time = time.time() - start_time
    print(f"Speech generated in {gen_time:.2f} seconds")
    
    output_path = r"C:\Users\mrtig\Desktop\Bible Shorts AutoUploader\output\debug_test.wav"
    ta.save(output_path, wav, model.sr)
    
    print(f"SUCCESS:{model.sr}:{len(wav[0]) / model.sr:.2f}")
    
except Exception as e:
    print(f"ERROR:{str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
