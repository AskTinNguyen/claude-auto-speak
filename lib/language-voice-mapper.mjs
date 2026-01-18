#!/usr/bin/env node
import { francAll } from 'franc-min';

/**
 * Piper voice paths for different languages
 */
export const PIPER_VOICES = {
  en: 'en_US-lessac-medium',
  vi: 'vi_VN-vivos-medium',
  zh: 'zh_CN-huayan-medium'
};

/**
 * Language code mapping from ISO 639-3 (franc) to ISO 639-1
 */
const FRANC_TO_ISO = {
  eng: 'en',  // English
  vie: 'vi',  // Vietnamese
  cmn: 'zh',  // Chinese (Mandarin)
  zho: 'zh'   // Chinese
};

/**
 * Detect language from text using franc-min
 *
 * @param {string} text - Text to detect language from
 * @param {number} minConfidence - Minimum confidence threshold (0-1)
 * @returns {string} ISO 639-1 language code ('en', 'vi', 'zh')
 */
export function detectLanguage(text, minConfidence = 0.7) {
  // Handle empty or very short text
  if (!text || text.trim().length < 20) {
    return 'en'; // Default to English for short text
  }

  try {
    // Get all language predictions with confidence scores
    const predictions = francAll(text);

    if (!predictions || predictions.length === 0) {
      return 'en';
    }

    // Get top prediction
    const [topLang, topScore] = predictions[0];

    // Check if language is 'und' (undetermined)
    if (topLang === 'und') {
      return 'en';
    }

    // Note: franc returns scores where lower is better (it's a distance metric)
    // For simplicity, we'll just use the top prediction if it's in our mapping
    const isoLang = FRANC_TO_ISO[topLang];

    if (isoLang) {
      return isoLang;
    }

    // Default to English for unsupported languages
    return 'en';
  } catch (error) {
    console.error('Language detection error:', error.message);
    return 'en'; // Fallback to English on error
  }
}

/**
 * Get appropriate Piper voice for a detected language
 *
 * @param {string} lang - ISO 639-1 language code
 * @param {object} config - Configuration object
 * @returns {string} Piper voice path
 */
export function getVoiceForLanguage(lang, config) {
  // Check if user has custom voice mapping in config
  if (config?.multilingual?.voiceByLanguage?.[lang]) {
    return config.multilingual.voiceByLanguage[lang];
  }

  // Use default voice mapping
  return PIPER_VOICES[lang] || PIPER_VOICES.en;
}

/**
 * Check if a language is supported
 *
 * @param {string} lang - ISO 639-1 language code
 * @returns {boolean}
 */
export function isSupportedLanguage(lang) {
  return lang in PIPER_VOICES;
}

/**
 * Get list of supported languages
 *
 * @returns {string[]} Array of ISO 639-1 language codes
 */
export function getSupportedLanguages() {
  return Object.keys(PIPER_VOICES);
}
