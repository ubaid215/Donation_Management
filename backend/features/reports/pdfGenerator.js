import PDFDocument from 'pdfkit';

const A4_HEIGHT    = 841.89;
const A4_WIDTH     = 595.28;
const MARGIN       = 50;
const USABLE_WIDTH = A4_WIDTH - MARGIN * 2;
const FOOTER_H     = 45;
const CONTENT_BOT  = A4_HEIGHT - FOOTER_H;   
const ROW_H        = 24;
const HDR_H        = 22;
const PAGE_TOP     = 45;

const COL_WIDTHS  = [72, 118, 85, 70, 90, 60];
const COL_HEADERS = ['Date', 'Donor Name', 'Phone', 'Amount (Rs)', 'Purpose', 'Method'];

export class PDFReportGenerator {

  constructor() {
    this.doc              = null;
    this.organizationName = process.env.ORG_NAME || 'Donation Management Khanqah';
    this._pageCount       = 0;
    this.primaryColor   = '#1e40af';
    this.secondaryColor = '#1d4ed8';
    this.accentColor    = '#3b82f6';
    this.textColor      = '#1f2937';
    this.lightGray      = '#f8fafc';
    this.midGray        = '#e2e8f0';
    this.darkGray       = '#64748b';
    this.white          = '#ffffff';
  }

