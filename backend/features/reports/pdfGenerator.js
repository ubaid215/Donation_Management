import PDFDocument from 'pdfkit';

export class PDFReportGenerator {
  constructor() {
    this.doc = null;
    this.organizationName = process.env.ORG_NAME || 'Donation Management Khanqah';
    this.primaryColor = '#1e40af';
    this.secondaryColor = '#3b82f6';
    this.accentColor = '#60a5fa';
    this.textColor = '#1f2937';
    this.lightGray = '#f3f4f6';
    this.darkGray = '#6b7280';
  }

  async generateDonationReport(donations, filters, organizationName = this.organizationName) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          bufferPages: true,
          autoFirstPage: false
        });

        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // Add first page manually
        this.doc.addPage();
        
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
    // Decorative top bar
    this.doc
      .rect(0, 0, this.doc.page.width, 8)
      .fill(this.primaryColor);

    this.doc
      .rect(0, 8, this.doc.page.width, 4)
      .fill(this.accentColor);

    this.doc.moveDown(2);

    // Organization header with background
    const headerY = this.doc.y;
    this.doc
      .roundedRect(50, headerY, this.doc.page.width - 100, 60, 5)
      .fill(this.lightGray);

    this.doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text(organizationName, 50, headerY + 15, { 
        align: 'center',
        width: this.doc.page.width - 100
      });

    // Report title
    this.doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor(this.textColor)
      .text('Donation Report', 50, headerY + 42, { 
        align: 'center',
        width: this.doc.page.width - 100
      });

    this.doc.moveDown(3);

    // Report metadata
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(this.darkGray)
      .text(`Report Generated: ${new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`, { align: 'center' });

    this.doc.moveDown(1.5);
  }

  generateFilterSummary(filters) {
    // Filter out empty filters
    const activeFilters = Object.entries(filters).filter(([key, value]) => 
      value !== undefined && value !== null && value !== ''
    );

    if (activeFilters.length === 0) return;

    const startY = this.doc.y;

    // Filter box header
    this.doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('Applied Filters', 60, startY + 10);

    this.doc.moveDown(0.5);

    this.doc.font('Helvetica').fontSize(9).fillColor(this.textColor);

    const filterLabels = {
      startDate: 'From Date',
      endDate: 'To Date',
      operatorId: 'Operator ID',
      purpose: 'Purpose',
      paymentMethod: 'Payment Method',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount'
    };

    activeFilters.forEach(([key, value], index) => {
      const label = filterLabels[key] || key;
      let displayValue = value;

      if (key === 'minAmount' || key === 'maxAmount') {
        displayValue = `Rs ${parseFloat(value).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      }

      // Alternate background for readability
      if (index % 2 === 0) {
        this.doc
          .rect(55, this.doc.y - 3, this.doc.page.width - 110, 15)
          .fill('#fafafa');
      }

      this.doc
        .fillColor(this.textColor)
        .text(`${label}: `, 60, this.doc.y, { continued: true })
        .font('Helvetica-Bold')
        .text(displayValue);
      
      this.doc.font('Helvetica');
    });

    const boxHeight = this.doc.y - startY + 15;
    this.doc
      .roundedRect(50, startY, this.doc.page.width - 100, boxHeight, 3)
      .stroke(this.accentColor);

    this.doc.moveDown(1.5);
  }

  generateDonationTable(donations) {
    if (!donations || donations.length === 0) {
      const emptyY = this.doc.y;
      this.doc
        .roundedRect(50, emptyY, this.doc.page.width - 100, 60, 5)
        .fill(this.lightGray);

      this.doc
        .fontSize(12)
        .font('Helvetica-Oblique')
        .fillColor(this.darkGray)
        .text('No donations found for the selected criteria.', 50, emptyY + 25, { 
          align: 'center',
          width: this.doc.page.width - 100
        });

      this.doc.moveDown(3);
      return;
    }

    // Section header
    this.doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('Donation Records', { continued: false });

    this.doc.moveDown(0.8);

    const actualTableTop = this.doc.y;
    const headers = ['Date', 'Donor Name', 'Phone', 'Amount', 'Purpose', 'Payment', 'Operator'];
    const columnWidths = [60, 85, 70, 65, 80, 70, 70];
    const rowHeight = 20;

    // Generate table header on first page
    this.generateTableHeader(actualTableTop, headers, columnWidths, rowHeight);

    // Table rows
    let y = this.doc.y + 5;
    let rowIndex = 0;

    donations.forEach((donation) => {
      // Check if we need a new page - leave more space for summary at bottom
      if (y + rowHeight + 150 > this.doc.page.height - 80) {
        this.doc.addPage();
        y = 50;
        this.generateTableHeader(50, headers, columnWidths, rowHeight);
        y = this.doc.y + 5;
      }

      // Alternate row background
      if (rowIndex % 2 === 0) {
        this.doc
          .rect(50, y - 3, this.doc.page.width - 100, rowHeight)
          .fill('#fafafa');
      }

      // Format payment method to avoid line breaks
      let paymentMethod = donation.paymentMethod || 'CASH';
      if (paymentMethod === 'BANK_TRANSFER') {
        paymentMethod = 'Bank Transfer';
      }

      const rowData = [
        new Date(donation.date).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        (donation.donorName || 'Anonymous').substring(0, 16),
        (donation.donorPhone || 'N/A').substring(0, 13),
        `Rs ${parseFloat(donation.amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        (donation.purpose || 'General').substring(0, 18),
        paymentMethod.substring(0, 15),
        donation.operator?.name?.substring(0, 13) || 'N/A'
      ];

      let x = 50;
      this.doc.font('Helvetica').fontSize(8).fillColor(this.textColor);
      
      rowData.forEach((cell, i) => {
        const align = i === 3 ? 'right' : 'left';
        this.doc.text(cell, x, y, { 
          width: columnWidths[i] - 5, 
          align: align,
          lineBreak: false  // Prevent text wrapping
        });
        x += columnWidths[i];
      });

      y += rowHeight;
      rowIndex++;
    });

    // Calculate totals
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const avgAmount = totalAmount / donations.length;
    const maxAmount = Math.max(...donations.map(d => parseFloat(d.amount || 0)));

    // Add spacing before summary
    y += 10;

    // Check if summary fits on current page
    if (y + 120 > this.doc.page.height - 80) {
      this.doc.addPage();
      y = 50;
    }

    // Total amount box
    this.doc
      .roundedRect(50, y, this.doc.page.width - 100, 35, 5)
      .fillAndStroke(this.lightGray, this.primaryColor);

    this.doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(this.primaryColor)
      .text('TOTAL AMOUNT:', 60, y + 12, { continued: true })
      .fontSize(14)
      .fillColor(this.primaryColor)
      .text(` Rs ${totalAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`, { align: 'right', width: this.doc.page.width - 140 });

    y += 50;

    // Summary statistics in cards
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('Summary Statistics', 50, y);

    y += 25;

    const stats = [
      { 
        label: 'Total Donations', 
        value: donations.length.toString(),
        icon: '📊' 
      },
      { 
        label: 'Average Donation', 
        value: `Rs ${avgAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        icon: '📈' 
      },
      { 
        label: 'Highest Donation', 
        value: `Rs ${maxAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        icon: '⭐' 
      }
    ];

    const cardWidth = ((this.doc.page.width - 130) / 3) - 10;

    stats.forEach((stat, idx) => {
      const cardX = 50 + (idx * (cardWidth + 10));

      this.doc
        .roundedRect(cardX, y, cardWidth, 50, 3)
        .fillAndStroke(this.lightGray, this.accentColor);

      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(this.darkGray)
        .text(stat.label, cardX + 10, y + 10, { width: cardWidth - 20 });

      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(this.primaryColor)
        .text(stat.value, cardX + 10, y + 28, { width: cardWidth - 20 });
    });

    // Update y position after stats cards
    this.doc.y = y + 60;
  }

  generateTableHeader(y, headers, columnWidths, rowHeight) {
    // Header background
    this.doc
      .rect(50, y, this.doc.page.width - 100, rowHeight + 5)
      .fill(this.primaryColor);

    this.doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#ffffff');
    
    let x = 50;
    
    headers.forEach((header, i) => {
      const align = i === 3 ? 'right' : 'left';
      this.doc.text(header, x, y + 6, { 
        width: columnWidths[i] - 5, 
        align: align 
      });
      x += columnWidths[i];
    });

    this.doc.y = y + rowHeight + 5;
  }

  drawHorizontalLine(color = '#cccccc') {
    this.doc
      .strokeColor(color)
      .lineWidth(1)
      .moveTo(50, this.doc.y)
      .lineTo(this.doc.page.width - 50, this.doc.y)
      .stroke();
  }

  generateFooter() {
    try {
      const pageRange = this.doc.bufferedPageRange();
      
      if (!pageRange || typeof pageRange.start !== 'number' || typeof pageRange.count !== 'number') {
        console.warn('Invalid page range, skipping footer generation');
        return;
      }

      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        try {
          this.doc.switchToPage(i);
          
          const footerY = this.doc.page.height - 60;
          
          // Footer decorative line
          this.doc
            .strokeColor(this.accentColor)
            .lineWidth(0.5)
            .moveTo(50, footerY)
            .lineTo(this.doc.page.width - 50, footerY)
            .stroke();

          // Footer text
          this.doc
            .fontSize(7.5)
            .font('Helvetica')
            .fillColor(this.darkGray)
            .text(
              `Generated on ${new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}, ${new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}`,
              50,
              footerY + 10,
              { align: 'left', width: 250 }
            )
            .text(
              `Page ${i - pageRange.start + 1} of ${pageRange.count}`,
              0,
              footerY + 10,
              { align: 'center', width: this.doc.page.width }
            );

          // Organization name in footer
          this.doc
            .fontSize(7.5)
            .fillColor(this.darkGray)
            .text(
              this.organizationName,
              0,
              footerY + 25,
              { align: 'center', width: this.doc.page.width }
            );

        } catch (pageError) {
          console.warn(`Error adding footer to page ${i}:`, pageError);
        }
      }
    } catch (error) {
      console.error('Error generating footer:', error);
    }
  }

  async generateAnalyticsReport(analytics, timeframe, organizationName = this.organizationName) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          bufferPages: true,
          autoFirstPage: false
        });

        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // Add first page manually
        this.doc.addPage();

        // Decorative top bar
        this.doc
          .rect(0, 0, this.doc.page.width, 8)
          .fill(this.primaryColor);

        this.doc
          .rect(0, 8, this.doc.page.width, 4)
          .fill(this.accentColor);

        this.doc.moveDown(2);

        // Header
        const headerY = this.doc.y;
        this.doc
          .roundedRect(50, headerY, this.doc.page.width - 100, 70, 5)
          .fill(this.lightGray);

        this.doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .fillColor(this.primaryColor)
          .text(organizationName, 50, headerY + 12, { 
            align: 'center',
            width: this.doc.page.width - 100
          });

        this.doc
          .fontSize(16)
          .font('Helvetica')
          .fillColor(this.textColor)
          .text('Analytics Report', 50, headerY + 40, { 
            align: 'center',
            width: this.doc.page.width - 100
          });

        this.doc.moveDown(3);

        this.doc
          .fontSize(10)
          .fillColor(this.darkGray)
          .text(`Timeframe: ${timeframe || 'Monthly'}`, { align: 'center' })
          .text(`Generated: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });

        this.doc.moveDown(2);

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
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor(this.textColor)
      .text('Analytics data will be displayed here based on your requirements.')
      .moveDown(1);

    // Add placeholder for analytics visualization
    const boxY = this.doc.y;
    this.doc
      .roundedRect(50, boxY, this.doc.page.width - 100, 100, 5)
      .fillAndStroke(this.lightGray, this.accentColor);

    this.doc
      .fontSize(10)
      .fillColor(this.darkGray)
      .text('Analytics charts and graphs would appear here', 50, boxY + 40, {
        align: 'center',
        width: this.doc.page.width - 100
      });
  }
}