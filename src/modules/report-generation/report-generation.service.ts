import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as moment from 'moment';
import { WebsiteInfo } from '@/interfaces/website-info.interface';

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  constructor(private configService: ConfigService) {}

  async generateReport(
    websiteInfo: WebsiteInfo,
    format: 'markdown' | 'json' | 'html' = 'markdown',
    outputPath?: string
  ): Promise<string> {
    this.logger.log(`Generating ${format} report for ${websiteInfo.companyName}`);

    try {
      let reportContent: string;
      let fileExtension: string;

      switch (format) {
        case 'markdown':
          reportContent = this.generateMarkdownReport(websiteInfo);
          fileExtension = 'md';
          break;
        case 'json':
          reportContent = this.generateJsonReport(websiteInfo);
          fileExtension = 'json';
          break;
        case 'html':
          reportContent = this.generateHtmlReport(websiteInfo);
          fileExtension = 'html';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Generate filename
      const safeName = websiteInfo.companyName.replace(/[^\w\-_\.]/g, '_');
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const filename = `report_${safeName}_${timestamp}.${fileExtension}`;

      // Determine output path
      const defaultOutputPath = this.configService.get('output.defaultPath');
      const finalOutputPath = outputPath || defaultOutputPath;
      
      // Ensure output directory exists
      await fs.ensureDir(finalOutputPath);
      
      const fullPath = path.join(finalOutputPath, filename);
      
      // Write report to file
      await fs.writeFile(fullPath, reportContent, 'utf8');
      
      this.logger.log(`Report saved to: ${fullPath}`);
      return fullPath;
    } catch (error) {
      this.logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  private generateMarkdownReport(websiteInfo: WebsiteInfo): string {
    const report = `# Website Analysis Report

## Company Information
- **Company Name**: ${websiteInfo.companyName}
- **Main URL**: ${websiteInfo.mainUrl}
- **Analysis Date**: ${moment(websiteInfo.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}

## Privacy & Legal Pages
- **Privacy Policy**: ${websiteInfo.privacyPolicyUrl || 'Not found'}
- **Trust Center**: ${websiteInfo.trustCenterUrl || 'Not found'}
- **Terms of Service**: ${websiteInfo.termsOfServiceUrl || 'Not found'}

## Contact Information
${this.formatContactInfoMarkdown(websiteInfo.contactInfo)}

## About Information
${this.formatAboutInfoMarkdown(websiteInfo.aboutInfo)}

## Privacy Analysis
${websiteInfo.privacySummary || 'No privacy policy analyzed'}

### Data Collection
${this.formatListMarkdown(websiteInfo.dataCollection, 'No data collection information found')}

### Data Sharing
${this.formatListMarkdown(websiteInfo.dataSharing, 'No data sharing information found')}

### User Rights
${this.formatListMarkdown(websiteInfo.userRights, 'No user rights information found')}

## Trust & Security Analysis
${websiteInfo.trustSummary || 'No trust center analyzed'}

### Security Measures
${this.formatListMarkdown(websiteInfo.securityMeasures, 'No security information found')}

### Compliance
${this.formatListMarkdown(websiteInfo.compliance, 'No compliance information found')}

${this.generateAIAnalysisMarkdown(websiteInfo.aiAnalysis)}
`;

    return report;
  }

  private generateJsonReport(websiteInfo: WebsiteInfo): string {
    return JSON.stringify(websiteInfo, null, 2);
  }

  private generateHtmlReport(websiteInfo: WebsiteInfo): string {
    const report = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Analysis Report - ${websiteInfo.companyName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .info-card { background: #f8f9fa; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; }
        .score { font-size: 24px; font-weight: bold; color: #27ae60; }
        .score-container { display: flex; gap: 20px; margin: 20px 0; }
        .score-item { text-align: center; padding: 15px; background: #ecf0f1; border-radius: 5px; flex: 1; }
        .list { list-style-type: none; padding: 0; }
        .list li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .list li:before { content: "• "; color: #3498db; font-weight: bold; }
        .ai-section { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .url { color: #3498db; text-decoration: none; }
        .url:hover { text-decoration: underline; }
        .not-found { color: #e74c3c; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Analysis Report</h1>
        
        <h2>Company Information</h2>
        <div class="info-grid">
            <div class="info-card">
                <strong>Company Name:</strong> ${websiteInfo.companyName}
            </div>
            <div class="info-card">
                <strong>Main URL:</strong> <a href="${websiteInfo.mainUrl}" class="url" target="_blank">${websiteInfo.mainUrl}</a>
            </div>
            <div class="info-card">
                <strong>Analysis Date:</strong> ${moment(websiteInfo.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}
            </div>
        </div>

        <h2>Privacy & Legal Pages</h2>
        <div class="info-grid">
            <div class="info-card">
                <strong>Privacy Policy:</strong> 
                ${websiteInfo.privacyPolicyUrl ? `<a href="${websiteInfo.privacyPolicyUrl}" class="url" target="_blank">Found</a>` : '<span class="not-found">Not found</span>'}
            </div>
            <div class="info-card">
                <strong>Trust Center:</strong> 
                ${websiteInfo.trustCenterUrl ? `<a href="${websiteInfo.trustCenterUrl}" class="url" target="_blank">Found</a>` : '<span class="not-found">Not found</span>'}
            </div>
            <div class="info-card">
                <strong>Terms of Service:</strong> 
                ${websiteInfo.termsOfServiceUrl ? `<a href="${websiteInfo.termsOfServiceUrl}" class="url" target="_blank">Found</a>` : '<span class="not-found">Not found</span>'}
            </div>
        </div>

        <h2>Contact Information</h2>
        ${this.formatContactInfoHtml(websiteInfo.contactInfo)}

        <h2>About Information</h2>
        ${this.formatAboutInfoHtml(websiteInfo.aboutInfo)}

        <h2>Privacy Analysis</h2>
        <p>${websiteInfo.privacySummary || 'No privacy policy analyzed'}</p>

        <h3>Data Collection</h3>
        ${this.formatListHtml(websiteInfo.dataCollection, 'No data collection information found')}

        <h3>Data Sharing</h3>
        ${this.formatListHtml(websiteInfo.dataSharing, 'No data sharing information found')}

        <h3>User Rights</h3>
        ${this.formatListHtml(websiteInfo.userRights, 'No user rights information found')}

        <h2>Trust & Security Analysis</h2>
        <p>${websiteInfo.trustSummary || 'No trust center analyzed'}</p>

        <h3>Security Measures</h3>
        ${this.formatListHtml(websiteInfo.securityMeasures, 'No security information found')}

        <h3>Compliance</h3>
        ${this.formatListHtml(websiteInfo.compliance, 'No compliance information found')}

        ${this.generateAIAnalysisHtml(websiteInfo.aiAnalysis)}
    </div>
</body>
</html>`;

    return report;
  }

  private formatContactInfoMarkdown(contactInfo: any): string {
    if (!contactInfo || Object.keys(contactInfo).length === 0) {
      return 'No contact information found';
    }

    let result = '';
    if (contactInfo.email?.length) {
      result += `**Email:** ${contactInfo.email.join(', ')}\n\n`;
    }
    if (contactInfo.phone?.length) {
      result += `**Phone:** ${contactInfo.phone.join(', ')}\n\n`;
    }
    if (contactInfo.address?.length) {
      result += `**Address:** ${contactInfo.address.join(', ')}\n\n`;
    }
    
    return result || 'No contact information found';
  }

  private formatAboutInfoMarkdown(aboutInfo: any): string {
    if (!aboutInfo || Object.keys(aboutInfo).length === 0) {
      return 'No about information found';
    }

    let result = '';
    if (aboutInfo.title) {
      result += `**Title:** ${aboutInfo.title}\n\n`;
    }
    if (aboutInfo.mainHeading) {
      result += `**Main Heading:** ${aboutInfo.mainHeading}\n\n`;
    }
    if (aboutInfo.description) {
      result += `**Description:** ${aboutInfo.description}\n\n`;
    }
    
    return result || 'No about information found';
  }

  private formatListMarkdown(items: string[], emptyMessage: string): string {
    if (!items || items.length === 0) {
      return `- ${emptyMessage}`;
    }
    return items.map(item => `- ${item}`).join('\n');
  }

  private generateAIAnalysisMarkdown(aiAnalysis?: any): string {
    if (!aiAnalysis) {
      return '\n## AI Analysis\n*AI analysis not available or disabled*\n';
    }

    return `
## 🤖 AI Analysis Results

### Summary
${aiAnalysis.summary}

### Key Findings
${aiAnalysis.keyFindings.map((finding: string) => `- ${finding}`).join('\n')}

### Scores
- **Privacy Score**: ${aiAnalysis.privacyScore}/10
- **Security Score**: ${aiAnalysis.securityScore}/10
- **Compliance Score**: ${aiAnalysis.complianceScore}/10

### Recommendations
${aiAnalysis.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

### Potential Risks
${aiAnalysis.risks.map((risk: string) => `- ${risk}`).join('\n')}

### Data Usage Summary
${aiAnalysis.dataUsageSummary}

### User Rights Summary
${aiAnalysis.userRightsSummary}
`;
  }

  private formatContactInfoHtml(contactInfo: any): string {
    if (!contactInfo || Object.keys(contactInfo).length === 0) {
      return '<p class="not-found">No contact information found</p>';
    }

    let result = '<div class="info-grid">';
    if (contactInfo.email?.length) {
      result += `<div class="info-card"><strong>Email:</strong> ${contactInfo.email.join(', ')}</div>`;
    }
    if (contactInfo.phone?.length) {
      result += `<div class="info-card"><strong>Phone:</strong> ${contactInfo.phone.join(', ')}</div>`;
    }
    if (contactInfo.address?.length) {
      result += `<div class="info-card"><strong>Address:</strong> ${contactInfo.address.join(', ')}</div>`;
    }
    result += '</div>';
    
    return result === '<div class="info-grid"></div>' ? '<p class="not-found">No contact information found</p>' : result;
  }

  private formatAboutInfoHtml(aboutInfo: any): string {
    if (!aboutInfo || Object.keys(aboutInfo).length === 0) {
      return '<p class="not-found">No about information found</p>';
    }

    let result = '<div class="info-grid">';
    if (aboutInfo.title) {
      result += `<div class="info-card"><strong>Title:</strong> ${aboutInfo.title}</div>`;
    }
    if (aboutInfo.mainHeading) {
      result += `<div class="info-card"><strong>Main Heading:</strong> ${aboutInfo.mainHeading}</div>`;
    }
    if (aboutInfo.description) {
      result += `<div class="info-card"><strong>Description:</strong> ${aboutInfo.description}</div>`;
    }
    result += '</div>';
    
    return result === '<div class="info-grid"></div>' ? '<p class="not-found">No about information found</p>' : result;
  }

  private formatListHtml(items: string[], emptyMessage: string): string {
    if (!items || items.length === 0) {
      return `<p class="not-found">${emptyMessage}</p>`;
    }
    return `<ul class="list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
  }

  private generateAIAnalysisHtml(aiAnalysis?: any): string {
    if (!aiAnalysis) {
      return '<h2>AI Analysis</h2><p class="not-found">AI analysis not available or disabled</p>';
    }

    return `
        <div class="ai-section">
            <h2>🤖 AI Analysis Results</h2>
            
            <h3>Summary</h3>
            <p>${aiAnalysis.summary}</p>
            
            <h3>Key Findings</h3>
            <ul class="list">${aiAnalysis.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}</ul>
            
            <h3>Scores</h3>
            <div class="score-container">
                <div class="score-item">
                    <div class="score">${aiAnalysis.privacyScore}/10</div>
                    <strong>Privacy Score</strong>
                </div>
                <div class="score-item">
                    <div class="score">${aiAnalysis.securityScore}/10</div>
                    <strong>Security Score</strong>
                </div>
                <div class="score-item">
                    <div class="score">${aiAnalysis.complianceScore}/10</div>
                    <strong>Compliance Score</strong>
                </div>
            </div>
            
            <h3>Recommendations</h3>
            <ul class="list">${aiAnalysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
            
            <h3>Potential Risks</h3>
            <ul class="list">${aiAnalysis.risks.map((risk: string) => `<li>${risk}</li>`).join('')}</ul>
            
            <h3>Data Usage Summary</h3>
            <p>${aiAnalysis.dataUsageSummary}</p>
            
            <h3>User Rights Summary</h3>
            <p>${aiAnalysis.userRightsSummary}</p>
        </div>
    `;
  }
}
