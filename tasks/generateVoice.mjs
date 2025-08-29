// 🔊 Voice Generator - Creates AI narration from scripts
// Uses Chatterbox TTS (local Python library) as primary method

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import FormData from 'form-data';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

export async function generateVoice(scriptData) {
  const { script, scriptPath } = scriptData;
  const outputDir = path.join(process.cwd(), 'output');
  await fs.ensureDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const audioPath = path.join(outputDir, `narration_${timestamp}.wav`);
  
  // Try Chatterbox Python library first (primary method)
  try {
    console.log('🔊 Using Chatterbox Python library...');
    console.log('⏳ This may take 5-15 minutes for AI voice generation on laptop...');
    const result = await generateWithChatterboxPython(script, audioPath);
    if (result) return result;
  } catch (error) {
    console.log('❌ Chatterbox Python failed:', error.message);
  }
  
  // Fallback to Chatterbox HTTP server if running
  if (process.env.CHATTERBOX_URL) {
    try {
      console.log('🔊 Trying Chatterbox HTTP server...');
      const result = await generateWithChatterboxHTTP(script, audioPath);
      if (result) return result;
    } catch (error) {
      console.log('❌ Chatterbox HTTP server failed:', error.message);
    }
  }
  
  // Final fallback to ElevenLabs if available
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      console.log('🔊 Falling back to ElevenLabs...');
      return await generateWithElevenLabs(script, audioPath);
    } catch (error) {
      console.error('❌ ElevenLabs failed:', error);
    }
  }
  
  // Create placeholder if all methods fail
  console.log('⚠️  No voice generation available, creating placeholder');
  return createPlaceholderAudio(audioPath);
}

async function generateWithChatterboxPython(script, audioPath) {
  try {
    // Check script length and use chunking for longer texts
    const MAX_CHUNK_SIZE = 200; // Maximum characters per chunk
    
    if (script.length <= MAX_CHUNK_SIZE) {
      console.log(`📝 Script is ${script.length} chars - processing as single chunk`);
      return await generateSingleChunk(script, audioPath);
    } else {
      console.log(`📝 Script is ${script.length} chars - using chunking approach`);
      return await generateChunkedScript(script, audioPath);
    }
    
  } catch (error) {
    console.error('❌ Chatterbox Python error:', error.message);
    throw error;
  }
}

