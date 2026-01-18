# Voice Cloning with VieNeu-TTS

## Quick Start Guide

VieNeu-TTS allows you to clone any Vietnamese voice with just **3-5 seconds of audio**. This guide will walk you through the complete process from installation to using your cloned voice.

---

## What is Voice Cloning?

Voice cloning extracts the unique characteristics of a voice (pitch, tone, timbre, prosody) from a short audio sample and uses them to synthesize new speech. With VieNeu-TTS, you can:

- Clone your own voice for personalized TTS
- Clone a professional voice actor's voice (with permission)
- Create multiple voices for different contexts
- Get the highest quality Vietnamese TTS available

---

## Installation (5 minutes)

### Step 1: Run the Setup Script

```bash
cd ~/claude-auto-speak
./setup/vieneu-setup.sh
```

This will:
- Create a Python virtual environment
- Install VieNeu-TTS and dependencies
- Download model weights (~500MB)
- Set up voice cloning utilities

**Requirements:**
- macOS or Linux
- Python 3.8 or higher
- ~1GB free disk space

### Step 2: Verify Installation

```bash
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python -c "from vieneu import VieNeuTTS; print('VieNeu-TTS installed successfully')"
deactivate
```

You should see: `VieNeu-TTS installed successfully`

---

## Cloning Your First Voice

### Step 1: Prepare Reference Audio

You need a 3-5 second WAV file of the voice you want to clone.

**Option A: Record Your Own Voice**

Using macOS built-in recorder:
```bash
# Install sox (for recording)
brew install sox

# Record (press Ctrl+C when done)
rec -r 22050 -c 1 my_voice_reference.wav
```

Then speak clearly in Vietnamese for 3-5 seconds:
> "Xin chào, tôi là trợ lý AI của bạn. Hôm nay tôi sẽ giúp bạn với công việc lập trình."

**Option B: Use an Existing Audio File**

If you have an MP3 or other audio format:
```bash
# Install ffmpeg
brew install ffmpeg

# Convert to WAV
ffmpeg -i your_audio.mp3 -ar 22050 -ac 1 reference.wav
```

**Option C: Generate Sample with macOS Voice**

```bash
# Use macOS Vietnamese voice (if available)
say -v "Ting-Ting" -o reference.aiff "Xin chào, tôi là trợ lý AI của bạn"
afconvert reference.aiff reference.wav -d LEI16@22050
```

**Audio Quality Tips:**
- **Clean audio**: Minimal background noise
- **Clear speech**: Natural pronunciation, not robotic
- **Good quality**: 16kHz or 22kHz sample rate
- **Mono channel**: Single channel, not stereo
- **3-5 seconds minimum**: Longer is better (up to 10 seconds)

### Step 2: Clone the Voice

```bash
# Activate virtual environment
source ~/.claude-auto-speak/vieneu/venv/bin/activate

# Clone the voice (replace paths with yours)
python ~/.claude-auto-speak/vieneu/clone-voice.py my_voice_reference.wav my_voice

# Output:
# Cloning voice from: my_voice_reference.wav
# Voice name: my_voice
# ✓ Voice cloned successfully: /Users/yourusername/.claude-auto-speak/vieneu/voices/my_voice.npy

# Deactivate when done
deactivate
```

**Voice naming tips:**
- Use descriptive names: `male_voice`, `female_voice`, `professional_voice`
- No spaces or special characters
- Lowercase recommended

### Step 3: Configure claude-auto-speak

```bash
# Set VieNeu as TTS engine
auto-speak config tts vieneu

# Set your cloned voice
auto-speak config vieneu-voice my_voice

# Optional: Enable multilingual auto-detection
auto-speak config multilingual on
auto-speak config multilingual mode native
```

### Step 4: Test Your Cloned Voice

```bash
# Simple test
echo "Xin chào thế giới" | speak

# Longer test
echo "Tôi là Claude, một trợ lý AI được phát triển bởi Anthropic. Hôm nay tôi sẽ giúp bạn với công việc lập trình." | speak

# Test with auto-speak
auto-speak test
```

**Expected result:** You should hear speech in the cloned voice!

---

## Advanced Usage

### Multiple Cloned Voices

Clone different voices for different contexts:

```bash
source ~/.claude-auto-speak/vieneu/venv/bin/activate

# Clone a professional voice
python ~/.claude-auto-speak/vieneu/clone-voice.py professional.wav professional_voice

# Clone a casual voice
python ~/.claude-auto-speak/vieneu/clone-voice.py casual.wav casual_voice

# Clone a male voice
python ~/.claude-auto-speak/vieneu/clone-voice.py male.wav male_voice

deactivate

# List available voices
ls ~/.claude-auto-speak/vieneu/voices/
# Output: casual_voice.npy  male_voice.npy  my_voice.npy  professional_voice.npy

# Switch between voices
auto-speak config vieneu-voice professional_voice
echo "Đây là giọng chuyên nghiệp" | speak

auto-speak config vieneu-voice casual_voice
echo "Đây là giọng thân mật" | speak
```

