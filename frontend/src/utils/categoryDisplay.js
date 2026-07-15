// ============================================================
// utils/categoryDisplay.js
// Display helpers for bilingual category names
// ============================================================

/** Urdu name for khidmat UI (filters, table, forms) */
export const getCategoryUrdu = (cat) => cat?.nameUrdu || cat?.name || '';

/** English reference name (category management page) */
export const getCategoryEnglish = (cat) => cat?.name || '';

/** Bilingual label: "English (اردو)" */
export const getCategoryBilingual = (cat) => {
  if (!cat) return '';
  const en = cat.name || '';
  const ur = cat.nameUrdu;
  if (ur && ur !== en) return `${en} (${ur})`;
  return en;
};

/** Get both names as an object */
export const getCategoryBoth = (cat) => {
  if (!cat) return { english: '', urdu: '' };
  return {
    english: cat.name || '',
    urdu: cat.nameUrdu || '',
  };
};

/** Check if category has Urdu name */
export const hasCategoryUrdu = (cat) => {
  if (!cat) return false;
  return !!(cat.nameUrdu && cat.nameUrdu !== cat.name);
};

// ─────────────────────────────────────────────
// Urdu script detection + CSS class helper
// ─────────────────────────────────────────────

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasUrduScript(text) {
  return URDU_SCRIPT_RE.test(String(text ?? ''));
}

/** Apply Nastaleeq font when text contains Urdu/Arabic script */
export function urduClass(text, extra = '') {
  const base = hasUrduScript(text) ? 'font-urdu' : '';
  return [base, extra].filter(Boolean).join(' ');
}

/**
 * Get display text with proper direction
 * Returns: { text: string, className: string, dir: 'ltr' | 'rtl' }
 */
export function getBilingualDisplay(cat) {
  if (!cat) return { text: '', className: '', dir: 'ltr' };
  
  const en = cat.name || '';
  const ur = cat.nameUrdu || '';
  
  if (ur && ur !== en) {
    return {
      text: `${en} (${ur})`,
      className: `font-urdu ${urduClass(ur)}`,
      dir: 'rtl'
    };
  }
  
  return {
    text: en,
    className: '',
    dir: 'ltr'
  };
}

/**
 * Get display name for dropdown/select options
 */
export function getCategoryDisplayName(cat) {
  if (!cat) return '';
  const en = cat.name || '';
  const ur = cat.nameUrdu || '';
  if (ur && ur !== en) return `${en} / ${ur}`;
  return en;
}

/**
 * Get category name with proper RTL support for Urdu
 */
export function getCategoryRTL(cat) {
  if (!cat) return { name: '', isRTL: false };
  const en = cat.name || '';
  const ur = cat.nameUrdu || '';
  if (ur && ur !== en) {
    return { name: `${en} / ${ur}`, isRTL: true };
  }
  return { name: en, isRTL: false };
}

// ─────────────────────────────────────────────
// Default export for convenience
// ─────────────────────────────────────────────

export default {
  getCategoryUrdu,
  getCategoryEnglish,
  getCategoryBilingual,
  getCategoryBoth,
  hasCategoryUrdu,
  hasUrduScript,
  urduClass,
  getBilingualDisplay,
  getCategoryDisplayName,
  getCategoryRTL,
};