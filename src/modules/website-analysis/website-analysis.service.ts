import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';
import { 
  WebsiteInfo, 
  ContactInfo, 
  AboutInfo, 
  PrivacyAnalysis, 
  AnalysisOptions 
} from '@/interfaces/website-info.interface';

@Injectable()
export class WebsiteAnalysisService {
  private readonly logger = new Logger(WebsiteAnalysisService.name);
  private browser: puppeteer.Browser | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeBrowser();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      const headless = this.configService.get('browser.headless');
      const userAgent = this.configService.get('browser.userAgent');
      
      this.browser = await puppeteer.launch({
        headless: headless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
          `--user-agent=${userAgent}`,
        ],
      });
      
      this.logger.log('Browser initialized successfully');
    } catch (error) {
      this.logger.warn('Failed to initialize browser, will use axios fallback:', error.message);
      this.browser = null;
    }
  }

  async analyzeWebsite(url: string, options: AnalysisOptions = {}): Promise<WebsiteInfo> {
    const startTime = Date.now();
    this.logger.log(`Starting analysis of ${url}`);

    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      
      // Initialize website info
      const websiteInfo: WebsiteInfo = {
        companyName: '',
        mainUrl: normalizedUrl,
        contactInfo: {},
        aboutInfo: {},
        privacySummary: '',
        trustSummary: '',
        dataCollection: [],
        dataSharing: [],
        userRights: [],
        securityMeasures: [],
        compliance: [],
        lastUpdated: new Date(),
      };

      // Fetch main page
      const mainPageContent = await this.fetchPageContent(normalizedUrl, options);
      if (!mainPageContent) {
        throw new Error('Failed to fetch main page content');
      }

      // Skip validation for now since it's causing issues with legitimate websites
      // if (this.isFakeOrGeneratedContent(mainPageContent)) {
      //   throw new Error('Detected potentially fake or generated content. Please verify the URL is correct.');
      // }

      // Extract basic information
      websiteInfo.companyName = this.extractCompanyName(mainPageContent);
      websiteInfo.contactInfo = this.extractContactInfo(mainPageContent);
      websiteInfo.aboutInfo = this.extractAboutInfo(mainPageContent);

      // Skip validation for company names for now
      // if (this.isGenericCompanyName(websiteInfo.companyName)) {
      //   this.logger.warn(`Generic company name detected: ${websiteInfo.companyName}`);
      // }

      // Find privacy-related links
      const privacyLinks = this.findPrivacyLinks(mainPageContent, normalizedUrl);
      websiteInfo.privacyPolicyUrl = privacyLinks.privacyPolicy;
      websiteInfo.trustCenterUrl = privacyLinks.trustCenter;
      websiteInfo.termsOfServiceUrl = privacyLinks.termsOfService;

      // Analyze privacy policy if found
      if (websiteInfo.privacyPolicyUrl) {
        this.logger.log(`Analyzing privacy policy: ${websiteInfo.privacyPolicyUrl}`);
        const privacyContent = await this.fetchPageContent(websiteInfo.privacyPolicyUrl, options);
        if (privacyContent) {
          // Skip validation for privacy content
          // if (!this.isFakeOrGeneratedContent(privacyContent)) {
            const privacyAnalysis = this.analyzePrivacyPolicy(privacyContent);
            websiteInfo.dataCollection = privacyAnalysis.dataCollection;
            websiteInfo.dataSharing = privacyAnalysis.dataSharing;
            websiteInfo.userRights = privacyAnalysis.userRights;
            websiteInfo.securityMeasures = privacyAnalysis.securityMeasures;
            websiteInfo.compliance = privacyAnalysis.compliance;
            
            websiteInfo.privacySummary = `Privacy policy found with ${privacyAnalysis.dataCollection.length} data collection mentions, ${privacyAnalysis.dataSharing.length} sharing mentions, and ${privacyAnalysis.compliance.length} compliance mentions.`;
          // }
        }
      }

      // Analyze trust center if found
      if (websiteInfo.trustCenterUrl) {
        this.logger.log(`Analyzing trust center: ${websiteInfo.trustCenterUrl}`);
        const trustContent = await this.fetchPageContent(websiteInfo.trustCenterUrl, options);
        if (trustContent) {
          // Skip validation for trust content
          // if (!this.isFakeOrGeneratedContent(trustContent)) {
            const trustAnalysis = this.analyzePrivacyPolicy(trustContent); // Reuse analysis method
            websiteInfo.trustSummary = `Trust center found with ${trustAnalysis.securityMeasures.length} security mentions and ${trustAnalysis.compliance.length} compliance mentions.`;
          // }
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Analysis completed for ${websiteInfo.companyName} in ${processingTime}ms`);

      return websiteInfo;

    } catch (error) {
      this.logger.error(`Analysis failed for ${url}:`, error);
      throw error;
    }
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private async fetchPageContent(url: string, options: AnalysisOptions = {}): Promise<string | null> {
    const timeout = options.timeout || this.configService.get('scraping.timeout');
    const maxRetries = options.maxRetries || this.configService.get('scraping.maxRetries');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Fetching ${url} (attempt ${attempt}/${maxRetries})`);

        if (options.headless !== false && this.browser && this.browser.isConnected()) {
          // Use Puppeteer for JavaScript-heavy sites
          return await this.fetchWithPuppeteer(url, timeout);
        } else {
          // Use Axios for simple requests
          return await this.fetchWithAxios(url, timeout);
        }
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt === maxRetries) {
          this.logger.error(`All attempts failed for ${url}`);
          return null;
        }
        
        // Wait before retry
        await this.delay(1000 * attempt);
      }
    }
    
    return null;
  }

  private async fetchWithPuppeteer(url: string, timeout: number): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    try {
      await page.setDefaultTimeout(timeout);
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  private async fetchWithAxios(url: string, timeout: number): Promise<string> {
    const userAgent = this.configService.get('browser.userAgent');
    
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 5, // Follow up to 5 redirects
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    return response.data;
  }

  private extractCompanyName(html: string): string {
    const $ = cheerio.load(html);
    
    // Try to get company name from title
    const title = $('title').text().trim();
    if (title) {
      // Clean up title to get company name
      return title.replace(/[-|–—] .*$/, '').trim();
    }
    
    // Try to get from h1
    const h1 = $('h1').first().text().trim();
    if (h1) {
      return h1;
    }
    
    // Try to get from meta tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) {
      return ogTitle.replace(/[-|–—] .*$/, '').trim();
    }
    
    return 'Unknown Company';
  }

  private extractContactInfo(html: string): ContactInfo {
    const $ = cheerio.load(html);
    const text = $.text();
    
    const contactInfo: ContactInfo = {};
    
    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails) {
      contactInfo.email = [...new Set(emails)].slice(0, 5);
    }
    
    // Extract phone numbers
    const phoneRegex = /[\+]?[1-9][\d]{0,15}/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      contactInfo.phone = [...new Set(phones)].slice(0, 5);
    }
    
    // Extract addresses
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/g;
    const addresses = text.match(addressRegex);
    if (addresses) {
      contactInfo.address = [...new Set(addresses)].slice(0, 3);
    }
    
    return contactInfo;
  }

  private extractAboutInfo(html: string): AboutInfo {
    const $ = cheerio.load(html);
    
    const aboutInfo: AboutInfo = {};
    
    // Get title
    aboutInfo.title = $('title').text().trim();
    
    // Get main heading
    aboutInfo.mainHeading = $('h1').first().text().trim();
    
    // Get description from meta tags
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content');
    if (description) {
      aboutInfo.description = description;
    } else {
      // Try to get from about sections
      const aboutSections = $('div, section').filter((_, el) => {
        const className = $(el).attr('class') || '';
        const id = $(el).attr('id') || '';
        return /about|company|mission|vision/i.test(className + ' ' + id);
      });
      
      if (aboutSections.length > 0) {
        const text = aboutSections.first().text().trim();
        if (text.length > 50) {
          aboutInfo.description = text.substring(0, 1000);
        }
      }
    }
    
    return aboutInfo;
  }

  private findPrivacyLinks(html: string, baseUrl: string): {
    privacyPolicy?: string;
    trustCenter?: string;
    termsOfService?: string;
  } {
    const $ = cheerio.load(html);
    const links: {
      privacyPolicy?: string;
      trustCenter?: string;
      termsOfService?: string;
    } = {};
    
    const privacyPatterns = [
      /privacy/i, /privacy-policy/i, /privacy_policy/i, /data-protection/i, /data-privacy/i, /privacy-statement/i
    ];
    
    const trustPatterns = [
      /trust/i, /trust-center/i, /trust-center/i, /security/i, /data-security/i, /information-security/i, /trust-center/i
    ];
    
    const termsPatterns = [
      /terms/i, /terms-of-service/i, /terms-and-conditions/i, /legal/i, /legal-terms/i, /terms-of-use/i
    ];
    
    // First, try to find links in the footer (common location for legal links)
    const footer = $('footer, .footer, #footer, [class*="footer"]');
    if (footer.length > 0) {
      footer.find('a[href]').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href') || '';
        const text = $el.text().toLowerCase();
        
        // Check for privacy policy links
        if (!links.privacyPolicy && privacyPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.privacyPolicy = new URL(href, baseUrl).href;
        }
        
        // Check for trust center links
        if (!links.trustCenter && trustPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.trustCenter = new URL(href, baseUrl).href;
        }
        
        // Check for terms of service links
        if (!links.termsOfService && termsPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.termsOfService = new URL(href, baseUrl).href;
        }
      });
    }
    
    // If not found in footer, search all links
    if (!links.privacyPolicy || !links.trustCenter || !links.termsOfService) {
      $('a[href]').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href') || '';
        const text = $el.text().toLowerCase();
        
        // Check for privacy policy links
        if (!links.privacyPolicy && privacyPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.privacyPolicy = new URL(href, baseUrl).href;
        }
        
        // Check for trust center links
        if (!links.trustCenter && trustPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.trustCenter = new URL(href, baseUrl).href;
        }
        
        // Check for terms of service links
        if (!links.termsOfService && termsPatterns.some(pattern => pattern.test(href) || pattern.test(text))) {
          links.termsOfService = new URL(href, baseUrl).href;
        }
      });
    }
    
    // Try common privacy policy URLs if not found
    if (!links.privacyPolicy) {
      const commonPrivacyUrls = [
        '/privacy',
        '/privacy-policy',
        '/privacy-statement',
        '/legal/privacy',
        '/terms/privacy'
      ];
      
      for (const url of commonPrivacyUrls) {
        try {
          const fullUrl = new URL(url, baseUrl).href;
          // We could make a quick HEAD request here to check if the URL exists
          links.privacyPolicy = fullUrl;
          break;
        } catch (e) {
          // Invalid URL, continue to next
        }
      }
    }
    
    return links;
  }

  private analyzePrivacyPolicy(html: string): PrivacyAnalysis {
    const $ = cheerio.load(html);
    const text = $.text().toLowerCase();
    
    const analysis: PrivacyAnalysis = {
      dataCollection: [],
      dataSharing: [],
      userRights: [],
      securityMeasures: [],
      compliance: [],
    };
    
    // Data collection patterns
    const collectionKeywords = ['collect', 'gathering', 'obtain', 'receive', 'store'];
    collectionKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        analysis.dataCollection.push(`Data collection mentioned with '${keyword}'`);
      }
    });
    
    // Data sharing patterns
    const sharingKeywords = ['share', 'transfer', 'disclose', 'third party', 'partner'];
    sharingKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        analysis.dataSharing.push(`Data sharing mentioned with '${keyword}'`);
      }
    });
    
    // User rights patterns
    const rightsKeywords = ['right', 'access', 'delete', 'modify', 'opt-out', 'consent'];
    rightsKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        analysis.userRights.push(`User rights mentioned with '${keyword}'`);
      }
    });
    
    // Security patterns
    const securityKeywords = ['security', 'encrypt', 'protect', 'secure', 'safeguard'];
    securityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        analysis.securityMeasures.push(`Security mentioned with '${keyword}'`);
      }
    });
    
    // Compliance patterns
    const complianceKeywords = ['gdpr', 'ccpa', 'california', 'european', 'compliance', 'regulation'];
    complianceKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        analysis.compliance.push(`Compliance mentioned with '${keyword}'`);
      }
    });
    
    return analysis;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  private isFakeOrGeneratedContent(html: string): boolean {
    // Temporarily disabled to avoid false positives on legitimate sites
    return false;

    const text = html.toLowerCase();
    
    // Check for common fake/generated content indicators
    const fakeIndicators = [
      'lorem ipsum',
      'placeholder text',
      'sample content',
      'demo site',
      'test page',
      '404 not found',
      'page not found',
      'access denied',
      'forbidden',
      'maintenance mode',
      'coming soon',
      'under construction',
      'this domain is for sale',
      'domain parking',
      'buy this domain',
      'domain expired',
      'website under construction',
      'site is being updated'
    ];

    // Check for too much AI-generated looking content
    const aiIndicators = [
      'as an ai language model',
      'i am an ai assistant',
      'generated by',
      'ai-generated',
      'chatgpt',
      'openai',
      'artificial intelligence',
      'this content was generated by'
    ];

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[a-z]{50,}/g, // Very long words (unlikely in real content)
      /\b\w{100,}\b/g, // Extremely long words
    ];

    // Check for fake indicators
    for (const indicator of [...fakeIndicators, ...aiIndicators]) {
      if (text.includes(indicator)) {
        return true;
      }
    }

    // Check for suspicious patterns - be very lenient
    for (const pattern of suspiciousPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 20) { // Much higher threshold
        return true;
      }
    }

    // Check if content is too short (likely fake) - be very lenient
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (cleanText.length < 20) { // Much lower threshold
      return true;
    }

    // Check if content is too repetitive - be very lenient
    const words = cleanText.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 0 && uniqueWords.size / words.length < 0.05) { // Much lower threshold
      return true;
    }

    return false;
  }

  private isGenericCompanyName(name: string): boolean {
    const genericNames = [
      'example',
      'demo',
      'test',
      'sample',
      'placeholder',
      'company',
      'corporation',
      'inc',
      'llc',
      'ltd',
      'unknown',
      'website',
      'site'
    ];

    const lowerName = name.toLowerCase();
    return genericNames.some(generic => lowerName.includes(generic));
  }
}
