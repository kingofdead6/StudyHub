import fs from 'fs/promises'; // Add this import
import PDFParser from 'pdf2json';

const extractTextFromPDF = async (filePath) => {
  try {
    const pdfParser = new PDFParser();
    const data = await new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData) => reject(new Error(errData.parserError)));
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        const text = pdfData.Pages
          .map((page) =>
            page.Texts.map((text) => decodeURIComponent(text.R[0].T)).join(' ')
          )
          .join('\n');
        resolve(text);
      });
      fs.readFile(filePath).then((dataBuffer) => pdfParser.parseBuffer(dataBuffer));
    });

    if (!data || data.trim().length === 0) {
      console.error('❌ PDF parsing returned empty text.');
      return null;
    }

    return data.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
};

export default extractTextFromPDF;