  _truncate(str, maxLen) {
    if (!str) return 'N/A';
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen - 1) + '\u2026' : s;
  }

  _formatAmount(val) {
    return parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  _formatDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  _formatPayment(m) {
    const map = { BANK_TRANSFER: 'Bank', CARD: 'Card', CASH: 'Cash', UPI: 'UPI', CHEQUE: 'Cheque' };
    return map[m] || m || 'Cash';
  }

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
      .text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} \u00b7 ${this.organizationName}`, MARGIN, fY, { width: 250, lineBreak: false });
    this.doc.text(`Page ${pageNum} of ${totalPages}`, MARGIN, fY, { width: USABLE_WIDTH, align: 'right', lineBreak: false });
  }

  _drawPageHeader(title, subtitle) {
    subtitle = subtitle || '';
    let y = PAGE_TOP + 10;
    const hW = USABLE_WIDTH;
    const bH = subtitle ? 72 : 58;
    this.doc.roundedRect(MARGIN, y, hW, bH, 6).fill(this.lightGray);
    this.doc.fontSize(19).font('Helvetica-Bold').fillColor(this.primaryColor).text(this.organizationName, MARGIN, y + 10, { align: 'center', width: hW });
    this.doc.fontSize(12).font('Helvetica').fillColor(this.textColor).text(title, MARGIN, y + 34, { align: 'center', width: hW });
    if (subtitle) this.doc.fontSize(9).fillColor(this.darkGray).text(subtitle, MARGIN, y + 54, { align: 'center', width: hW });
    y += bH + 12;
    this.doc.fontSize(8).font('Helvetica').fillColor(this.darkGray)
      .text(`Generated: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`, MARGIN, y, { align: 'center', width: hW });
    return y + 18;
  }

  _drawSummaryCards(donations, y) {
    const total = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    const cards = [
      { label: 'Total Donations', value: donations.length.toString() },
      { label: 'Total Amount',    value: `Rs ${this._formatAmount(total)}` }
    ];
    // 2 cards — each takes roughly half the usable width with a gap
    const cW = Math.floor((USABLE_WIDTH - 10) / 2);
    cards.forEach((card, i) => {
      const x = MARGIN + i * (cW + 10);
      this.doc.roundedRect(x, y, cW, 46, 4).fillAndStroke(this.lightGray, this.accentColor);
      this.doc.fontSize(8).font('Helvetica').fillColor(this.darkGray).text(card.label, x + 6, y + 8, { width: cW - 12, lineBreak: false });
      this.doc.fontSize(10.5).font('Helvetica-Bold').fillColor(this.primaryColor).text(card.value, x + 6, y + 22, { width: cW - 12, lineBreak: false });
    });
    return y + 58;
  }

  _drawFilterSummary(filters, y) {
    const labels = { startDate: 'From', endDate: 'To', purpose: 'Purpose', paymentMethod: 'Payment', categoryName: 'Category', minAmount: 'Min', maxAmount: 'Max' };
    const active = Object.entries(filters).filter(([k, v]) => v && v !== '' && !['limit', 'page', 'categoryId'].includes(k));
    if (active.length === 0) return y;
    this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, 28, 3).fillAndStroke('#eff6ff', '#bfdbfe');
    this.doc.fontSize(8).font('Helvetica-Bold').fillColor(this.primaryColor)
      .text('Filters:', MARGIN + 8, y + 9, { continued: true })
      .font('Helvetica').fillColor(this.textColor)
      .text('  ' + active.map(([k, v]) => `${labels[k] || k}: ${v}`).join('   '), { lineBreak: false });
    return y + 36;
  }

  _drawTableHeader(y) {
    this.doc.rect(MARGIN, y, USABLE_WIDTH, HDR_H).fill(this.primaryColor);
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
    let x = MARGIN;
    COL_HEADERS.forEach((h, i) => {
      this.doc.text(h, x + 4, y + 6, { width: COL_WIDTHS[i] - 8, align: i === 3 ? 'right' : 'left', lineBreak: false });
      x += COL_WIDTHS[i];
    });
    return y + HDR_H;
  }

  _drawTableRow(donation, y, rowIndex) {
    if (rowIndex % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill('#eef2ff');
    const purpose = (donation.category && donation.category.name) || donation.purpose || 'General';
    const cells = [
      this._truncate(this._formatDate(donation.date), 14),
      this._truncate(donation.donorName  || 'Anonymous', 22),
      this._truncate(donation.donorPhone || 'N/A', 18),
      this._formatAmount(donation.amount),
      this._truncate(purpose, 16),
      this._formatPayment(donation.paymentMethod)
    ];
    this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
    let x = MARGIN;
    cells.forEach((cell, i) => {
      this.doc.text(cell, x + 4, y + 7, { width: COL_WIDTHS[i] - 8, align: i === 3 ? 'right' : 'left', lineBreak: false });
      x += COL_WIDTHS[i];
    });
    return y + ROW_H;
  }

  _drawTotalBanner(totalAmount, y) {
    this.doc.roundedRect(MARGIN, y, USABLE_WIDTH, 34, 5).fillAndStroke(this.primaryColor, this.primaryColor);
    this.doc.fontSize(12).font('Helvetica-Bold').fillColor(this.white)
      .text(`GRAND TOTAL:  Rs ${this._formatAmount(totalAmount)}`, MARGIN + 10, y + 11, { width: USABLE_WIDTH - 20, align: 'right', lineBreak: false });
    return y + 46;
  }

  _drawDonationTable(donations, yStart, totalPages) {
    if (!donations || donations.length === 0) {
      this.doc.roundedRect(MARGIN, yStart, USABLE_WIDTH, 50, 5).fill(this.lightGray);
      this.doc.fontSize(11).font('Helvetica-Oblique').fillColor(this.darkGray)
        .text('No donations found for the selected criteria.', MARGIN, yStart + 18, { align: 'center', width: USABLE_WIDTH });
      return { y: yStart + 62, totalAmount: 0 };
    }
    let y = yStart;
    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(this.primaryColor).text('Donation Records', MARGIN, y);
    y += 20;
    const tableBodyStartY = y + HDR_H;
    y = this._drawTableHeader(y);
    let rowIndex = 0;
    for (const donation of donations) {
      if (y + ROW_H > CONTENT_BOT) {
        this._writeFooter(this._pageCount, totalPages);
        y = this._newPage();
        y = this._drawTableHeader(y);
        rowIndex = 0;
      }
      y = this._drawTableRow(donation, y, rowIndex++);
    }
    this.doc.rect(MARGIN, tableBodyStartY, USABLE_WIDTH, y - tableBodyStartY).stroke(this.midGray);
    const totalAmount = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    return { y: y + 10, totalAmount };
  }

  _drawCategoryBreakdown(donations, yStart, totalPages) {
    const map = new Map();
    donations.forEach(d => {
      const cat = (d.category && d.category.name) || d.purpose || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(d);
    });
    if (map.size === 0) return yStart;

    let y = yStart + 10;
    if (y + 60 > CONTENT_BOT) { this._writeFooter(this._pageCount, totalPages); y = this._newPage(); }

    this.doc.fontSize(13).font('Helvetica-Bold').fillColor(this.primaryColor).text('Category Breakdown', MARGIN, y);
    y += 22;

    const heads = ['Category', 'Donations', 'Total Amount'];
    const sw    = [255, 100, 140];
    const tableStartY = y;

    const printCatHeader = (yh) => {
      this.doc.rect(MARGIN, yh, USABLE_WIDTH, HDR_H).fill(this.secondaryColor);
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
      let sx = MARGIN;
      heads.forEach((h, i) => {
        this.doc.text(h, sx + 4, yh + 6, { width: sw[i] - 8, align: i > 0 ? 'right' : 'left', lineBreak: false });
        sx += sw[i];
      });
      return yh + HDR_H;
    };

    y = printCatHeader(y);
    let idx = 0;
    for (const [catName, catDons] of map.entries()) {
      if (y + ROW_H > CONTENT_BOT) {
        this._writeFooter(this._pageCount, totalPages);
        y = this._newPage();
        y = printCatHeader(y);
        idx = 0;
      }
      if (idx % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(this.lightGray);
      const catTotal = catDons.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
      const row = [catName, catDons.length.toString(), `Rs ${this._formatAmount(catTotal)}`];
      this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
      let sx = MARGIN;
      row.forEach((cell, i) => {
        this.doc.text(cell, sx + 4, y + 7, { width: sw[i] - 8, align: i > 0 ? 'right' : 'left', lineBreak: false });
        sx += sw[i];
      });
      y += ROW_H;
      idx++;
    }
    this.doc.rect(MARGIN, tableStartY, USABLE_WIDTH, y - tableStartY).stroke(this.midGray);
    return y + 10;
  }

  _estimatePageCount(donations, filters, firstContentY) {
    let pages = 1;
    let y = firstContentY;
    y += 58 + 8;
    const hasFilters = Object.entries(filters).some(([k, v]) => v && v !== '' && !['limit', 'page', 'categoryId'].includes(k));
    if (hasFilters) y += 36 + 8;
    y += 20 + HDR_H;
    for (let i = 0; i < donations.length; i++) {
      if (y + ROW_H > CONTENT_BOT) { pages++; y = PAGE_TOP + HDR_H; }
      y += ROW_H;
    }
    y += 10;
    if (y + 46 > CONTENT_BOT) { pages++; y = PAGE_TOP; }
    y += 46 + 10;
    const catSet = new Set(donations.map(d => (d.category && d.category.name) || d.purpose || 'Uncategorized'));
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

  async generateDonationReport(donations, filters, organizationName) {
    if (organizationName) this.organizationName = organizationName;
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;
        this.doc.on('data', c => chunks.push(c));
        this.doc.on('end',  () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.doc.addPage();
        this._pageCount = 1;
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        const activeFilters = Object.entries(filters).filter(([k, v]) => v && v !== '' && !['limit', 'page'].includes(k));
        const subtitle = activeFilters.length > 0 ? activeFilters.map(([k, v]) => `${k}: ${v}`).join(' \u00b7 ') : 'Complete Report';

        let y = this._drawPageHeader('Donation Report', subtitle);
        const totalPages = this._estimatePageCount(donations, filters, y);
        y = this._drawSummaryCards(donations, y);
        y += 8;
        y = this._drawFilterSummary(filters, y);
        y += 8;
        const { y: afterTable, totalAmount } = this._drawDonationTable(donations, y, totalPages);
        y = afterTable;
        if (y + 46 > CONTENT_BOT) { this._writeFooter(this._pageCount, totalPages); y = this._newPage(); }
        y = this._drawTotalBanner(totalAmount, y);
        y += 10;
        this._drawCategoryBreakdown(donations, y, totalPages);
        this._writeFooter(this._pageCount, totalPages);
        this.doc.end();
      } catch (err) {
        console.error('PDF Generation Error:', err);
        reject(err);
      }
    });
  }

  async generateCategoryReport(donations, categoryName, filters, organizationName) {
    if (organizationName) this.organizationName = organizationName;
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;
        this.doc.on('data', c => chunks.push(c));
        this.doc.on('end',  () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.doc.addPage();
        this._pageCount = 1;
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        let y = this._drawPageHeader(`Donation Report \u2014 ${categoryName}`, 'Category Report');
        const totalPages = this._estimatePageCount(donations, filters, y);
        y = this._drawSummaryCards(donations, y);
        y += 8;
        y = this._drawFilterSummary(filters, y);
        y += 8;
        const { y: afterTable, totalAmount } = this._drawDonationTable(donations, y, totalPages);
        y = afterTable;
        if (y + 46 > CONTENT_BOT) { this._writeFooter(this._pageCount, totalPages); y = this._newPage(); }
        this._drawTotalBanner(totalAmount, y);
        this._writeFooter(this._pageCount, totalPages);
        this.doc.end();
      } catch (err) {
        console.error('Category PDF Error:', err);
        reject(err);
      }
    });
  }

  async generateAnalyticsReport(analytics, timeframe, organizationName) {
    if (organizationName) this.organizationName = organizationName;
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
        this._pageCount = 0;
        this.doc.on('data', c => chunks.push(c));
        this.doc.on('end',  () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.doc.addPage();
        this._pageCount = 1;
        this.doc.rect(0, 0, A4_WIDTH, 10).fill(this.primaryColor);
        this.doc.rect(0, 10, A4_WIDTH, 4).fill(this.accentColor);

        const estPages = 2;
        let y = this._drawPageHeader('Analytics Report', `Timeframe: ${timeframe || 'Monthly'}`);
        const m = (analytics && analytics.metrics) || {};

        const summaryItems = [
          ['Total Donations',   m.totalDonations  != null ? String(m.totalDonations)                     : 'N/A'],
          ['Total Amount',      m.totalAmount     != null ? `Rs ${this._formatAmount(m.totalAmount)}`     : 'N/A'],
          ["Today's Donations", m.todayCount      != null ? String(m.todayCount)                          : 'N/A'],
          ["Today's Amount",    m.todayAmount     != null ? `Rs ${this._formatAmount(m.todayAmount)}`     : 'N/A'],
          ['Monthly Donations', m.monthlyCount    != null ? String(m.monthlyCount)                        : 'N/A'],
          ['Monthly Amount',    m.monthlyAmount   != null ? `Rs ${this._formatAmount(m.monthlyAmount)}`   : 'N/A'],
          ['Active Operators',  m.activeOperators != null ? String(m.activeOperators)                     : 'N/A']
        ];

        const colW = (USABLE_WIDTH - 10) / 2;
        let col = 0;
        summaryItems.forEach(([label, value]) => {
          const gX = MARGIN + col * (colW + 10);
          this.doc.roundedRect(gX, y, colW, 40, 4).fillAndStroke(this.lightGray, this.accentColor);
          this.doc.fontSize(8.5).font('Helvetica').fillColor(this.darkGray).text(label, gX + 8, y + 8,  { width: colW - 16, lineBreak: false });
          this.doc.fontSize(12).font('Helvetica-Bold').fillColor(this.primaryColor).text(value, gX + 8, y + 22, { width: colW - 16, lineBreak: false });
          col++;
          if (col === 2) { col = 0; y += 50; }
        });
        if (col === 1) y += 50;
        y += 12;

        const byPurpose = analytics && analytics.charts && analytics.charts.byPurpose;
        if (byPurpose && byPurpose.length > 0) {
          if (y + 60 > CONTENT_BOT) { this._writeFooter(this._pageCount, estPages); y = this._newPage(); }
          this.doc.fontSize(12).font('Helvetica-Bold').fillColor(this.primaryColor).text('Donations by Purpose / Category', MARGIN, y);
          y += 20;
          this.doc.rect(MARGIN, y, USABLE_WIDTH, HDR_H).fill(this.primaryColor);
          this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
          this.doc.text('Purpose',      MARGIN + 4,   y + 6, { width: 200,            lineBreak: false });
          this.doc.text('Count',        MARGIN + 210, y + 6, { width: 60,  align: 'right', lineBreak: false });
          this.doc.text('Total Amount', MARGIN + 280, y + 6, { width: 120, align: 'right', lineBreak: false });
          this.doc.text('% of Total',   MARGIN + 415, y + 6, { width: 76,  align: 'right', lineBreak: false });
          y += HDR_H;
          const grandTotal = byPurpose.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
          byPurpose.forEach((row, i) => {
            if (y + ROW_H > CONTENT_BOT) { this._writeFooter(this._pageCount, estPages); y = this._newPage(); }
            if (i % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(this.lightGray);
            this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
            this.doc.text(this._truncate(row.purpose || 'Uncategorized', 30), MARGIN + 4,   y + 7, { width: 200,            lineBreak: false });
            this.doc.text(String(row.count),                                   MARGIN + 210, y + 7, { width: 60,  align: 'right', lineBreak: false });
            this.doc.text(`Rs ${this._formatAmount(row.amount)}`,               MARGIN + 280, y + 7, { width: 120, align: 'right', lineBreak: false });
            const pct = grandTotal > 0 ? ((parseFloat(row.amount || 0) / grandTotal) * 100).toFixed(1) : '0.0';
            this.doc.text(`${pct}%`, MARGIN + 415, y + 7, { width: 76, align: 'right', lineBreak: false });
            y += ROW_H;
          });
          y += 14;
        }

        const topDonors = analytics && analytics.topDonors;
        if (topDonors && topDonors.length > 0) {
          if (y + 60 > CONTENT_BOT) { this._writeFooter(this._pageCount, estPages); y = this._newPage(); }
          this.doc.fontSize(12).font('Helvetica-Bold').fillColor(this.primaryColor).text('Top Donors', MARGIN, y);
          y += 20;
          this.doc.rect(MARGIN, y, USABLE_WIDTH, HDR_H).fill(this.secondaryColor);
          this.doc.fontSize(9).font('Helvetica-Bold').fillColor(this.white);
          this.doc.text('#',            MARGIN + 4,   y + 6, { width: 25,  lineBreak: false });
          this.doc.text('Donor Name',   MARGIN + 34,  y + 6, { width: 150, lineBreak: false });
          this.doc.text('Phone',        MARGIN + 194, y + 6, { width: 100, lineBreak: false });
          this.doc.text('Donations',    MARGIN + 304, y + 6, { width: 70,  align: 'right', lineBreak: false });
          this.doc.text('Total Amount', MARGIN + 384, y + 6, { width: 107, align: 'right', lineBreak: false });
          y += HDR_H;
          topDonors.forEach((donor, i) => {
            if (y + ROW_H > CONTENT_BOT) { this._writeFooter(this._pageCount, estPages); y = this._newPage(); }
            if (i % 2 === 0) this.doc.rect(MARGIN, y, USABLE_WIDTH, ROW_H).fill(this.lightGray);
            this.doc.fontSize(9).font('Helvetica').fillColor(this.textColor);
            this.doc.text(`#${i + 1}`,                                    MARGIN + 4,   y + 7, { width: 25,  lineBreak: false });
            this.doc.text(this._truncate(donor.name  || 'Anonymous', 22), MARGIN + 34,  y + 7, { width: 150, lineBreak: false });
            this.doc.text(this._truncate(donor.phone || 'N/A', 16),       MARGIN + 194, y + 7, { width: 100, lineBreak: false });
            this.doc.text(String(donor.donationCount || 0),                MARGIN + 304, y + 7, { width: 70,  align: 'right', lineBreak: false });
            this.doc.text(`Rs ${this._formatAmount(donor.totalAmount)}`,   MARGIN + 384, y + 7, { width: 107, align: 'right', lineBreak: false });
            y += ROW_H;
          });
        }

        this._writeFooter(this._pageCount, this._pageCount);
        this.doc.end();
      } catch (err) {
        console.error('Analytics PDF Error:', err);
        reject(err);
      }
    });
  }
}