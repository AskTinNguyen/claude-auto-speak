#!/usr/bin/env node
import { detectLanguage } from './language-voice-mapper.mjs';

/**
 * Language names for translation prompts
 */
const LANGUAGE_NAMES = {
  vi: 'Vietnamese',
  zh: 'Chinese',
  en: 'English'
};

/**
 * Translate text using Ollama
 *
 * @param {string} text - Text to translate
 * @param {object} options - Translation options
 * @param {string} options.targetLang - Target language ISO code ('vi', 'zh')
 * @param {string} options.ollamaUrl - Ollama API URL
 * @param {string} options.ollamaModel - Ollama model to use
 * @param {number} options.timeout - Request timeout in ms
 * @param {boolean} options.fallbackToOriginal - Return original text on error
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, options = {}) {
  const {
    targetLang,
    ollamaUrl = 'http://localhost:11434',
    ollamaModel = 'gemma2:9b',
    timeout = 10000,
    fallbackToOriginal = true
  } = options;

  // Validate target language
  if (!targetLang || !LANGUAGE_NAMES[targetLang]) {
    console.error(`Unsupported target language: ${targetLang}`);
    return fallbackToOriginal ? text : '';
  }

  // Check if text is already in target language
  const detectedLang = detectLanguage(text);
  if (detectedLang === targetLang) {
    // Text is already in target language, no translation needed
    return text;
  }

  try {
    const targetLanguageName = LANGUAGE_NAMES[targetLang];
    const prompt = `Translate the following text to ${targetLanguageName}.
Output ONLY the translation, no explanations or additional text.

Text: "${text}"

Translation:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,  // Lower temperature for more consistent translations
          num_predict: 500   // Limit response length
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.response?.trim();

    if (!translation) {
      throw new Error('Empty translation response');
    }

    return translation;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Translation timeout after ${timeout}ms`);
    } else {
      console.error('Translation error:', error.message);
    }

    // Fallback to original text if enabled
    if (fallbackToOriginal) {
      return text;
    }

    throw error;
  }
}

/**
 * Check if Ollama is available
 *
 * @param {string} ollamaUrl - Ollama API URL
 * @returns {Promise<boolean>}
 */
export async function isOllamaAvailable(ollamaUrl = 'http://localhost:11434') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a specific model is available in Ollama
 *
 * @param {string} modelName - Model name to check
 * @param {string} ollamaUrl - Ollama API URL
 * @returns {Promise<boolean>}
 */
export async function isModelAvailable(modelName, ollamaUrl = 'http://localhost:11434') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const models = data.models || [];

    return models.some(model => model.name === modelName || model.name.startsWith(modelName + ':'));
  } catch (error) {
    return false;
  }
}
