// ============================================================
// features/khidmatRecord/khidmatPdfGenerator.js
// PDF report generator for KhidmatRecord
// Mirrors the style / structure of pdfGenerator.js exactly.
// ============================================================

import PDFDocument from 'pdfkit';

// ─── Page geometry (same as pdfGenerator.js) ────────────────
const A4_HEIGHT    = 841.89;
const A4_WIDTH     = 595.28;
const MARGIN       = 50;
const USABLE_WIDTH = A4_WIDTH - MARGIN * 2;
const FOOTER_H     = 45;
const CONTENT_BOT  = A4_HEIGHT - FOOTER_H;
const ROW_H        = 24;
const HDR_H        = 22;
const PAGE_TOP     = 45;

// ─── Khidmat table columns ───────────────────────────────────
const COL_WIDTHS  = [55, 110, 88, 75, 90, 77];
const COL_HEADERS = ['Date', 'Name', 'Phone', 'Amount (Rs)', 'Category', 'Status'];

// Status display labels
const STATUS_LABEL = {
  COMPLETED:   'Completed',
  PARTIAL:     'Partial',
  RECORD_ONLY: 'Record Only'
};

// ─────────────────────────────────────────────────────────────
export class KhidmatPDFGenerator {

  constructor() {
    this.doc              = null;
    this.organizationName = process.env.ORG_NAME || 'Donation Management Khanqah';
    this._pageCount       = 0;

    // Colour palette — same variables as pdfGenerator.js
    this.primaryColor   = '#1e40af';
    this.secondaryColor = '#1d4ed8';
    this.accentColor    = '#3b82f6';
    this.textColor      = '#1f2937';
    this.lightGray      = '#f8fafc';
    this.midGray        = '#e2e8f0';
    this.darkGray       = '#64748b';
    this.white          = '#ffffff';

    // Extra accent for status badges (subtle green row tint)
    this.completedTint  = '#f0fdf4';
    this.partialTint    = '#fefce8';
    this.recordTint     = '#eff6ff';
  }

  // ── Utility helpers ─────────────────────────────────────────

