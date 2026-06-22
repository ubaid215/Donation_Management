// ============================================================
// utils/translate.js
// English → Urdu translation via Google Translate (free API)
// ============================================================

import { translate } from '@vitalets/google-translate-api'

/**
 * Translate English text to Urdu.
 * Returns the original text if translation fails.
 */
export async function translateToUrdu(text) {
  if (!text?.trim()) return null
  try {
    const result = await translate(text.trim(), { from: 'en', to: 'ur' })
    return result.text || null
  } catch (err) {
    console.warn('Translation failed:', err.message)
    return null
  }
}
