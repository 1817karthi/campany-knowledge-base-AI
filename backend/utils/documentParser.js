const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');


const PDFParser = require("pdf2json");

/**
 * Extract text from a PDF file using pdf2json (robust fallback)
 */
function extractWithPDF2JSON(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1); // 1 = text only mode
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.loadPDF(filePath);
  });
}

/**
 * Extract text from a PDF file (tries pdf-parse first, then pdf2json)
 */
async function extractFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.log(`⚠️ pdf-parse failed (${err.message}), trying pdf2json fallback...`);
    try {
      return await extractWithPDF2JSON(filePath);
    } catch (fallbackErr) {
      throw new Error(`Failed to parse PDF. The file might be corrupted or encrypted. (${fallbackErr.message || fallbackErr})`);
    }
  }
}

/**
 * Extract text from a Word (.docx) file
 */
async function extractFromWord(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Extract text from any supported file type
 */
async function extractText(filePath, mimeType) {
  const ext = filePath.split('.').pop().toLowerCase();

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return await extractFromPDF(filePath);
  } else if (
    ext === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await extractFromWord(filePath);
  } else if (ext === 'txt' || mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }
}

/**
 * Split text into overlapping chunks for better retrieval
 */
function chunkText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  const words = text.split(/\s+/);
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(' ').trim();
    if (chunk.length > 50) { // Skip tiny chunks
      chunks.push(chunk);
    }
    if (end >= words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

module.exports = { extractText, chunkText };
