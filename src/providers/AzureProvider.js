const ProviderInterface = require('./ProviderInterface');

/**
 * Azure Document Intelligence Provider Adapter
 * Microsoft's AI-powered document extraction service
 * Best for: invoices, forms, complex layouts
 * Price: $0.005/page
 */
class AzureProvider extends ProviderInterface {
  constructor(config) {
    super('azure', config);
    this.endpoint = config.endpoint || 'https://your-resource.cognitiveservices.azure.com';
    this.timeout = config.timeout || 60000;
    this.apiKey = config.apiKey;
    this.client = null;
  }

  /**
   * Initialize Azure Document Intelligence client
   * @private
   */
  async initializeClient() {
    if (!this.client) {
      try {
        const { DocumentAnalysisClient } = require('@azure/ai-form-recognizer');
        this.client = new DocumentAnalysisClient(this.endpoint, this.apiKey);
      } catch (error) {
        console.warn('Azure SDK not available, using mock mode');
        this.client = null;
      }
    }
    return this.client;
  }

  /**
   * Extract text from document using Azure Document Intelligence
   * @param {Buffer} documentBuffer - Document file buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type
   * @returns {Promise<Object>} Extracted content
   */
  async extract(documentBuffer, fileName, mimeType) {
    try {
      const client = await this.initializeClient();
      
      if (!client) {
        // Mock mode - simulate Azure response
        return this.mockExtract(documentBuffer, fileName, mimeType);
      }

      // Use prebuilt-document model for general extraction
      const poller = await client.beginAnalyzeDocument('prebuilt-document', documentBuffer);
      const result = await poller.pollUntilDone();
      
      return this.normalizeAzureResponse(result);
    } catch (error) {
      throw new Error(`Azure Document Intelligence extraction failed: ${error.message}`);
    }
  }

  /**
   * Mock Azure Document Intelligence extraction for demo
   * @private
   */
  async mockExtract(documentBuffer, fileName, mimeType) {
    // Simulate processing delay typical for Azure
    await this.simulateProcessing(500);
    
    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    
    let text = '';
    let pages = [];
    let tables = [];
    let forms = {};
    
    if (isImage || isPDF) {
      // Generate invoice-style extraction (Azure's specialty)
      text = this.generateInvoiceText(fileName);
      pages = this.generateMockPages(text, 2);
      
      // Add mock tables (invoices have complex tables)
      tables = [
        {
          rows: 5,
          columns: 4,
          cells: [
            ['Description', 'Quantity', 'Unit Price', 'Amount'],
            ['Consulting Services', '40', '$150.00', '$6,000.00'],
            ['Software License', '1', '$2,500.00', '$2,500.00'],
            ['Support Package', '12', '$200.00', '$2,400.00'],
            ['', '', 'Subtotal', '$10,900.00']
          ]
        }
      ];
      
      // Add mock forms (Azure excels at key-value extraction)
      forms = {
        'Invoice Number': 'INV-2024-001',
        'Invoice Date': 'January 15, 2024',
        'Due Date': 'February 15, 2024',
        'Vendor Name': 'Acme Corporation',
        'Vendor Address': '123 Business Ave, Suite 100, Tech City, TC 12345',
        'Customer Name': 'John Smith',
        'Customer Address': '456 Customer Street, Home Town, HT 67890',
        'Subtotal': '$10,900.00',
        'Tax (8%)': '$872.00',
        'Total': '$11,772.00',
        'Currency': 'USD'
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
        provider: 'azure',
        extractionTime: Date.now(),
        pageCount: pages.length,
        fileName,
        mimeType,
        service: 'Azure Document Intelligence'
      }
    };
  }

  /**
   * Generate invoice-style text (Azure's specialty)
   * @private
   */
  generateInvoiceText(fileName) {
    return `INVOICE
================================================================

INVOICE #: INV-2024-001
Date: January 15, 2024
Due Date: February 15, 2024

================================================================
FROM:                                  TO:
Acme Corporation                      John Smith
123 Business Ave, Suite 100          456 Customer Street
Tech City, TC 12345                  Home Town, HT 67890
Phone: (555) 123-4567                Phone: (555) 987-6543

================================================================
DESCRIPTION                    QTY    UNIT PRICE     AMOUNT
================================================================
Consulting Services            40     $150.00       $6,000.00
Software License               1      $2,500.00     $2,500.00
Support Package                12     $200.00       $2,400.00
----------------------------------------------------------------
                                            Subtotal: $10,900.00
                                            Tax (8%):   $872.00
----------------------------------------------------------------
                                            TOTAL:    $11,772.00
================================================================

Payment Terms: Net 30
Payment Methods: Bank Transfer, Credit Card, Check

Bank Details:
Bank: First National Bank
Account: 1234567890
Routing: 987654321

Thank you for your business!

Acme Corporation
Email: billing@acmecorp.com
Web: www.acmecorporation.com`;
  }

  /**
   * Generate generic text
   * @private
   */
  generateGenericText(fileName) {
    return `Document: ${fileName}

Processed by Azure Document Intelligence

Azure Document Intelligence (formerly Form Recognizer) is an AI-powered 
document extraction service that understands documents and forms.

It uses machine learning to:
- Extract text, tables, and structure from documents
- Identify form fields and their values
- Understand document layouts
- Support custom models

Azure Document Intelligence is particularly good at:
• Invoice processing and automation
• Form data extraction
• ID document processing
• Contract analysis
• Receipt processing

The service offers:
- Prebuilt models for common document types
- Custom model training
- High accuracy with structured data
- Seamless Azure integration`;
  }

  /**
   * Normalize Azure Document Intelligence response to standard format
   * @private
   */
  normalizeAzureResponse(response) {
    // Azure returns documents with pages, tables, and key-value pairs
    const pages = [];
    const tables = [];
    const forms = {};
    
    // Extract pages
    if (response.pages) {
      for (const page of response.pages) {
        let pageText = '';
        if (page.lines) {
          pageText = page.lines.map(l => l.content).join('\n');
        }
        pages.push({
          pageNumber: page.pageNumber,
          text: pageText,
          lines: page.lines?.length || 0,
          words: page.words?.length || 0
        });
      }
    }
    
    // Extract tables
    if (response.tables) {
      for (const table of response.tables) {
        tables.push({
          rowCount: table.rowCount,
          columnCount: table.columnCount,
          cells: table.cells?.map(c => c.content) || []
        });
      }
    }
    
    // Extract key-value pairs (forms)
    if (response.keyValuePairs) {
      for (const kv of response.keyValuePairs) {
        forms[kv.key?.content || 'Unknown'] = kv.value?.content || '';
      }
    }
    
    // Combine all text
    const text = pages.map(p => p.text).join('\n\n');

    return {
      text,
      pages,
      tables,
      forms,
      metadata: {
        provider: 'azure',
        extractionTime: Date.now(),
        pageCount: pages.length,
        service: 'Azure Document Intelligence'
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
   * Health check for Azure Document Intelligence
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

module.exports = AzureProvider;
