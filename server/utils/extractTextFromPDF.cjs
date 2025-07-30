// utils/extractTextFromPDF.cjs
const PDFParser = require('pdf2json');

async function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true); // Enable verbose logging

    pdfParser.on('pdfParser_dataError', err => {
      console.error('PDF parsing error:', err.parserError);
      reject(new Error(`PDF parsing error: ${err.parserError}`));
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
      const text = pdfParser.getRawTextContent().replace(/\r\n/g, '\n').trim();
      console.log('PDF extracted text sample:', text.slice(0, 100)); // Log sample for debugging
      resolve(text);
    });

    try {
      pdfParser.parseBuffer(buffer);
    } catch (err) {
      console.error('Failed to parse PDF buffer:', err.message);
      reject(new Error(`Failed to parse PDF buffer: ${err.message}`));
    }
  });
}

module.exports = extractTextFromPDF;