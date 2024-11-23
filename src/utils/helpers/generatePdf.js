const PDFDocument = require("pdfkit");

const generatePDF = (tip) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Add content to PDF
    doc.fontSize(20).text("Tip Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${tip._id}`);
    doc.text(`Date: ${tip.createdAt.toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`From: ${tip.fromUserId.name} (${tip.fromUserId.email})`);
    doc.text(`To: ${tip.toUserId.name} (${tip.toUserId.email})`);
    doc.moveDown();
    doc.text(`Amount: $${tip.amount.toFixed(2)}`);
    doc.text(`Currency: ${tip.currency}`);
    doc.text(`Status: ${tip.status}`);

    doc.end();
  });
};

module.exports = generatePDF;
