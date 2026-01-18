# Voice Model Installation Guide

This guide provides instructions for installing new Piper TTS voice models for claude-auto-speak. Use this when you need to add support for additional languages or voices.

## Table of Contents

- [Overview](#overview)
- [Available Voice Models](#available-voice-models)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

Claude Auto-Speak uses [Piper](https://github.com/rhasspy/piper) for high-quality neural text-to-speech. Piper supports 40+ languages with multiple voices per language.

**Voice Model Files:**
- `.onnx` - The neural network model file
- `.onnx.json` - Model configuration (phoneme mapping, speaker info)

**Installation Location:**
```
~/.local/share/piper-voices/
```

---

## Available Voice Models

### Currently Installed Languages

- **English (en_US)**: `en_US-lessac-medium`
- **Vietnamese (vi_VN)**: `vi_VN-vivos-medium`
- **Chinese (zh_CN)**: `zh_CN-huayan-medium`

### Finding New Voice Models

All available Piper voices are hosted on Hugging Face:

**Base URL:**
```
https://huggingface.co/rhasspy/piper-voices/tree/main
```

**Browse by Language:**
- English: `https://huggingface.co/rhasspy/piper-voices/tree/main/en`
- Spanish: `https://huggingface.co/rhasspy/piper-voices/tree/main/es`
- French: `https://huggingface.co/rhasspy/piper-voices/tree/main/fr`
- German: `https://huggingface.co/rhasspy/piper-voices/tree/main/de`
- Japanese: `https://huggingface.co/rhasspy/piper-voices/tree/main/ja`
- Korean: `https://huggingface.co/rhasspy/piper-voices/tree/main/ko`
- Russian: `https://huggingface.co/rhasspy/piper-voices/tree/main/ru`
- Portuguese: `https://huggingface.co/rhasspy/piper-voices/tree/main/pt`
- Italian: `https://huggingface.co/rhasspy/piper-voices/tree/main/it`
- Dutch: `https://huggingface.co/rhasspy/piper-voices/tree/main/nl`
- Polish: `https://huggingface.co/rhasspy/piper-voices/tree/main/pl`
- Turkish: `https://huggingface.co/rhasspy/piper-voices/tree/main/tr`
- Arabic: `https://huggingface.co/rhasspy/piper-voices/tree/main/ar`
- Hindi: `https://huggingface.co/rhasspy/piper-voices/tree/main/hi`

**Voice Quality Levels:**
- `x-low` - Fastest, lowest quality (~10MB)
- `low` - Fast, reasonable quality (~20MB)
- `medium` - Balanced quality/speed (~40MB) ⭐ **Recommended**
- `high` - Best quality, slower (~80MB)

---

## Installation Methods

### Method 1: Manual Installation (Recommended for Agents)

This method gives you full control over which voices to install.

#### Step 1: Identify the Voice

Visit the Hugging Face repository and navigate to your desired language. For example, for Japanese:

```
https://huggingface.co/rhasspy/piper-voices/tree/main/ja/ja_JP
```

Choose a voice and quality level. Example: `ja_JP-qbo-medium`

#### Step 2: Download the Voice Files

```bash
# Set voice directory
VOICE_DIR="${HOME}/.local/share/piper-voices"
mkdir -p "$VOICE_DIR"

# Define voice name (example: Japanese)
VOICE_NAME="ja_JP-qbo-medium"

# Download model file (.onnx)
curl -L -o "$VOICE_DIR/${VOICE_NAME}.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/${VOICE_NAME}.onnx"

# Download config file (.onnx.json)
curl -L -o "$VOICE_DIR/${VOICE_NAME}.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/${VOICE_NAME}.onnx.json"
```

**URL Pattern:**
```
https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang}/{locale}/{speaker}/{quality}/{voice_name}.{ext}
```

Where:
- `{lang}` = Two-letter language code (e.g., `ja`, `es`, `fr`)
- `{locale}` = Full locale (e.g., `ja_JP`, `es_ES`, `fr_FR`)
- `{speaker}` = Voice/speaker name (e.g., `qbo`, `lessac`, `vivos`)
- `{quality}` = Quality level (`low`, `medium`, `high`)
- `{voice_name}` = Full voice identifier (e.g., `ja_JP-qbo-medium`)
- `{ext}` = File extension (`onnx` or `onnx.json`)

#### Step 3: Verify Installation

```bash
ls -lh "$VOICE_DIR/${VOICE_NAME}."*
```

Expected output:
```
-rw-r--r-- 1 user staff  42M Jan 18 10:00 ja_JP-qbo-medium.onnx
-rw-r--r-- 1 user staff 1.2K Jan 18 10:00 ja_JP-qbo-medium.onnx.json
```

### Method 2: Using a Setup Script

Create a reusable setup script for a specific language.

**Example: Japanese Voice Installation Script**

```bash
#!/usr/bin/env bash
# setup/japanese-piper-setup.sh

set -e

VOICE_DIR="${HOME}/.local/share/piper-voices"
mkdir -p "$VOICE_DIR"

echo "Installing Japanese voice (ja_JP-qbo-medium)..."

if [[ -f "$VOICE_DIR/ja_JP-qbo-medium.onnx" ]]; then
  echo "✓ Japanese voice already installed (skipping)"
else
  curl -# -L -o "$VOICE_DIR/ja_JP-qbo-medium.onnx" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/ja_JP-qbo-medium.onnx"

  curl -# -L -o "$VOICE_DIR/ja_JP-qbo-medium.onnx.json" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/ja_JP-qbo-medium.onnx.json"

  echo "✓ Japanese voice installed"
fi

echo ""
echo "To use this voice:"
echo "  auto-speak config multilingual on"
echo "  echo 'こんにちは' | speak"
```

Make it executable:
```bash
chmod +x setup/japanese-piper-setup.sh
./setup/japanese-piper-setup.sh
```

### Method 3: Batch Installation

Install multiple voices at once:

```bash
#!/usr/bin/env bash
# setup/multi-voice-setup.sh

VOICE_DIR="${HOME}/.local/share/piper-voices"
mkdir -p "$VOICE_DIR"

# Define voices to install (format: "lang/locale/speaker/quality/voice_name")
VOICES=(
  "ja/ja_JP/qbo/medium/ja_JP-qbo-medium"
  "ko/ko_KR/kss/medium/ko_KR-kss-medium"
  "es/es_ES/davefx/medium/es_ES-davefx-medium"
  "fr/fr_FR/siwis/medium/fr_FR-siwis-medium"
)

for voice_path in "${VOICES[@]}"; do
  voice_name=$(basename "$voice_path")

  if [[ -f "$VOICE_DIR/${voice_name}.onnx" ]]; then
    echo "✓ $voice_name already installed"
    continue
  fi

  echo "📥 Downloading $voice_name..."

  curl -# -L -o "$VOICE_DIR/${voice_name}.onnx" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/${voice_path}.onnx"

  curl -# -L -o "$VOICE_DIR/${voice_name}.onnx.json" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/${voice_path}.onnx.json"

  echo "✓ $voice_name installed"
done

echo ""
echo "All voices installed successfully!"
```

---

## Configuration

After installing a new voice model, update the configuration to use it.

### Step 1: Add Language to Config

Edit `lib/language-voice-mapper.mjs` to add your new language:

```javascript
export const PIPER_VOICES = {
  en: 'en_US-lessac-medium',
  vi: 'vi_VN-vivos-medium',
  zh: 'zh_CN-huayan-medium',
  ja: 'ja_JP-qbo-medium',        // Add Japanese
  ko: 'ko_KR-kss-medium',        // Add Korean
  es: 'es_ES-davefx-medium',     // Add Spanish
};
```

### Step 2: Add Language Code Mapping

Update the `FRANC_TO_ISO` mapping in `lib/language-voice-mapper.mjs`:

```javascript
const FRANC_TO_ISO = {
  eng: 'en',  // English
  vie: 'vi',  // Vietnamese
  cmn: 'zh',  // Chinese (Mandarin)
  zho: 'zh',  // Chinese
  jpn: 'ja',  // Japanese
  kor: 'ko',  // Korean
  spa: 'es',  // Spanish
  fra: 'fr',  // French
  deu: 'de',  // German
  rus: 'ru',  // Russian
  por: 'pt',  // Portuguese
  ita: 'it',  // Italian
  nld: 'nl',  // Dutch
  pol: 'pl',  // Polish
  tur: 'tr',  // Turkish
  ara: 'ar',  // Arabic
  hin: 'hi',  // Hindi
};
```

**Finding Language Codes:**
- ISO 639-1 (2-letter): Used for config and display
- ISO 639-3 (3-letter): Used by franc language detection library
- Reference: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

### Step 3: Update Translator Module (Optional)

If you want translation support for the new language, update `lib/translator.mjs`:

```javascript
const LANGUAGE_NAMES = {
  vi: 'Vietnamese',
  zh: 'Chinese',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
};
```

### Step 4: Update Default Config (Optional)

Add default voice mapping in `lib/config.mjs`:

```javascript
multilingual: {
  enabled: false,
  mode: "native",
  targetLanguage: null,
  autoDetect: true,
  voiceByLanguage: {
    en: "en_US-lessac-medium",
    vi: "vi_VN-vivos-medium",
    zh: "zh_CN-huayan-medium",
    ja: "ja_JP-qbo-medium",
    ko: "ko_KR-kss-medium",
    es: "es_ES-davefx-medium",
  },
},
```

### Step 5: Update CLI Help (Optional)

Update `bin/auto-speak` to reflect new supported languages:

```javascript
// In cmdConfig function, multilingual language section:
if (!lang || !["vi", "zh", "ja", "ko", "es"].includes(lang)) {
  console.error(colors.red("Invalid language. Supported: vi, zh, ja, ko, es"));
  return;
}
```

---

## Testing

### Test 1: Direct Voice Test

Test the voice model directly with Piper:

```bash
# Set voice path
VOICE_PATH="${HOME}/.local/share/piper-voices/ja_JP-qbo-medium.onnx"
PIPER_BIN="${HOME}/.local/bin/piper"

# Generate test audio
echo "こんにちは、世界" | "$PIPER_BIN" --model "$VOICE_PATH" --output_file /tmp/test.wav

# Play audio (macOS)
afplay /tmp/test.wav

# Clean up
rm /tmp/test.wav
```

### Test 2: Test with speak Command

```bash
# Enable multilingual mode
auto-speak config multilingual on
auto-speak config multilingual mode native

# Test Japanese
echo "こんにちは、世界" | speak

# Test Korean
echo "안녕하세요" | speak

# Test Spanish
echo "Hola mundo" | speak
```

### Test 3: Test Language Detection

```bash
# Create test script
cat > /tmp/test-detection.mjs << 'EOF'
import { detectLanguage } from './lib/language-voice-mapper.mjs';

const tests = [
  { text: "Hello world", expected: "en" },
  { text: "Xin chào thế giới", expected: "vi" },
  { text: "你好世界", expected: "zh" },
  { text: "こんにちは、世界", expected: "ja" },
  { text: "안녕하세요", expected: "ko" },
  { text: "Hola mundo", expected: "es" },
];

tests.forEach(({ text, expected }) => {
  const detected = detectLanguage(text);
  const status = detected === expected ? "✓" : "✗";
  console.log(`${status} "${text}" -> ${detected} (expected: ${expected})`);
});
EOF

# Run test
node /tmp/test-detection.mjs

# Clean up
rm /tmp/test-detection.mjs
```

### Test 4: Test Translation Mode

```bash
# Install translation model if not already installed
ollama pull gemma2:9b

# Enable translation mode
auto-speak config multilingual mode translate
auto-speak config multilingual language ja

# Test: English input should be translated to Japanese
echo "Hello, how are you today?" | speak
```

---

## Troubleshooting

### Issue: Voice file not found

**Symptoms:**
```
Error: Piper voice model not found
```

**Solution:**
1. Verify files exist:
   ```bash
   ls -la ~/.local/share/piper-voices/
   ```

2. Check file permissions:
   ```bash
   chmod 644 ~/.local/share/piper-voices/*.onnx*
   ```

3. Re-download if corrupted:
   ```bash
   rm ~/.local/share/piper-voices/ja_JP-qbo-medium.*
   # Re-run installation
   ```

### Issue: Language not detected correctly

**Symptoms:**
- Vietnamese text spoken with English voice
- Chinese text spoken with English voice

**Solution:**
1. Check text length (minimum 20 characters for reliable detection):
   ```bash
   # Too short (may fail)
   echo "你好" | speak

   # Better (more context)
   echo "你好世界，这是一个测试" | speak
   ```

2. Verify language mapping in `lib/language-voice-mapper.mjs`

3. Test detection manually:
   ```bash
   node -e "import { detectLanguage } from './lib/language-voice-mapper.mjs'; console.log(detectLanguage('你好世界'));"
   ```

### Issue: Voice sounds distorted or corrupted

**Symptoms:**
- Crackling or garbled audio
- Incomplete playback

**Solution:**
1. Re-download the voice files (may be corrupted):
   ```bash
   rm ~/.local/share/piper-voices/ja_JP-qbo-medium.*
   # Re-run installation script
   ```

2. Try a different quality level (medium → low or high)

3. Verify file sizes match expected values:
   ```bash
   # Medium quality voices are typically 30-50MB
   ls -lh ~/.local/share/piper-voices/*.onnx
   ```

### Issue: Translation not working

**Symptoms:**
- Text not translated before TTS
- English text spoken with foreign voice

**Solution:**
1. Verify Ollama is running:
   ```bash
   ollama list
   ```

2. Check translation model is installed:
   ```bash
   ollama pull gemma2:9b
   ```

3. Test Ollama manually:
   ```bash
   ollama run gemma2:9b "Translate to Japanese: Hello world"
   ```

4. Check logs:
   ```bash
   auto-speak logs
   tail -20 ~/.claude-auto-speak/auto-speak.log
   ```

### Issue: Permission denied errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix directory permissions
chmod 755 ~/.local/share/piper-voices
chmod 644 ~/.local/share/piper-voices/*.onnx*

# Ensure you own the files
chown -R $(whoami) ~/.local/share/piper-voices
```

---

## Quick Reference: Common Languages

### Japanese

```bash
# Install
VOICE_DIR="${HOME}/.local/share/piper-voices"
curl -L -o "$VOICE_DIR/ja_JP-qbo-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/ja_JP-qbo-medium.onnx"
curl -L -o "$VOICE_DIR/ja_JP-qbo-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/qbo/medium/ja_JP-qbo-medium.onnx.json"

# Configure
# Add to lib/language-voice-mapper.mjs:
# ja: 'ja_JP-qbo-medium'
# jpn: 'ja' (in FRANC_TO_ISO)

# Test
echo "こんにちは、世界" | speak
```

### Korean

```bash
# Install
VOICE_DIR="${HOME}/.local/share/piper-voices"
curl -L -o "$VOICE_DIR/ko_KR-kss-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx"
curl -L -o "$VOICE_DIR/ko_KR-kss-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx.json"

# Configure
# Add to lib/language-voice-mapper.mjs:
# ko: 'ko_KR-kss-medium'
# kor: 'ko' (in FRANC_TO_ISO)

# Test
echo "안녕하세요" | speak
```

### Spanish

```bash
# Install
VOICE_DIR="${HOME}/.local/share/piper-voices"
curl -L -o "$VOICE_DIR/es_ES-davefx-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx"
curl -L -o "$VOICE_DIR/es_ES-davefx-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json"

# Configure
# Add to lib/language-voice-mapper.mjs:
# es: 'es_ES-davefx-medium'
# spa: 'es' (in FRANC_TO_ISO)

# Test
echo "Hola mundo" | speak
```

### French

```bash
# Install
VOICE_DIR="${HOME}/.local/share/piper-voices"
curl -L -o "$VOICE_DIR/fr_FR-siwis-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx"
curl -L -o "$VOICE_DIR/fr_FR-siwis-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json"

# Configure
# Add to lib/language-voice-mapper.mjs:
# fr: 'fr_FR-siwis-medium'
# fra: 'fr' (in FRANC_TO_ISO)

# Test
echo "Bonjour le monde" | speak
```

### German

```bash
# Install
VOICE_DIR="${HOME}/.local/share/piper-voices"
curl -L -o "$VOICE_DIR/de_DE-thorsten-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx"
curl -L -o "$VOICE_DIR/de_DE-thorsten-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json"

# Configure
# Add to lib/language-voice-mapper.mjs:
# de: 'de_DE-thorsten-medium'
# deu: 'de' (in FRANC_TO_ISO)

# Test
echo "Hallo Welt" | speak
```

---

## Advanced: Creating Your Own Voice Installation Tool

For agents that need to install voices programmatically:

```javascript
#!/usr/bin/env node
// install-voice.mjs

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const VOICE_DIR = join(homedir(), '.local/share/piper-voices');

async function installVoice(lang, locale, speaker, quality = 'medium') {
  const voiceName = `${locale}-${speaker}-${quality}`;
  const baseUrl = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${lang}/${locale}/${speaker}/${quality}`;

  console.log(`Installing ${voiceName}...`);

  // Check if already installed
  if (existsSync(join(VOICE_DIR, `${voiceName}.onnx`))) {
    console.log(`✓ ${voiceName} already installed`);
    return;
  }

  // Download files
  try {
    execSync(`curl -L -o "${VOICE_DIR}/${voiceName}.onnx" "${baseUrl}/${voiceName}.onnx"`, {
      stdio: 'inherit'
    });

    execSync(`curl -L -o "${VOICE_DIR}/${voiceName}.onnx.json" "${baseUrl}/${voiceName}.onnx.json"`, {
      stdio: 'inherit'
    });

    console.log(`✓ ${voiceName} installed successfully`);
  } catch (error) {
    console.error(`✗ Failed to install ${voiceName}:`, error.message);
    process.exit(1);
  }
}

// Usage: node install-voice.mjs ja ja_JP qbo medium
const [lang, locale, speaker, quality] = process.argv.slice(2);

if (!lang || !locale || !speaker) {
  console.error('Usage: node install-voice.mjs <lang> <locale> <speaker> [quality]');
  console.error('Example: node install-voice.mjs ja ja_JP qbo medium');
  process.exit(1);
}

installVoice(lang, locale, speaker, quality);
```

Usage:
```bash
# Install Japanese voice
node install-voice.mjs ja ja_JP qbo medium

# Install Korean voice
node install-voice.mjs ko ko_KR kss medium

# Install Spanish voice
node install-voice.mjs es es_ES davefx medium
```

---

## Resources

- **Piper TTS Repository**: https://github.com/rhasspy/piper
- **Voice Model Repository**: https://huggingface.co/rhasspy/piper-voices
- **Supported Languages**: https://github.com/rhasspy/piper/blob/master/LANGUAGES.md
- **Language Detection (franc)**: https://github.com/wooorm/franc
- **ISO 639 Language Codes**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

---

## Notes for AI Agents

When installing new voice models:

1. **Always check if files already exist** before downloading to avoid unnecessary downloads
2. **Verify file integrity** by checking file sizes (corrupted downloads will be smaller)
3. **Update all configuration files** in the correct order:
   - `lib/language-voice-mapper.mjs` (add voice mapping)
   - `lib/translator.mjs` (add language name for translation)
   - `lib/config.mjs` (add to default config)
4. **Test thoroughly** with both language detection and direct voice specification
5. **Document any new voices** in README.md or this INSTALL.md
6. **Consider disk space** - each medium-quality voice is ~40MB

**Common Pitfall:** Forgetting to add the ISO 639-3 code mapping in `FRANC_TO_ISO` will cause language detection to fail even if the voice is installed correctly.