### Model Quality vs Speed

VieNeu-TTS offers two model variants:

**vieneu-0.3b (Default - Faster)**
- Speed: ~2 seconds per sentence
- Quality: Good
- Size: ~300MB
- Best for: Real-time applications, quick responses

**vieneu-0.5b (Higher Quality)**
- Speed: ~4 seconds per sentence
- Quality: Excellent
- Size: ~500MB
- Best for: Maximum quality, offline generation

```bash
# Use higher quality model
auto-speak config vieneu-model vieneu-0.5b

# Test quality difference
echo "Xin chào, đây là kiểm tra chất lượng cao" | speak

# Switch back to faster model
auto-speak config vieneu-model vieneu-0.3b
```

### Direct Python API Usage

For advanced control, use the Python API directly:

```bash
source ~/.claude-auto-speak/vieneu/venv/bin/activate

# Generate audio file
python ~/claude-auto-speak/lib/vieneu-tts.py \
  --text "Xin chào thế giới" \
  --voice my_voice \
  --output /tmp/output.wav \
  --model vieneu-0.3b

# Play the audio
afplay /tmp/output.wav

# Batch generate multiple files
for text in "Câu một" "Câu hai" "Câu ba"; do
  python ~/claude-auto-speak/lib/vieneu-tts.py \
    --text "$text" \
    --voice my_voice \
    --output "/tmp/${text// /_}.wav"
done

deactivate
```

---

## Voice Cloning Best Practices

### Reference Audio Quality

**Good Reference Audio:**
- Clear, natural speech
- Minimal background noise
- Consistent volume
- Natural prosody (not reading robotically)
- 22kHz sample rate
- 3-10 seconds duration

**Poor Reference Audio:**
- Music in background
- Multiple speakers
- Phone call quality (8kHz)
- Compressed MP3 with artifacts
- Too short (< 2 seconds)
- Robotic or monotone speech

### Example: Creating High-Quality Reference

```bash
# 1. Record in a quiet room
# 2. Speak naturally, not robotically
# 3. Use a good microphone
# 4. Record 5-10 seconds
# 5. Use proper sample rate

# Record with sox
rec -r 22050 -c 1 -b 16 reference.wav

# Speak this (natural, conversational tone):
# "Xin chào, tôi là trợ lý AI của bạn. Hôm nay tôi sẽ giúp bạn
# với công việc lập trình. Tôi có thể trả lời câu hỏi, viết code,
# và giải thích các khái niệm phức tạp."

# 6. Verify quality
afplay reference.wav

# 7. Clone
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py reference.wav my_voice
deactivate
```

### Improving Voice Quality

If the cloned voice doesn't sound right:

**1. Re-record with better reference audio**
```bash
# Delete old voice
rm ~/.claude-auto-speak/vieneu/voices/my_voice.npy

# Record new reference with better quality
rec -r 22050 -c 1 reference_v2.wav

# Re-clone
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py reference_v2.wav my_voice
deactivate
```

**2. Use higher quality model**
```bash
auto-speak config vieneu-model vieneu-0.5b
```

**3. Increase reference audio duration**
- Instead of 3 seconds, use 10 seconds
- More audio = better voice capture

---

## Troubleshooting

### Issue: "VieNeu-TTS not installed"

**Solution:**
```bash
./setup/vieneu-setup.sh
```

### Issue: "Voice not found: my_voice"

**Cause:** Voice hasn't been cloned yet or was deleted.

**Solution:**
```bash
# List available voices
ls ~/.claude-auto-speak/vieneu/voices/

# Clone the voice
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py reference.wav my_voice
deactivate
```

### Issue: Voice quality is poor

**Possible causes:**
- Low quality reference audio
- Reference audio too short
- Background noise in reference
- Using faster model (vieneu-0.3b)

**Solutions:**
1. Use higher quality reference audio (22kHz, clean, 5-10 seconds)
2. Switch to higher quality model: `auto-speak config vieneu-model vieneu-0.5b`
3. Re-clone with better reference

### Issue: Slow synthesis (> 5 seconds)

**Causes:**
- Using vieneu-0.5b model
- Low CPU/memory
- Other Python processes running

**Solutions:**
```bash
# Use faster model
auto-speak config vieneu-model vieneu-0.3b

# Check system resources
top

# Close other Python applications
```

### Issue: Python version error

**Solution:**
```bash
# Check Python version (requires 3.8+)
python3 --version

# If too old, install newer version
brew install python@3.11

# Recreate virtual environment
rm -rf ~/.claude-auto-speak/vieneu/venv
python3.11 -m venv ~/.claude-auto-speak/vieneu/venv
./setup/vieneu-setup.sh
```

