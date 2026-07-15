// ============================================================
// utils/pdfFonts.js
// Urdu font registration for PDFKit (Jameel Noori Nastaleeq)
// Updated: width-aware truncation + per-segment font rendering
// for bilingual (Latin / Urdu) strings.
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
<<<<<<< ours
=======
 * NOTE: this picks ONE font for the whole string based on whether
 * it contains any Urdu-range characters. Fine for pure-language
 * strings, but a bilingual string like "Ahmed / احمد" will render
 * entirely in the Urdu font. For bilingual fields, use
 * writeBilingualText() instead, which fonts each half correctly.
>>>>>>> theirs
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

// ────────────────────────────────────────────────────────────
// Width-aware truncation
// ────────────────────────────────────────────────────────────

/**
 * Truncate `text` so it renders within `maxWidth` px, using the
 * CURRENT font/size already set on `doc` (or the ones passed in
 * opts). Truncates on whole-character boundaries via a binary
 * search on rendered width, so it never leaves a half-shaped
 * glyph or overflows its box — unlike a fixed maxLen char-count
 * cutoff, which doesn't account for Urdu glyphs commonly being
 * wider than Latin ones at the same font size.
 *
 * IMPORTANT: caller must ensure doc.font()/doc.fontSize() reflect
 * the font this text will actually be drawn with before calling,
 * or pass { font, size } explicitly.
 */
export function fitToWidth(doc, text, maxWidth, opts = {}) {
  const { size, font } = opts;
  if (size != null) doc.fontSize(size);
  if (font) doc.font(font);

  if (!text) return '';
  const str = String(text);

  if (doc.widthOfString(str) <= maxWidth) return str;

  const ellipsis = '\u2026';
  // Array.from splits on Unicode code points (handles surrogate
  // pairs), which is a safer cut boundary than raw .length/.slice
  // for non-Latin scripts.
  const chars = Array.from(str);
  let lo = 0;
  let hi = chars.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join('') + ellipsis;
    if (doc.widthOfString(candidate) <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  if (lo <= 0) return ellipsis;
  return chars.slice(0, lo).join('') + ellipsis;
}

/** Measure a string's rendered width using the correct font for its script. */
export function measureWidth(doc, text, { size, bold = false } = {}) {
  if (size != null) doc.fontSize(size);
  doc.font(pickFont(text, bold));
  return doc.widthOfString(String(text ?? ''));
}

// ────────────────────────────────────────────────────────────
// Bilingual (Latin + Urdu) field rendering
// ────────────────────────────────────────────────────────────

/**
 * Draw a "Primary / Secondary" bilingual field (e.g. "Ahmed Khan / احمد خان")
 * where each half is:
 *   1. rendered in the correct font for its own script (fixes
 *      Urdu-in-wrong-font rendering issues), and
 *   2. truncated independently to a fair share of the available
 *      width (fixes the "cuts off half the Urdu name / overflows
 *      the cell" problem caused by truncating the combined string
 *      as one blob with a flat character-count limit).
 *
 * Falls back to a single writePdfText() call when there's no
 * distinct secondary value.
 *
 * @param {PDFDocument} doc
 * @param {string} primary     Latin-script value (e.g. English name)
 * @param {string} secondary   Urdu-script value (e.g. Urdu name), or falsy/duplicate to skip
 * @param {number} x
 * @param {number} y
 * @param {object} opts
 * @param {number} opts.width  REQUIRED - total width budget for the cell
 * @param {number} [opts.size=9]
 * @param {boolean} [opts.bold=false]
 * @param {string} [opts.color]
 * @param {string} [opts.separator=' / ']
 */
export function writeBilingualText(doc, primary, secondary, x, y, opts = {}) {
  const {
    width,
    size = 9,
    bold = false,
    color,
    separator = ' / ',
  } = opts;

  const primaryStr = primary ? String(primary) : 'N/A';
  const hasSecondary = secondary && String(secondary).trim() && String(secondary) !== primaryStr;

  if (!hasSecondary) {
    return writePdfText(doc, primaryStr, x, y, { size, bold, width, color, lineBreak: false });
  }

  if (width == null) {
    throw new Error('writeBilingualText requires opts.width to allocate space between languages');
  }

  const secondaryStr = String(secondary);
  const primaryFont = bold ? LATIN_FONT_BOLD : LATIN_FONT;
  const secondaryFont = hasUrduScript(secondaryStr) && getUrduFontPath()
    ? URDU_FONT
    : primaryFont;

  doc.fontSize(size).font(LATIN_FONT);
  const sepWidth = doc.widthOfString(separator);
  const budget = Math.max(8, (width - sepWidth) / 2);

  const fittedPrimary = fitToWidth(doc, primaryStr, budget, { size, font: primaryFont });
  const fittedSecondary = fitToWidth(doc, secondaryStr, budget, { size, font: secondaryFont });

  if (color) doc.fillColor(color);

  doc.font(primaryFont).fontSize(size);
  doc.text(fittedPrimary, x, y, { lineBreak: false, continued: true });

  doc.font(LATIN_FONT).fontSize(size);
  doc.text(separator, { lineBreak: false, continued: true });

  doc.font(secondaryFont).fontSize(size);
  doc.text(fittedSecondary, { lineBreak: false, continued: false });
}
