import { Injectable, BadRequestException } from '@nestjs/common';
import * as cheerio from 'cheerio';
const pdfParse = require('pdf-parse');
const docx = require('docx');
import axios from 'axios';

export interface ExtractedContent {
  title: string;
  content: string;
  metadata: {
    source: string;
    type: 'url' | 'pdf' | 'docx';
    wordCount: number;
    extractedAt: Date;
  };
}

@Injectable()
export class ContentExtractionService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_DOMAINS = [
    'git-scm.com',
    'github.com',
    'atlassian.com',
    'stackoverflow.com',
    'dev.to',
    'medium.com',
    'freecodecamp.org',
  ];

  async extractFromUrl(url: string): Promise<ExtractedContent> {
    try {
      const urlObj = new URL(url);
      const isAllowedDomain = this.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowedDomain) {
        throw new BadRequestException(`Domain ${urlObj.hostname} is not in the allowed list`);
      }

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Git-Learning-Bot/1.0)',
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);
      
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();
      
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   'Untitled Document';

      let content = '';
      
      const mainContent = $('main, article, .content, .post-content, .entry-content').first();
      if (mainContent.length > 0) {
        content = this.cleanHtml(mainContent.html() || '');
      } else {
        content = this.cleanHtml($('body').html() || '');
      }

      return {
        title,
        content,
        metadata: {
          source: url,
          type: 'url',
          wordCount: this.countWords(content),
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to extract content from URL: ${error.message}`);
    }
  }

  async extractFromPdf(buffer: Buffer): Promise<ExtractedContent> {
    try {
      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException('PDF file is too large');
      }

      const data = await pdfParse(buffer);
      
      const content = this.cleanText(data.text);
      const title = this.extractTitleFromText(content) || 'PDF Document';

      return {
        title,
        content,
        metadata: {
          source: 'uploaded-pdf',
          type: 'pdf',
          wordCount: this.countWords(content),
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to extract content from PDF: ${error.message}`);
    }
  }

  async extractFromDocx(buffer: Buffer): Promise<ExtractedContent> {
    try {
      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException('DOCX file is too large');
      }

      const doc = await docx.Document.load(buffer);
      const content = this.extractTextFromDocx(doc);
      const title = this.extractTitleFromText(content) || 'DOCX Document';

      return {
        title,
        content: this.cleanText(content),
        metadata: {
          source: 'uploaded-docx',
          type: 'docx',
          wordCount: this.countWords(content),
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to extract content from DOCX: ${error.message}`);
    }
  }

  private cleanHtml(html: string): string {
    const $ = cheerio.load(html);
    
    $('script, style').remove();
    
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = $(el);
      const level = parseInt(el.tagName.substring(1));
      $el.attr('data-level', level.toString());
    });

    $('pre, code').each((_, el) => {
      const $el = $(el);
      if ($el.is('pre')) {
        $el.find('code').addClass('language-text');
      }
    });

    $('p').filter((_, el) => $(el).text().trim() === '').remove();

    return $.html();
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private extractTitleFromText(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;

    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100 && 
          !trimmed.toLowerCase().includes('table of contents') &&
          !trimmed.toLowerCase().includes('index')) {
        return trimmed;
      }
    }

    return lines[0].trim().substring(0, 100);
  }

  private extractTextFromDocx(doc: any): string {
    let text = '';
    
    if (doc.paragraphs) {
      for (const paragraph of doc.paragraphs) {
        if (paragraph.text) {
          text += paragraph.text + '\n';
        }
      }
    }

    return text;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}
