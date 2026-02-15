const ProviderInterface = require('./ProviderInterface');

/**
 * LangExtract Provider Adapter
 * Custom/local document extraction service
 * Best for: text-heavy documents, contracts, plain PDFs
 * Price: $0.001/page (cheapest)
 */
class LangExtractProvider extends ProviderInterface {
  constructor(config) {
    super('langextract', config);
    this.baseUrl = config.baseUrl || 'http://localhost:8000';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Extract text from document using LangExtract service
   * @param {Buffer} documentBuffer - Document file buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type
   * @returns {Promise<Object>} Extracted content
   */
  async extract(documentBuffer, fileName, mimeType) {
    try {
      // In production, this would make an HTTP request to the LangExtract service
      // For now, we'll simulate the extraction with a mock response
      const response = await this.callLangExtract(documentBuffer, fileName, mimeType);
      return this.normalizeResponse(response);
    } catch (error) {
      throw new Error(`LangExtract extraction failed: ${error.message}`);
    }
  }

  /**
   * Call LangExtract service API
   * @private
   */
  async callLangExtract(documentBuffer, fileName, mimeType) {
    // Simulated extraction - in production, this would call the actual service
    // For demo purposes, we'll create a realistic mock response
    
    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    
    // Simulate processing delay
    await this.simulateProcessing(200);
    
    // Generate mock extracted text based on file type
    let text = '';
    let pages = [];
    
    if (isPDF) {
      text = this.generateMockPDFText(fileName);
      pages = this.generateMockPages(text, 3);
    } else if (isImage) {
      text = this.generateMockImageText(fileName);
      pages = this.generateMockPages(text, 1);
    } else {
      text = this.generateMockText(fileName);
      pages = this.generateMockPages(text, 1);
    }

    return {
      text,
      pages,
      tables: [],
      forms: [],
      metadata: {
        extractionTime: Date.now(),
        pageCount: pages.length,
        fileName,
        mimeType
      }
    };
  }

  /**
   * Generate mock text for PDF documents
   * @private
   */
  generateMockPDFText(fileName) {
    return `Document: ${fileName}

This is a sample extracted text from a PDF document processed by LangExtract.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
in culpa qui officia deserunt mollit anim id est laborum.

Section 1: Introduction
The quick brown fox jumps over the lazy dog. This pangram contains every letter 
of the alphabet and is commonly used for testing typewriters and keyboards.

Section 2: Technical Details
• Point 1: Document processing capabilities
• Point 2: Text extraction accuracy
• Point 3: Multi-format support

Section 3: Conclusion
In conclusion, LangExtract provides efficient and cost-effective document 
extraction services for various file formats.`;
  }

  /**
   * Generate mock text for image documents
   * @private
   */
  generateMockImageText(fileName) {
    return `Image Document: ${fileName}

Extracted text from scanned image:

INVOICE
Invoice #: INV-2024-001
Date: January 15, 2024

Bill To:
John Doe
123 Main Street
Anytown, ST 12345

Items:
1. Professional Services - $500.00
2. Software License - $250.00
3. Support Package - $150.00

Subtotal: $900.00
Tax (10%): $90.00
Total: $990.00

Payment Due: February 15, 2024

Thank you for your business!`;
  }

  /**
   * Generate mock text for generic documents
   * @private
   */
  generateMockText(fileName) {
    return `Document: ${fileName}

Content extracted from document.

This is a placeholder for extracted text content. In a production environment, 
this would contain the actual text extracted from the provided document using 
the LangExtract service API.

The extraction process handles various document formats including:
- PDF files
- Images (JPEG, PNG, TIFF)
- Microsoft Office documents
- Plain text files

LangExtract provides high-accuracy text extraction with competitive pricing 
at just $0.001 per page.`;
  }

  /**
   * Generate mock pages from text
   * @private
   */
  generateMockPages(text, pageCount) {
    const pages = [];
    const lines = text.split('\n');
    const linesPerPage = Math.ceil(lines.length / pageCount);
    
    for (let i = 0; i < pageCount; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min(startLine + linesPerPage, lines.length);
      const pageLines = lines.slice(startLine, endLine);
      
      pages.push({
        pageNumber: i + 1,
        text: pageLines.join('\n'),
        lines: pageLines.length,
        words: pageLines.join(' ').split(/\s+/).length
      });
    }
    
    return pages;
  }

  /**
   * Simulate processing delay
   * @private
   */
  simulateProcessing(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for LangExtract service
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      // In production, would ping the actual service
      // For demo, always return true if enabled
      return this.isEnabled();
    } catch (error) {
      return false;
    }
  }
}

module.exports = LangExtractProvider;