async function generateSingleChunk(script, audioPath) {
  try {
    // Create a temporary Python script to run Chatterbox
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    
    const pythonScript = `
import sys
import os
sys.path.append('${path.join(process.cwd(), 'chatterbox', 'src').replace(/\\/g, '\\\\')}')

import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

def generate_speech():
    try:
        # Load model with CPU (more compatible)
        model = ChatterboxTTS.from_pretrained(device="cpu")
        
        # Generate audio with custom voice
        text = """${script.replace(/"/g, '\\"')}"""
        
        # Path to custom voice sample from environment variable
        custom_voice_env = "${process.env.CHATTERBOX_CUSTOM_VOICE_PATH || ''}"
        if custom_voice_env:
            voice_path = os.path.join("${process.cwd().replace(/\\/g, '\\\\')}", custom_voice_env.replace('./', ''))
        else:
            voice_path = "${path.join(process.cwd(), 'chatterbox', 'your_voice.wav').replace(/\\/g, '\\\\')}"
        
        # Check if custom voice exists, use it if available
        if os.path.exists(voice_path):
            print(f"Using custom voice: {voice_path}")
            wav = model.generate(text, audio_prompt_path=voice_path)
        else:
            print("Custom voice not found, using default voice")
            wav = model.generate(text)
        
        # Save audio
        output_path = "${audioPath.replace(/\\/g, '\\\\')}"
        ta.save(output_path, wav, model.sr)
        
        print(f"SUCCESS:{model.sr}:{len(wav[0]) / model.sr:.2f}")
        
    except Exception as e:
        print(f"ERROR:{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    generate_speech()
`;
    
    const scriptPath = path.join(tempDir, `chatterbox_gen_${Date.now()}.py`);
    await fs.writeFile(scriptPath, pythonScript);
    
    // Get Python executable path
    const pythonExe = "C:/Users/mrtig/Desktop/Bible Shorts AutoUploader/.venv/Scripts/python.exe";
    
    // Run the Python script
    const result = await runPythonScript(pythonExe, scriptPath);
    
    // Cleanup
    await fs.remove(scriptPath);
    
    if (result.success) {
      console.log('✅ Voice generated with Chatterbox Python');
      console.log('💾 Saved to:', audioPath);
      
      return {
        audioPath,
        duration: result.duration,
        sampleRate: result.sampleRate,
        method: 'chatterbox-python'
      };
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Chatterbox Python error:', error.message);
    throw error;
  }
}

async function generateChunkedScript(script, audioPath) {
  try {
    // Split script into sentences
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 <= 200) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    console.log(`📝 Split into ${chunks.length} chunks:`);
    chunks.forEach((chunk, i) => console.log(`   ${i + 1}: "${chunk.substring(0, 50)}..."`));
    
    // Generate audio for each chunk
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    const chunkFiles = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔊 Processing chunk ${i + 1}/${chunks.length}...`);
      
      const chunkPath = path.join(tempDir, `chunk_${Date.now()}_${i}.wav`);
      await generateSingleChunk(chunks[i], chunkPath);
      chunkFiles.push(chunkPath);
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Concatenate audio files using FFmpeg
    console.log('🔗 Concatenating audio chunks...');
    await concatenateAudioFiles(chunkFiles, audioPath);
    
    // Cleanup chunk files
    for (const chunkFile of chunkFiles) {
      await fs.remove(chunkFile);
    }
    
    // Get audio info
    const duration = await getAudioDuration(audioPath);
    
    // Remove silence and get final duration
    const cleanedPath = await removeSilenceFromAudio(audioPath);
    const finalDuration = await getAudioDuration(cleanedPath);
    
    console.log('✅ Chunked voice generation complete');
    console.log('💾 Saved to:', cleanedPath);
    
    return {
      audioPath: cleanedPath,
      duration: finalDuration,
      sampleRate: 24000, // Chatterbox default
      method: 'chatterbox-python-chunked'
    };
    
  } catch (error) {
    console.error('❌ Chunked generation failed:', error.message);
    throw error;
  }
}

function runPythonScript(pythonExe, scriptPath) {
  return new Promise((resolve, reject) => {
    // Create the command string with proper quoting
    const command = `"${pythonExe}" "${scriptPath}"`;
    
    const process = spawn(command, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0 && stdout.includes('SUCCESS:')) {
        const parts = stdout.trim().split('\n').find(line => line.startsWith('SUCCESS:')).split(':');
        resolve({
          success: true,
          sampleRate: parseInt(parts[1]),
          duration: parseFloat(parts[2])
        });
      } else {
        const error = stderr || stdout || `Process exited with code ${code}`;
        resolve({
          success: false,
          error: error
        });
      }
    });
    
    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    // Set timeout - Chatterbox can take 5-15 minutes on laptop hardware
    setTimeout(() => {
      process.kill();
      resolve({
        success: false,
        error: 'Python script timeout (15 minutes)'
      });
    }, 900000); // 15 minutes timeout
  });
}

async function generateWithChatterboxHTTP(script, audioPath) {
  try {
    console.log('🔊 Generating voice with Chatterbox HTTP...');
    
    const response = await axios.post(`${process.env.CHATTERBOX_URL}/synthesize`, {
      text: script,
      voice: process.env.CHATTERBOX_VOICE || 'default',
      speed: 1.0,
      pitch: 1.0
    }, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    await fs.writeFile(audioPath, response.data);
    
    console.log('✅ Voice generated with Chatterbox HTTP');
    console.log('💾 Saved to:', audioPath);
    
    return {
      audioPath,
      duration: await getAudioDuration(audioPath),
      method: 'chatterbox-http'
    };
    
  } catch (error) {
    console.error('❌ Chatterbox HTTP error:', error.message);
    throw error;
  }
}

async function generateWithElevenLabs(script, audioPath) {
  try {
    console.log('🔊 Generating voice with ElevenLabs...');
    
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: script,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    
    // Convert MP3 to WAV if needed
    const tempMp3Path = audioPath.replace('.wav', '.mp3');
    await fs.writeFile(tempMp3Path, response.data);
    
    // Use ffmpeg to convert to WAV (optional, depends on your setup)
    try {
      await convertAudioFormat(tempMp3Path, audioPath);
      await fs.remove(tempMp3Path);
    } catch {
      // If conversion fails, just use the MP3
      await fs.move(tempMp3Path, audioPath.replace('.wav', '.mp3'));
      audioPath = audioPath.replace('.wav', '.mp3');
    }
    
    console.log('✅ Voice generated with ElevenLabs');
    console.log('💾 Saved to:', audioPath);
    
    return {
      audioPath,
      duration: await getAudioDuration(audioPath),
      method: 'elevenlabs'
    };
    
  } catch (error) {
    console.error('❌ ElevenLabs error:', error.response?.data || error.message);
    throw error;
  }
}

async function convertAudioFormat(inputPath, outputPath) {
  // This would use ffmpeg to convert audio formats
  // For now, we'll skip this step
  console.log('📄 Audio format conversion skipped');
}

async function removeSilenceFromAudio(audioPath) {
  try {
    const [{ default: ffmpeg }, { default: ffmpegStatic }] = await Promise.all([
      import('fluent-ffmpeg'),
      import('ffmpeg-static')
    ]);
    
    ffmpeg.setFfmpegPath(ffmpegStatic);
    
    const outputPath = audioPath.replace('.wav', '_clean.wav');
    
    return new Promise((resolve, reject) => {
      console.log('🔇 Removing silence from audio...');
      
      ffmpeg()
        .input(audioPath)
        .audioFilters([
          // Remove silence from start and end
          'silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB:detection=peak',
          'areverse',
          'silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB:detection=peak',
          'areverse'
        ])
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(24000)
        .output(outputPath)
        .on('end', () => {
          console.log('✅ Silence removal complete');
          // Replace original file
          fs.remove(audioPath)
            .then(() => fs.move(outputPath, audioPath))
            .then(() => resolve(audioPath))
            .catch(err => {
              console.log('⚠️  File replacement failed, using cleaned version:', err.message);
              resolve(outputPath); // Return cleaned version if move fails
            });
        })
        .on('error', (err) => {
          console.log('⚠️  Silence removal failed, using original:', err.message);
          resolve(audioPath); // Return original if cleanup fails
        })
        .run();
    });
  } catch (error) {
    console.log('⚠️  Silence removal not available, using original audio');
    return audioPath;
  }
}

async function getAudioDuration(audioPath) {
  // Try to get actual duration using FFprobe
  try {
    const [{ default: ffmpeg }, { default: ffmpegStatic }] = await Promise.all([
      import('fluent-ffmpeg'),
      import('ffmpeg-static')
    ]);
    
    ffmpeg.setFfmpegPath(ffmpegStatic);
    
    return new Promise((resolve) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err || !metadata.format.duration) {
          console.log('⚠️  FFprobe failed, using file size estimation');
          // Fallback to file size estimation
          fs.stat(audioPath)
            .then(stats => {
              // WAV files at 24kHz mono: approximately 68KB per second
              const estimatedDuration = Math.max(10, Math.min(60, stats.size / 68000));
              console.log(`📊 Estimated duration: ${estimatedDuration.toFixed(1)}s (${(stats.size/1024/1024).toFixed(1)}MB)`);
              resolve(estimatedDuration);
            })
            .catch(() => {
              console.log('⚠️  File size check failed, using 30s default');
              resolve(30);
            });
        } else {
          const duration = parseFloat(metadata.format.duration);
          console.log(`📊 Actual audio duration: ${duration.toFixed(1)}s`);
          resolve(duration);
        }
      });
    });
  } catch (error) {
    console.log('⚠️  FFmpeg not available, using file size estimation');
    try {
      const stats = await fs.stat(audioPath);
      // WAV files at 24kHz mono: approximately 68KB per second
      const estimatedDuration = Math.max(10, Math.min(60, stats.size / 68000));
      console.log(`📊 Estimated duration: ${estimatedDuration.toFixed(1)}s (${(stats.size/1024/1024).toFixed(1)}MB)`);
      return estimatedDuration;
    } catch {
      console.log('⚠️  All duration detection failed, using 30s default');
      return 30;
    }
  }
}

function createPlaceholderAudio(audioPath) {
  console.log('🔇 Creating placeholder audio file...');
  
  // Create an empty WAV file header for a 30-second silent audio
  const sampleRate = 44100;
  const duration = 30;
  const numSamples = sampleRate * duration;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Silent audio data (all zeros)
  buffer.fill(0, 44);
  
  fs.writeFileSync(audioPath, buffer);
  
  console.log('✅ Placeholder audio created');
  console.log('💾 Saved to:', audioPath);
  
  return {
    audioPath,
    duration: 30,
    method: 'placeholder'
  };
}

// Voice cloning function for Chatterbox
export async function cloneVoice(audioSamplePath, voiceName) {
  if (!process.env.CHATTERBOX_URL) {
    throw new Error('Chatterbox URL not configured');
  }
  
  try {
    console.log('🎤 Cloning voice with Chatterbox...');
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioSamplePath));
    formData.append('name', voiceName);
    
    const response = await axios.post(
      `${process.env.CHATTERBOX_URL}/clone`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000
      }
    );
    
    console.log('✅ Voice cloned successfully:', response.data);
    return response.data.voice_id;
    
  } catch (error) {
    console.error('❌ Voice cloning error:', error);
    throw error;
  }
}

async function concatenateAudioFiles(inputFiles, outputPath) {
  return new Promise((resolve, reject) => {
    // Import fluent-ffmpeg and ffmpeg-static
    Promise.all([
      import('fluent-ffmpeg'),
      import('ffmpeg-static')
    ]).then(([{ default: ffmpeg }, { default: ffmpegStatic }]) => {
      // Set FFmpeg path
      ffmpeg.setFfmpegPath(ffmpegStatic);
      
      // Create FFmpeg command for concatenation
      const command = ffmpeg();
      
      // Add all input files
      inputFiles.forEach(file => {
        command.addInput(file);
      });
      
      // Configure output
      command
        .audioCodec('pcm_s16le') // Standard WAV format
        .audioChannels(1) // Mono
        .audioFrequency(24000) // Chatterbox sample rate
        .complexFilter(`concat=n=${inputFiles.length}:v=0:a=1[outa]`)
        .map('[outa]')
        .format('wav')
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🔗 FFmpeg concat command:', commandLine);
        })
        .on('end', () => {
          console.log('✅ Audio concatenation complete');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Audio concatenation failed:', err);
          reject(err);
        })
        .run();
    }).catch(reject);
  });
}

// For testing purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔊 Testing Voice Generator...');
  const testScript = {
    script: "Ever feel like you're not enough? John 3:16 says God so loved the world that he gave his one and only Son. That includes you. You are loved, you are chosen, you are enough.",
    scriptPath: './test_script.txt'
  };
  
  const result = await generateVoice(testScript);
  console.log('Generated voice:', result);
}
