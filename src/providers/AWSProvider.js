const ProviderInterface = require('./ProviderInterface');

/**
 * AWS Textract Provider Adapter
 * Amazon's document extraction service
 * Best for: receipts, invoices, fast processing
 * Price: $0.015/page
 */
class AWSProvider extends ProviderInterface {
  constructor(config) {
    super('aws', config);
    this.region = config.region || 'us-east-1';
    this.timeout = config.timeout || 60000;
    this.client = null;
  }

  /**
   * Initialize AWS Textract client
   * @private
   */
  async initializeClient() {
    if (!this.client) {
      try {
        const { TextractClient } = require('@aws-sdk/client-textract');
        this.client = new TextractClient({ region: this.region });
      } catch (error) {
        console.warn('AWS SDK not available, using mock mode');
        this.client = null;
      }
    }
    return this.client;
  }

  /**
   * Extract text from document using AWS Textract
   * @param {Buffer} documentBuffer - Document file buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type
   * @returns {Promise<Object>} Extracted content
   */
  async extract(documentBuffer, fileName, mimeType) {
    try {
      const client = await this.initializeClient();
      
      if (!client) {
        // Mock mode - simulate AWS Textract response
        return this.mockExtract(documentBuffer, fileName, mimeType);
      }

      const { AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
      
      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: documentBuffer },
        FeatureTypes: ['TABLES', 'FORMS']
      });
      
      const response = await client.send(command);
      return this.normalizeTextractResponse(response);
    } catch (error) {
      throw new Error(`AWS Textract extraction failed: ${error.message}`);
    }
  }

  /**
   * Mock AWS Textract extraction for demo
   * @private
   */
  async mockExtract(documentBuffer, fileName, mimeType) {
    // Simulate processing delay typical for AWS
    await this.simulateProcessing(400);
    
    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    
    let text = '';
    let pages = [];
    let tables = [];
    let forms = {};
    
    if (isImage || isPDF) {
      // Generate receipt/invoice style extraction (AWS is best for these)
      text = this.generateReceiptText(fileName);
      pages = this.generateMockPages(text, 1);
      
      // Add mock tables (common in receipts)
      tables = [
        {
          rows: 4,
          columns: 3,
          cells: [
            ['Item', 'Qty', 'Price'],
            ['Product A', '1', '$25.00'],
            ['Product B', '2', '$30.00'],
            ['Total', '', '$55.00']
          ]
        }
      ];
      
      // Add mock forms (key-value pairs)
      forms = {
        'Invoice Number': 'INV-2024-001',
        'Date': '2024-01-15',
        'Vendor': 'ABC Corporation',
        'Total': '$55.00'
      };
    } else {
      text = this.generateGenericText(fileName);
      pages = this.generateMockPages(text, 1);
    }

    return {
      text,
      pages,
      tables,
      forms,
      metadata: {
        provider: 'aws',
        extractionTime: Date.now(),
        pageCount: pages.length,
        fileName,
        mimeType,
        service: 'AWS Textract'
      }
    };
  }

  /**
   * Generate receipt-style text (AWS's specialty)
   * @private
   */
  generateReceiptText(fileName) {
    return `RECEIPT
================================

Store: ABC Corporation
Date: January 15, 2024
Transaction #: TXN-12345

--------------------------------
Item              Qty    Price
--------------------------------
Product A         1     $25.00
Product B         2     $30.00
--------------------------------
Subtotal:                $55.00
Tax (10%):               $5.50
--------------------------------
TOTAL:                  $60.50
================================

Payment: Credit Card
Card: ****1234

Thank you for shopping with us!

Return Policy:
- Items can be returned within 30 days
- Original receipt required
- Refund to original payment method`;
  }

  /**
   * Generate generic text
   * @private
   */
  generateGenericText(fileName) {
    return `Document: ${fileName}

Processed by AWS Textract

This document was analyzed using Amazon Textract, a machine learning (ML) service 
that automatically extracts text, handwriting, tables, and other data from 
scanned documents.

AWS Textract goes beyond simple optical character recognition (OCR) to identify, 
understand, and extract data from forms and tables. This makes it ideal for:

- Processing receipts and invoices
- Extracting data from tax forms
- Analyzing identity documents
- Digitizing printed contracts

Key Features:
• High accuracy text extraction
• Automatic table detection
• Form data extraction
• Multi-language support
• Real-time processing`;
  }

  /**
   * Normalize AWS Textract response to standard format
   * @private
   */
  normalizeTextractResponse(response) {
    const blocks = response.Blocks || [];
    
    // Extract text
    const textBlocks = blocks.filter(b => b.BlockType === 'LINE');
    const text = textBlocks.map(b => b.Text).join('\n');
    
    // Extract pages
    const pages = [];
    const pageBlocks = blocks.filter(b => b.BlockType === 'PAGE');
    for (const page of pageBlocks) {
      const pageLines = blocks.filter(b => 
        b.BlockType === 'LINE' && b.Page === page.PageNumber
      );
      pages.push({
        pageNumber: page.PageNumber,
        text: pageLines.map(l => l.Text).join('\n'),
        lines: pageLines.length,
        words: pageLines.reduce((sum, l) => sum + (l.Text?.split(/\s+/).length || 0), 0)
      });
    }
    
    // Extract tables
    const tables = [];
    const tableBlocks = blocks.filter(b => b.BlockType === 'TABLE');
    for (const table of tableBlocks) {
      tables.push({
        rowCount: table.RowIndex,
        columnCount: table.ColumnIndex
      });
    }
    
    // Extract forms (key-value pairs)
    const forms = {};
    const keyValueBlocks = blocks.filter(b => b.BlockType === 'KEY_VALUE_SET');
    for (const kv of keyValueBlocks) {
      if (kv.EntityTypes?.includes('KEY')) {
        const key = kv.Text || 'Unknown Key';
        const valueBlock = blocks.find(b => 
          b.BlockType === 'KEY_VALUE_SET' && 
          b.Relationships?.some(r => 
            r.Type === 'VALUE' && r.Ids.includes(kv.Id)
          )
        );
        if (valueBlock) {
          forms[key] = valueBlock.Text || '';
        }
      }
    }

    return {
      text,
      pages,
      tables,
      forms,
      metadata: {
        provider: 'aws',
        extractionTime: Date.now(),
        pageCount: pages.length,
        service: 'AWS Textract'
      }
    };
  }

  /**
   * Generate mock pages
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
   * Health check for AWS Textract
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const client = await this.initializeClient();
      if (!client) return this.isEnabled();
      
      // In production, would make a test call
      return this.isEnabled();
    } catch (error) {
      return false;
    }
  }
}

module.exports = AWSProvider;
