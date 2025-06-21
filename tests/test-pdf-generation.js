const express = require('express');
const PDFDocument = require('pdfkit');
const app = express();

// Simple test route for PDF generation (no auth required)
app.get('/test-pdf', (req, res) => {
  try {
    // Create PDF document
    const doc = new PDFDocument();
    const timestamp = new Date().toLocaleString();
    const filename = `Test_Telegram_Report_${new Date().toISOString().split('T')[0]}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(24).text('Test Telegram Analytics Report', { align: 'center' });
    doc.fontSize(12).text(`Report generated: ${timestamp}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(18).text('Summary Statistics', { underline: true });
    doc.moveDown();

    // Sample data
    const summaryStats = [
      { label: 'Total Groups', value: '15' },
      { label: 'Total Users', value: '580' },
      { label: 'Total Messages', value: '12,500' },
      { label: 'Active Users', value: '245' },
      { label: 'Average Views per Message', value: '42' },
      { label: 'Group Propagation Rate', value: '67.80%' }
    ];

    summaryStats.forEach(stat => {
      doc.fontSize(12).text(`${stat.label}: ${stat.value}`);
    });

    doc.moveDown(2);
    doc.fontSize(18).text('Top Users & Groups', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text('Top 5 Most Active Users:', { underline: true });
    doc.moveDown(0.5);
    
    const topUsers = [
      'John Doe - 850 messages',
      'Jane Smith - 720 messages', 
      'Mike Wilson - 650 messages',
      'Sarah Jones - 580 messages',
      'Alex Brown - 520 messages'
    ];

    topUsers.forEach((user, index) => {
      doc.fontSize(11).text(`${index + 1}. ${user}`);
    });

    doc.moveDown();
    doc.fontSize(14).text('Top 5 Most Active Groups:', { underline: true });
    doc.moveDown(0.5);
    
    const topGroups = [
      'Tech Discussions - 3,200 messages',
      'Project Updates - 2,800 messages',
      'General Chat - 2,400 messages',
      'News Channel - 1,900 messages',
      'Support Group - 1,600 messages'
    ];

    topGroups.forEach((group, index) => {
      doc.fontSize(11).text(`${index + 1}. ${group}`);
    });

    doc.moveDown(2);
    doc.fontSize(18).text('Summary', { underline: true });
    doc.moveDown();

    const summaryText = `This is a test PDF report to verify that the PDF generation functionality is working correctly. The most active user is John Doe with 850 messages. The most active group is "Tech Discussions" with 3,200 messages. Overall, the Telegram network has generated 12,500 total messages across 15 groups with 245 active users.`;

    doc.fontSize(11).text(summaryText, { align: 'justify' });

    doc.moveDown(2);
    doc.fontSize(8).text(`Generated on ${timestamp} | Test PDF Generation`, { align: 'center' });

    // Finalize PDF
    doc.end();

    console.log('Test PDF generated successfully');

  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test PDF',
      message: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('Test PDF server running on http://localhost:3001');
  console.log('Visit http://localhost:3001/test-pdf to download a test PDF');
});
