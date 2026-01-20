import PDFDocument from 'pdfkit';

export class PDFReportGenerator {
  constructor() {
    this.doc = null;
    this.organizationName = process.env.ORG_NAME || 'Donation Management Khanqah';
  }

  async generateDonationReport(donations, filters, organizationName = this.organizationName) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          bufferPages: true  // Important: Enable page buffering
        });

        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.generateHeader(organizationName);
        this.generateFilterSummary(filters);
        this.generateDonationTable(donations);
        
        // Generate footer after all content is added
        this.generateFooter();

        this.doc.end();
      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  generateHeader(organizationName) {
    // Organization header
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(organizationName, { align: 'center' })
      .moveDown(0.5);

    // Report title
    this.doc
      .fontSize(16)
      .font('Helvetica')
      .fillColor('#000000')
      .text('Donation Report', { align: 'center' })
      .moveDown(1);

    // Report date
    this.doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(0.5);

    // Separator line
    this.drawHorizontalLine();
    this.doc.moveDown(1);
  }

  generateFilterSummary(filters) {
    // Filter out empty filters
    const activeFilters = Object.entries(filters).filter(([key, value]) => 
      value !== undefined && value !== null && value !== ''
    );

    if (activeFilters.length === 0) return;

    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Filter Summary:', { continued: false })
      .moveDown(0.3);

    this.doc.font('Helvetica').fontSize(9);

    activeFilters.forEach(([key, value]) => {
      switch(key) {
        case 'startDate':
          this.doc.text(`From: ${value}`);
          break;
        case 'endDate':
          this.doc.text(`To: ${value}`);
          break;
        case 'operatorId':
          this.doc.text(`Operator ID: ${value}`);
          break;
        case 'purpose':
          this.doc.text(`Purpose: ${value}`);
          break;
        case 'paymentMethod':
          this.doc.text(`Payment Method: ${value}`);
          break;
        case 'minAmount':
          this.doc.text(`Minimum Amount: RS ${parseFloat(value).toFixed(2)}`);
          break;
        case 'maxAmount':
          this.doc.text(`Maximum Amount: RS ${parseFloat(value).toFixed(2)}`);
          break;
        default:
          this.doc.text(`${key}: ${value}`);
      }
    });

    this.doc.moveDown(1);
  }

  generateDonationTable(donations) {
    if (!donations || donations.length === 0) {
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('No donations found for the selected criteria.', { align: 'center' })
        .moveDown(1);
      return;
    }

    const tableTop = this.doc.y;
    const headers = ['Date', 'Donor', 'Phone', 'Amount', 'Purpose', 'Payment', 'Operator'];
    const columnWidths = [60, 80, 80, 60, 90, 70, 80];
    const rowHeight = 20;

    // Ensure we have enough space for at least one row
    if (tableTop + (rowHeight * 2) > this.doc.page.height - 100) {
      this.doc.addPage();
      this.generateTableHeader(tableTop, headers, columnWidths, rowHeight);
    } else {
      this.generateTableHeader(tableTop, headers, columnWidths, rowHeight);
    }

    // Table rows
    let y = tableTop + rowHeight + 10;
    let currentPage = 1;

    donations.forEach((donation, rowIndex) => {
      // Check if we need a new page
      if (y + rowHeight > this.doc.page.height - 100) {
        this.doc.addPage();
        y = 50;
        // Add headers to new page
        this.generateTableHeader(50, headers, columnWidths, rowHeight);
        y += rowHeight + 10;
        currentPage++;
      }

      const rowData = [
        new Date(donation.date).toLocaleDateString('en-IN'),
        (donation.donorName || 'Anonymous').substring(0, 20),
        donation.donorPhone || 'N/A',
        `RS ${parseFloat(donation.amount || 0).toFixed(2)}`,
        (donation.purpose || 'General').substring(0, 25),
        donation.paymentMethod || 'Cash',
        donation.operator?.name?.substring(0, 15) || 'N/A'
      ];

      let x = 50;
      this.doc.font('Helvetica').fontSize(8);
      
      rowData.forEach((cell, i) => {
        this.doc.text(cell, x, y, { width: columnWidths[i], align: 'left' });
        x += columnWidths[i];
      });

      y += rowHeight;

      // Add subtle row separator
      if (rowIndex < donations.length - 1) {
        this.doc
          .strokeColor('#f3f4f6')
          .lineWidth(0.5)
          .moveTo(50, y - 5)
          .lineTo(550, y - 5)
          .stroke();
      }
    });

    // Calculate totals
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    // Add some space before total
    y += 10;

    // Total row
    this.doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1e40af')
      .text('TOTAL:', 50, y, { width: 270, align: 'right' })
      .text(`RS ${totalAmount.toFixed(2)}`, 320, y, { width: 230, align: 'right' })
      .moveDown(2);

    // Summary statistics
    this.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#000000')
      .text('Summary Statistics:', { continued: false })
      .moveDown(0.5);

    this.doc
      .font('Helvetica')
      .fontSize(9)
      .text(`• Total Donations: ${donations.length}`)
      .text(`• Total Amount: RS ${totalAmount.toFixed(2)}`)
      .text(`• Average Donation: RS ${(totalAmount / donations.length).toFixed(2)}`);

    // Add page count to metadata for footer
    this.currentPageCount = currentPage;
  }

  generateTableHeader(y, headers, columnWidths, rowHeight) {
    this.doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
    let x = 50;
    
    headers.forEach((header, i) => {
      this.doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });

    // Draw header line
    this.doc
      .strokeColor('#1e40af')
      .lineWidth(1)
      .moveTo(50, y + rowHeight)
      .lineTo(550, y + rowHeight)
      .stroke();
  }

  drawHorizontalLine() {
    this.doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, this.doc.y)
      .lineTo(550, this.doc.y)
      .stroke();
  }

  generateFooter() {
    try {
      // Get the actual page range
      const pageRange = this.doc.bufferedPageRange();
      
      // Ensure we have a valid page range
      if (!pageRange || typeof pageRange.start !== 'number' || typeof pageRange.count !== 'number') {
        console.warn('Invalid page range, skipping footer generation');
        return;
      }

      // Loop through all pages
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        try {
          this.doc.switchToPage(i);
          
          // Footer text
          this.doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#666666')
            .text(
              `Report generated on ${new Date().toLocaleString()}`,
              50,
              this.doc.page.height - 50,
              { align: 'center', width: 500 }
            )
            .text(
              `Page ${i - pageRange.start + 1} of ${pageRange.count}`,
              50,
              this.doc.page.height - 35,
              { align: 'center', width: 500 }
            );
        } catch (pageError) {
          console.warn(`Error adding footer to page ${i}:`, pageError);
          // Continue with other pages
        }
      }
    } catch (error) {
      console.error('Error generating footer:', error);
      // Don't fail the entire PDF generation if footer fails
    }
  }

  async generateAnalyticsReport(analytics, timeframe, organizationName = this.organizationName) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          bufferPages: true
        });

        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // Header
        this.doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text(organizationName, { align: 'center' })
          .moveDown(0.5)
          .fontSize(16)
          .font('Helvetica')
          .fillColor('#000000')
          .text('Analytics Report', { align: 'center' })
          .moveDown(0.5)
          .fontSize(10)
          .fillColor('#666666')
          .text(`Timeframe: ${timeframe || 'Monthly'}`, { align: 'center' })
          .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
          .moveDown(1);

        // Add analytics content here
        this.addAnalyticsContent(analytics, timeframe);
        
        this.generateFooter();
        this.doc.end();
      } catch (error) {
        console.error('Analytics PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  addAnalyticsContent(analytics, timeframe) {
    // This is a placeholder - implement based on your analytics structure
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .text('Analytics data would be displayed here.')
      .moveDown(1);
  }
}