  _truncate(str, maxLen) {
    if (!str) return 'N/A';
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen - 1) + '\u2026' : s;
  }

  _formatAmount(val) {
    return parseFloat(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  _formatDate(d) {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  _statusLabel(status) {
    return STATUS_LABEL[status] || status || 'N/A';
  }

  // ── Page chrome ──────────────────────────────────────────────

  /** Add a new page with the top colour bar; returns starting Y */
  _newPage() {
    this.doc.addPage();
    this._pageCount++;
    this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
    this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);
    return PAGE_TOP;
  }

  _writeFooter(pageNum, totalPages) {
    const lineY = CONTENT_BOT + 8;
    const fY    = CONTENT_BOT + 18;
    this.doc.strokeColor(this.accentColor).lineWidth(0.5)
      .moveTo(MARGIN, lineY).lineTo(A4_WIDTH - MARGIN, lineY).stroke();
    this.doc.fontSize(7.5).font('Helvetica').fillColor(this.darkGray)
      .text(
        `Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} \u00b7 ${this.organizationName}`,
        MARGIN, fY, { width: 250, lineBreak: false }
      );
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      MARGIN, fY, { width: USABLE_WIDTH, align: 'right', lineBreak: false }
    );
  }

  // ── Page header (title block) ────────────────────────────────

  _drawPageHeader(title, subtitle) {
    subtitle = subtitle || '';
    let y  = PAGE_TOP + 10;
    const bH = subtitle ? 72 : 58;
    this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, bH, 6).fill(this.lightGray);
    this.doc.fontSize(19).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text(this.organizationName, MARGIN, y + 10, { align: 'center', width: USABLE_WIDTH });
    this.doc.fontSize(12).font('Helvetica').fillColor(this.textColor)
      .text(title, MARGIN, y + 34, { align: 'center', width: USABLE_WIDTH });
    if (subtitle) {
      this.doc.fontSize(9).fillColor(this.darkGray)
        .text(subtitle, MARGIN, y + 54, { align: 'center', width: USABLE_WIDTH });
    }
    y += bH + 12;
    this.doc.fontSize(8).font('Helvetica').fillColor(this.darkGray)
      .text(
        `Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`,
        MARGIN, y, { align: 'center', width: USABLE_WIDTH }
      );
    return y + 18;
  }

  // ── Summary cards (total records + total amount) ─────────────

  _drawSummaryCards(records, y) {
    const total = records.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    // Breakdown by status
    const counts = { COMPLETED: 0, PARTIAL: 0, RECORD_ONLY: 0 };
    records.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

    const cards = [
      { label: 'Total Records',    value: records.length.toString() },
      { label: 'Total Amount',     value: `Rs ${this._formatAmount(total)}` },
      { label: 'Completed',        value: counts.COMPLETED.toString() },
      { label: 'Partial / Pending',value: (counts.PARTIAL + counts.RECORD_ONLY).toString() }
    ];

    const cW  = Math.floor((USABLE_WIDTH - 15) / 4);
    const gap = Math.floor((USABLE_WIDTH - cW * 4) / 3);

    cards.forEach((card, i) => {
      const x = MARGIN + i * (cW + gap);
      this.doc.roundedRect(x, y, cW, 46, 4)
        .fillAndStroke(this.lightGray, this.accentColor);
      this.doc.fontSize(8).font('Helvetica').fillColor(this.darkGray)
        .text(card.label, x + 6, y + 8, { width: cW - 12, lineBreak: false });
      this.doc.fontSize(10.5).font('Helvetica-Bold').fillColor(this.primaryColor)
        .text(card.value, x + 6, y + 22, { width: cW - 12, lineBreak: false });
    });

    return y + 58;
  }

  // ── Active filter summary bar ────────────────────────────────

  _drawFilterSummary(filters, y) {
    const skip  = ['limit', 'page', 'categoryId'];
    const labels = {
      status: 'Status', categoryId: 'Category', operatorId: 'Operator',
      startDate: 'From', endDate: 'To', search: 'Search'
    };
    const active = Object.entries(filters)
      .filter(([k, v]) => v && v !== '' && !skip.includes(k));
    if (active.length === 0) return y;

    this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, 28, 3)
      .fillAndStroke('#eff6ff', '#bfdbfe');
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text('Filters:', MARGIN + 8, y + 9, { continued: true })
      .font('Helvetica').fillColor(this.textColor)
      .text('  ' + active.map(([k, v]) => `${labels[k] || k}: ${v}`).join('   '), {
        lineBreak: false
      });
    return y + 36;
  }

  // ── Table header row ─────────────────────────────────────────

  _drawTableHeader(y) {
    this.doc.rect(MARGIN, y, USABLE_WIDTH, HDR_H).fill(this.primaryColor);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
    let x = MARGIN;
    COL_HEADERS.forEach((h, i) => {
      this.doc.text(h, x + 4, y + 6, {
        width: COL_WIDTHS[i] - 8,
        align: i === 3 ? 'right' : 'left',
        lineBreak: false
      });
      x += COL_WIDTHS[i];
    });
    return y + HDR_H;
  }

  // ── Single data row (with subtle status-based row tint) ──────

  _drawTableRow(record, y, rowIndex) {
    // Row background — alternating + status tint
    let bg;
    if (record.status === 'COMPLETED') {
      bg = rowIndex % 2 === 0 ? this.completedTint : '#dcfce7';
    } else if (record.status === 'PARTIAL') {
      bg = rowIndex % 2 === 0 ? this.partialTint : '#fef9c3';
    } else {
      bg = rowIndex % 2 === 0 ? '#eef2ff' : this.lightGray;
    }
    this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(bg);

    const catName = record.category?.name || 'General';
    const cells = [
      this._truncate(this._formatDate(record.date || record.createdAt), 12),
      this._truncate(record.name  || 'N/A', 22),
      this._truncate(record.phone || 'N/A', 18),
      this._formatAmount(record.amount),
      this._truncate(catName, 16),
      this._statusLabel(record.status)
    ];

    this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
    let x = MARGIN;
    cells.forEach((cell, i) => {
      this.doc.text(cell, x + 4, y + 7, {
        width: COL_WIDTHS[i] - 8,
        align: i === 3 ? 'right' : 'left',
        lineBreak: false
      });
      x += COL_WIDTHS[i];
    });
    return y + ROW_H;
  }

  // ── Grand total banner ───────────────────────────────────────

  _drawTotalBanner(totalAmount, y) {
    this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, 34, 5)
      .fillAndStroke(this.primaryColor, this.primaryColor);
    this.doc.fontSize(12).font('Helvetica-Bold').fillColor(this.white)
      .text(
        `GRAND TOTAL:  Rs ${this._formatAmount(totalAmount)}`,
        MARGIN + 10, y + 11,
        { width: USABLE_WIDTH - 20, align: 'right', lineBreak: false }
      );
    return y + 46;
  }

  // ── Main records table (handles pagination) ──────────────────

  _drawKhidmatTable(records, yStart, totalPages) {
    if (!records || records.length === 0) {
      this.doc.roundedRect(MARGIN, yStart, USABLE_WIDTH, 50, 5).fill(this.lightGray);
      this.doc.fontSize(11).font('Helvetica-Oblique').fillColor(this.darkGray)
        .text('No khidmat records found for the selected criteria.', MARGIN, yStart + 18, {
          align: 'center', width: USABLE_WIDTH
        });
      return { y: yStart + 62, totalAmount: 0 };
    }

    let y = yStart;
    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text('Khidmat Records', MARGIN, y);
    y += 20;

    const tableBodyStartY = y + HDR_H;
    y = this._drawTableHeader(y);

    let rowIndex = 0;
    for (const record of records) {
      if (y + ROW_H > CONTENT_BOT) {
        this._writeFooter(this._pageCount, totalPages);
        y = this._newPage();
        y = this._drawTableHeader(y);
        rowIndex = 0;
      }
      y = this._drawTableRow(record, y, rowIndex++);
    }

    // Border around body
    this.doc.rect(MARGIN, tableBodyStartY, USABLE_WIDTH, y - tableBodyStartY)
      .stroke(this.midGray);

    const totalAmount = records.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    return { y: y + 10, totalAmount };
  }

  // ── Status breakdown table ───────────────────────────────────

  _drawStatusBreakdown(records, yStart, totalPages) {
    const map = new Map();
    records.forEach(r => {
      const label = this._statusLabel(r.status);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(r);
    });
    if (map.size === 0) return yStart;

    let y = yStart + 10;
    if (y + 60 > CONTENT_BOT) {
      this._writeFooter(this._pageCount, totalPages);
      y = this._newPage();
    }

    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text('Breakdown by Status', MARGIN, y);
    y += 22;

    const heads = ['Status', 'Records', 'Total Amount'];
    const sw    = [210, 100, 185];
    const tableStartY = y;

    const printHead = (yh) => {
      this.doc.rect(MARGIN, yh, USABLE_WIDTH, HDR_H).fill(this.secondaryColor);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
      let sx = MARGIN;
      heads.forEach((h, i) => {
        this.doc.text(h, sx + 4, yh + 6, {
          width: sw[i] - 8,
          align: i > 0 ? 'right' : 'left',
          lineBreak: false
        });
        sx += sw[i];
      });
      return yh + HDR_H;
    };

    y = printHead(y);
    let idx = 0;
    for (const [label, recs] of map.entries()) {
      if (y + ROW_H > CONTENT_BOT) {
        this._writeFooter(this._pageCount, totalPages);
        y = this._newPage();
        y = printHead(y);
        idx = 0;
      }
      if (idx % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(this.lightGray);

      const catTotal = recs.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      const row = [label, recs.length.toString(), `Rs ${this._formatAmount(catTotal)}`];

      this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
      let sx = MARGIN;
      row.forEach((cell, i) => {
        this.doc.text(cell, sx + 4, y + 7, {
          width: sw[i] - 8,
          align: i > 0 ? 'right' : 'left',
          lineBreak: false
        });
        sx += sw[i];
      });
      y += ROW_H;
      idx++;
    }
    this.doc.rect(MARGIN, tableStartY, USABLE_WIDTH, y - tableStartY).stroke(this.midGray);
    return y + 10;
  }

  // ── Category breakdown table ─────────────────────────────────

  _drawCategoryBreakdown(records, yStart, totalPages) {
    const map = new Map();
    records.forEach(r => {
      const cat = r.category?.name || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(r);
    });
    if (map.size === 0) return yStart;

    let y = yStart + 10;
    if (y + 60 > CONTENT_BOT) {
      this._writeFooter(this._pageCount, totalPages);
      y = this._newPage();
    }

    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text('Breakdown by Category', MARGIN, y);
    y += 22;

    const heads = ['Category', 'Records', 'Total Amount'];
    const sw    = [255, 100, 140];
    const tableStartY = y;

    const printHead = (yh) => {
      this.doc.rect(MARGIN, yh, USABLE_WIDTH, HDR_H).fill(this.secondaryColor);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
      let sx = MARGIN;
      heads.forEach((h, i) => {
        this.doc.text(h, sx + 4, yh + 6, {
          width: sw[i] - 8,
          align: i > 0 ? 'right' : 'left',
          lineBreak: false
        });
        sx += sw[i];
      });
      return yh + HDR_H;
    };

    y = printHead(y);
    let idx = 0;
    for (const [catName, recs] of map.entries()) {
      if (y + ROW_H > CONTENT_BOT) {
        this._writeFooter(this._pageCount, totalPages);
        y = this._newPage();
        y = printHead(y);
        idx = 0;
      }
      if (idx % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(this.lightGray);

      const catTotal = recs.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      const row = [catName, recs.length.toString(), `Rs ${this._formatAmount(catTotal)}`];

      this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
      let sx = MARGIN;
      row.forEach((cell, i) => {
        this.doc.text(cell, sx + 4, y + 7, {
          width: sw[i] - 8,
          align: i > 0 ? 'right' : 'left',
          lineBreak: false
        });
        sx += sw[i];
      });
      y += ROW_H;
      idx++;
    }
    this.doc.rect(MARGIN, tableStartY, USABLE_WIDTH, y - tableStartY).stroke(this.midGray);
    return y + 10;
  }

  // ── Page-count estimator ─────────────────────────────────────

  _estimatePageCount(records, filters, firstContentY) {
    let pages = 1;
    let y = firstContentY;

    // Summary cards
    y += 58 + 8;

    // Filter bar
    const hasFilters = Object.entries(filters).some(
      ([k, v]) => v && v !== '' && !['limit', 'page', 'categoryId'].includes(k)
    );
    if (hasFilters) y += 36 + 8;

    // Main table
    y += 20 + HDR_H;
    for (let i = 0; i < records.length; i++) {
      if (y + ROW_H > CONTENT_BOT) { pages++; y = PAGE_TOP + HDR_H; }
      y += ROW_H;
    }
    y += 10;

    // Total banner
    if (y + 46 > CONTENT_BOT) { pages++; y = PAGE_TOP; }
    y += 46 + 10;

    // Status breakdown
    const statusSet = new Set(records.map(r => r.status));
    if (statusSet.size > 0) {
      if (y + 60 > CONTENT_BOT) { pages++; y = PAGE_TOP; }
      y += 22 + HDR_H;
      for (const _ of statusSet) {
        if (y + ROW_H > CONTENT_BOT) { pages++; y = PAGE_TOP + HDR_H; }
        y += ROW_H;
      }
      y += 10;
    }

    // Category breakdown
    const catSet = new Set(records.map(r => r.category?.name || 'Uncategorized'));
    if (catSet.size > 0) {
      if (y + 60 > CONTENT_BOT) { pages++; y = PAGE_TOP; }
      y += 22 + HDR_H;
      for (const _ of catSet) {
        if (y + ROW_H > CONTENT_BOT) { pages++; y = PAGE_TOP + HDR_H; }
        y += ROW_H;
      }
    }

    return pages;
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: Full Khidmat Report
  // ─────────────────────────────────────────────────────────────
  async generateKhidmatReport(records, filters = {}, organizationName) {
    if (organizationName) this.organizationName = organizationName;

    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;

        this.doc.on('data',  c  => chunks.push(c));
        this.doc.on('end',   () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // ── First page ───────────────────────────────────────
        this.doc.addPage();
        this._pageCount = 1;
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        const activeFilters = Object.entries(filters)
          .filter(([k, v]) => v && v !== '' && !['limit', 'page'].includes(k));
        const subtitle = activeFilters.length > 0
          ? activeFilters.map(([k, v]) => `${k}: ${v}`).join(' \u00b7 ')
          : 'Complete Report';

        let y = this._drawPageHeader('Khidmat Records Report', subtitle);

        const totalPages = this._estimatePageCount(records, filters, y);

        y = this._drawSummaryCards(records, y);
        y += 8;
        y = this._drawFilterSummary(filters, y);
        y += 8;

        // Main table
        const { y: afterTable, totalAmount } = this._drawKhidmatTable(records, y, totalPages);
        y = afterTable;

        // Grand total banner
        if (y + 46 > CONTENT_BOT) {
          this._writeFooter(this._pageCount, totalPages);
          y = this._newPage();
        }
        y = this._drawTotalBanner(totalAmount, y);
        y += 10;

        // Status breakdown
        y = this._drawStatusBreakdown(records, y, totalPages);

        // Category breakdown
        this._drawCategoryBreakdown(records, y, totalPages);

        this._writeFooter(this._pageCount, totalPages);
        this.doc.end();

      } catch (err) {
        console.error('Khidmat PDF Generation Error:', err);
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: Per-Category Khidmat Report
  // ─────────────────────────────────────────────────────────────
  async generateKhidmatCategoryReport(records, categoryName, filters = {}, organizationName) {
    if (organizationName) this.organizationName = organizationName;

    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;

        this.doc.on('data',  c  => chunks.push(c));
        this.doc.on('end',   () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.doc.addPage();
        this._pageCount = 1;
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        let y = this._drawPageHeader(
          `Khidmat Report \u2014 ${categoryName}`,
          'Category Report'
        );

        const totalPages = this._estimatePageCount(records, filters, y);

        y = this._drawSummaryCards(records, y);
        y += 8;
        y = this._drawFilterSummary(filters, y);
        y += 8;

        const { y: afterTable, totalAmount } = this._drawKhidmatTable(records, y, totalPages);
        y = afterTable;

        if (y + 46 > CONTENT_BOT) {
          this._writeFooter(this._pageCount, totalPages);
          y = this._newPage();
        }
        this._drawTotalBanner(totalAmount, y);

        this._writeFooter(this._pageCount, totalPages);
        this.doc.end();

      } catch (err) {
        console.error('Khidmat Category PDF Error:', err);
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: Single Record Receipt (A5-style on A4)
  // ─────────────────────────────────────────────────────────────
  async generateKhidmatReceipt(record, organizationName) {
    if (organizationName) this.organizationName = organizationName;

    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;

        this.doc.on('data',  c  => chunks.push(c));
        this.doc.on('end',   () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.doc.addPage();
        this._pageCount = 1;

        // ── Top bar ──────────────────────────────────────────
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        // ── Header ───────────────────────────────────────────
        let y = this._drawPageHeader('Khidmat Service Record', 'Individual Record');

        // ── Receipt card ─────────────────────────────────────
        const cardH = 340;
        this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, cardH, 8)
          .fillAndStroke(this.lightGray, this.accentColor);

        const lX  = MARGIN + 20;
        const vX  = MARGIN + 180;
        const cW  = USABLE_WIDTH - 40;
        let   ry  = y + 20;
        const gap = 32;

        const field = (label, value) => {
          this.doc.fontSize(9).font('Helvetica').fillColor(this.darkGray)
            .text(label, lX, ry, { width: 150, lineBreak: false });
          this.doc.fontSize(9.5).font('Helvetica-Bold').fillColor(this.textColor)
            .text(String(value || 'N/A'), vX, ry, { width: cW - 150, lineBreak: false });
          ry += gap;
        };

        const catName = record.category?.name || 'General';

        field('Name',         record.name);
        field('Phone',        record.phone);
        field('Address',      record.address || 'N/A');
        field('Category',     catName);
        field('Amount',       `Rs ${this._formatAmount(record.amount)}`);
        field('Status',       this._statusLabel(record.status));
        field('Date',         this._formatDate(record.date || record.createdAt));
        if (record.notes) field('Notes', record.notes);

        // ── Status badge ─────────────────────────────────────
        const badgeColors = {
          COMPLETED:   { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
          PARTIAL:     { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
          RECORD_ONLY: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
        };
        const bc = badgeColors[record.status] || badgeColors.RECORD_ONLY;
        const bY = y + cardH - 50;
        this.doc.roundedRect(lX, bY, 160, 28, 4)
          .fillAndStroke(bc.bg, bc.border);
        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(bc.text)
          .text(this._statusLabel(record.status), lX, bY + 8, { width: 160, align: 'center', lineBreak: false });

        // ── Footer ───────────────────────────────────────────
        this._writeFooter(1, 1);
        this.doc.end();

      } catch (err) {
        console.error('Khidmat Receipt PDF Error:', err);
        reject(err);
      }
    });
  }
}