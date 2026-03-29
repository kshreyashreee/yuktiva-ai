const fs = require('fs');
const path = require('path');

async function parseFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return { text: data.text, pages: data.numpages, type: 'pdf' };
    }
    
    if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return { text: result.value, type: 'docx' };
    }
    
    if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
      const text = fs.readFileSync(filePath, 'utf-8');
      return { text, type: ext.slice(1) };
    }
    
    // For other files, return filename as context
    return { text: `File: ${path.basename(filePath)} (binary content - ${ext} format)`, type: 'binary' };
  } catch (err) {
    return { text: `Unable to parse file: ${err.message}`, type: 'error' };
  }
}

module.exports = { parseFile };