---

## Comparison with Other TTS Engines

| Feature | VieNeu-TTS | eSpeak-NG | Piper | macOS say |
|---------|------------|-----------|-------|-----------|
| **Voice Cloning** | ✓ (3-5s) | ✗ | ✗ | ✗ |
| **Quality** | Excellent | Fair | Good | Good |
| **Speed** | Slow (2-4s) | Instant | Fast (0.5s) | Fast (0.3s) |
| **Vietnamese** | ✓ | ✓ (3 dialects) | Limited | ✗ |
| **Customization** | Full | Parameters | None | None |
| **Installation** | Complex | Simple | Medium | Built-in |
| **Size** | ~500MB | ~30MB | ~60MB | ~0MB |

**When to use VieNeu-TTS:**
- You want the highest quality Vietnamese TTS
- You need a custom voice (your voice or specific voice actor)
- You can accept 2-4 second latency
- You're generating content offline

**When to use eSpeak-NG:**
- You need instant responses
- You need multiple languages beyond Vietnamese
- You have limited disk space
- Quality is less important than speed

**When to use Piper:**
- You need good quality in other languages
- You want faster synthesis than VieNeu
- You don't need voice cloning

---

## Example Workflows

### Workflow 1: Personal Voice Assistant

```bash
# 1. Record your voice
rec -r 22050 -c 1 my_voice_ref.wav
# Speak: "Xin chào, tôi là [your name], trợ lý AI của bạn..."

# 2. Clone your voice
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py my_voice_ref.wav my_personal_voice
deactivate

# 3. Configure
auto-speak config tts vieneu
auto-speak config vieneu-voice my_personal_voice
auto-speak config multilingual on

# 4. Use with Claude Code
auto-speak on

# Now all Claude responses will be spoken in YOUR voice!
```

### Workflow 2: Professional Voiceover

```bash
# 1. Get professional voice sample (with permission)
# professional_sample.wav

# 2. Clone
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py professional_sample.wav pro_voice
deactivate

# 3. Use high quality model
auto-speak config tts vieneu
auto-speak config vieneu-voice pro_voice
auto-speak config vieneu-model vieneu-0.5b

# 4. Generate content
echo "Đây là nội dung chuyên nghiệp với chất lượng cao" | speak
```

### Workflow 3: Multiple Voices for Different Contexts

```bash
# Clone multiple voices
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py casual.wav casual_voice
python ~/.claude-auto-speak/vieneu/clone-voice.py formal.wav formal_voice
python ~/.claude-auto-speak/vieneu/clone-voice.py fun.wav fun_voice
deactivate

# Create aliases for quick switching
alias speak-casual='auto-speak config vieneu-voice casual_voice'
alias speak-formal='auto-speak config vieneu-voice formal_voice'
alias speak-fun='auto-speak config vieneu-voice fun_voice'

# Use
speak-casual
echo "Này, có chuyện gì đây?" | speak

speak-formal
echo "Kính gửi quý vị, tôi xin trình bày..." | speak

speak-fun
echo "Wow, quá tuyệt vời!" | speak
```

---

## FAQ

**Q: How much audio do I need to clone a voice?**
A: Minimum 3 seconds, recommended 5-10 seconds. More is better up to about 10 seconds.

**Q: Can I use music or songs as reference?**
A: No, use clean speech only. Music will result in poor quality clones.

**Q: Does it work with English?**
A: No, VieNeu-TTS only supports Vietnamese. For English, use macOS say, Piper, or eSpeak-NG.

**Q: Can I clone famous voices?**
A: Technically yes, but ensure you have permission. Don't use for commercial purposes without authorization.

**Q: How many voices can I clone?**
A: Unlimited. Each voice is ~1KB (just the embedding file).

**Q: Can I share my cloned voice?**
A: Yes, the .npy file can be shared. Just copy it to `~/.claude-auto-speak/vieneu/voices/` on another machine.

**Q: Is internet required?**
A: No, after installation everything runs offline.

**Q: What if I want to delete all cloned voices?**
```bash
rm -rf ~/.claude-auto-speak/vieneu/voices/*
```

**Q: Can I use this for commercial projects?**
A: Check VieNeu-TTS license. Generally OK for personal use, commercial use may require permission.

---

## Next Steps

1. **Clone your first voice** using this guide
2. **Experiment with different reference audio** to find the best quality
3. **Try both model variants** (vieneu-0.3b vs vieneu-0.5b) to find your preference
4. **Create multiple voices** for different contexts
5. **Integrate with Claude Code** for personalized AI assistant

For more information:
- **Full Installation Guide**: See `INSTALL.md`
- **VieNeu-TTS Repository**: https://github.com/pnnbao97/VieNeu-TTS
- **Report Issues**: https://github.com/anthropics/claude-code/issues

---

Happy voice cloning! 🎙️
