// Urdu script detection + CSS class helper for frontend

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasUrduScript(text) {
  return URDU_SCRIPT_RE.test(String(text ?? ''));
}

/** Apply Nastaleeq font when text contains Urdu/Arabic script */
export function urduClass(text, extra = '') {
  const base = hasUrduScript(text) ? 'font-urdu' : '';
  return [base, extra].filter(Boolean).join(' ');
}
