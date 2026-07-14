// ============================================================
// utils/pdfFonts.js
// Urdu font registration for PDFKit (Jameel Noori Nastaleeq)
// ============================================================

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FONT_CANDIDATES = [
  path.join(__dirname, '../assests/fonts/Jameel Noori Nastaleeq Regular.ttf'),
  path.join(__dirname, '../assets/fonts/Jameel Noori Nastaleeq Regular.ttf'),
];

export const URDU_FONT = 'JameelNoori';
export const LATIN_FONT = 'Helvetica';
export const LATIN_FONT_BOLD = 'Helvetica-Bold';
export const LATIN_FONT_OBLIQUE = 'Helvetica-Oblique';

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

let resolvedFontPath = undefined;

export function getUrduFontPath() {
  if (resolvedFontPath !== undefined) return resolvedFontPath;
  resolvedFontPath = FONT_CANDIDATES.find((p) => fs.existsSync(p)) || null;
  if (!resolvedFontPath) {
    console.warn('[pdfFonts] Urdu font not found — Arabic/Urdu text may show as boxes in PDFs.');
  }
  return resolvedFontPath;
}

/** Register custom Urdu font on a PDFKit document instance */
export function registerPdfFonts(doc) {
  const fontPath = getUrduFontPath();
  if (fontPath) doc.registerFont(URDU_FONT, fontPath);
}

export function hasUrduScript(text) {
  return URDU_SCRIPT_RE.test(String(text ?? ''));
}

export function pickFont(text, bold = false) {
  if (hasUrduScript(text) && getUrduFontPath()) return URDU_FONT;
  return bold ? LATIN_FONT_BOLD : LATIN_FONT;
}

/**
 * Draw text with the correct font for Latin vs Urdu content.
 */
export function writePdfText(doc, text, x, y, opts = {}) {
  const {
    bold = false,
    oblique = false,
    size,
    width,
    align = 'left',
    color,
    continued = false,
  } = opts;

  if (size != null) doc.fontSize(size);

  let font = pickFont(text, bold);
  if (!hasUrduScript(text) && oblique) font = LATIN_FONT_OBLIQUE;

  doc.font(font);
  if (color) doc.fillColor(color);

  return doc.text(String(text ?? ''), x, y, {
    width,
    align,
    lineBreak: false,
    continued,
  });
}
