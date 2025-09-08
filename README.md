# 🤖 AI Website Agent - TypeScript/NestJS

A modern, production-ready AI-powered website analysis agent built with TypeScript, NestJS, and OpenAI. Automatically fetches and analyzes information from company websites, privacy policies, and trust centers.

## ✨ Features

### 🔍 **Comprehensive Website Analysis**
- **Company Information**: Extract company names, contact details, and about information
- **Privacy Policy Detection**: Automatically find and analyze privacy policies
- **Trust Center Analysis**: Locate and evaluate trust centers and security pages
- **Terms of Service**: Identify and process terms of service documents
- **Contact Information**: Extract emails, phone numbers, and addresses

### 🤖 **AI-Powered Analysis**
- **Intelligent Content Analysis**: Uses OpenAI GPT models for deep content understanding
- **Privacy Scoring**: AI-generated privacy scores (1-10) with detailed explanations
- **Security Assessment**: Automated security measure identification and scoring
- **Compliance Analysis**: GDPR, CCPA, and other regulatory compliance detection
- **Risk Assessment**: AI-identified potential privacy and security risks
- **Recommendations**: Actionable improvement suggestions

### 📊 **Advanced Reporting**
- **Multiple Formats**: Markdown, JSON, and HTML report generation
- **Comprehensive Reports**: Detailed analysis with visual summaries
- **Batch Processing**: Analyze multiple websites simultaneously
- **Customizable Output**: Flexible report formatting and content

### 🛠️ **Technical Capabilities**
- **Modern Web Scraping**: Puppeteer for JavaScript-heavy sites
- **Smart Link Detection**: Pattern-based privacy policy and trust center discovery
- **Rate Limiting**: Respectful web scraping with configurable delays
- **Error Handling**: Robust error handling and recovery mechanisms
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 🚀 **Modern Architecture**
- **TypeScript**: Full type safety and modern JavaScript features
- **NestJS**: Scalable, modular framework with dependency injection
- **REST API**: Full-featured API with Swagger documentation
- **CLI Interface**: Command-line interface for easy automation
- **Modular Design**: Clean separation of concerns and easy extensibility

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Chrome browser (for Puppeteer)
- OpenAI API key (for AI-enhanced analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-website-agent-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Basic Usage

#### Command Line Interface

```bash
# Analyze a single website
npm run cli analyze https://example.com

# AI-enhanced analysis
npm run cli analyze https://example.com --ai

# Batch analysis from file
npm run cli batch urls.txt --output reports/

# Interactive mode
npm run cli interactive

# Check service status
npm run cli status
```

#### REST API

```bash
# Start the API server
npm run start:dev

# API will be available at http://localhost:3000
# Swagger documentation at http://localhost:3000/api
```

#### Programmatic Usage

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AnalysisService } from './modules/analysis/analysis.service';

async function analyzeWebsite() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analysisService = app.get(AnalysisService);
  
  const result = await analysisService.analyzeWebsite('https://example.com', {
    useAI: true,
    headless: true,
  });
  
  console.log(result);
  await app.close();
}
```

## 📋 API Endpoints

### Single Website Analysis
```http
POST /analysis/analyze
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "useAI": true,
    "headless": true,
    "timeout": 30000
  }
}
```

### Batch Analysis
```http
POST /analysis/analyze/batch
Content-Type: application/json

{
  "urls": ["https://example1.com", "https://example2.com"],
  "options": {
    "useAI": true,
    "headless": true
  },
  "outputFormat": "markdown",
  "outputPath": "./reports"
}
```

### Service Status
```http
GET /analysis/status
```

### Generate Report
```http
POST /analysis/report
Content-Type: application/json

{
  "websiteInfo": { /* analysis data */ },
  "format": "markdown",
  "outputPath": "./reports"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.3

# Web Scraping Configuration
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
RATE_LIMIT=60
DELAY_BETWEEN_REQUESTS=1000

# Browser Configuration
HEADLESS_MODE=true
BROWSER_WINDOW_SIZE=1920,1080

# Analysis Configuration
ENABLE_AI_ANALYSIS=true
DEFAULT_OUTPUT_FORMAT=markdown

# Output Configuration
DEFAULT_OUTPUT_PATH=./reports
```

## 📊 Report Examples

### Basic Report Structure
```
# Website Analysis Report

## Company Information
- Company Name: Example Corp
- Main URL: https://example.com
- Analysis Date: 2024-01-15 10:30:00

## Privacy & Legal Pages
- Privacy Policy: https://example.com/privacy
- Trust Center: https://example.com/trust
- Terms of Service: https://example.com/terms

## AI Analysis Results
- Privacy Score: 8/10
- Security Score: 7/10
- Compliance Score: 9/10

### Key Findings
- Comprehensive privacy policy found
- GDPR compliance mentioned
- Clear data collection practices
- User rights well documented

### Recommendations
- Consider adding data retention policies
- Enhance security documentation
- Include more specific opt-out procedures
```

## 🏗️ Architecture

### Project Structure
```
src/
├── config/                 # Configuration files
├── dto/                   # Data Transfer Objects
├── interfaces/            # TypeScript interfaces
├── modules/               # Feature modules
│   ├── analysis/          # Main analysis module
│   ├── ai-analysis/       # AI analysis service
│   ├── website-analysis/  # Web scraping service
│   └── report-generation/ # Report generation service
├── app.module.ts          # Main application module
├── main.ts               # Application entry point
└── cli.ts                # Command-line interface
```

### Key Components

- **AnalysisService**: Orchestrates the entire analysis process
- **WebsiteAnalysisService**: Handles web scraping with Puppeteer
- **AIAnalysisService**: Manages OpenAI integration and AI analysis
- **ReportGenerationService**: Generates reports in multiple formats
- **AnalysisController**: REST API endpoints with Swagger documentation

## 🔧 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start in development mode
npm run start:debug        # Start with debugging
npm run build              # Build the application
npm run start:prod         # Start in production mode

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# CLI
npm run cli                # Run CLI interface
npm run cli:build          # Build CLI executable
```

### Adding New Features

1. **Create a new module**:
   ```bash
   nest generate module modules/new-feature
   ```

2. **Create a new service**:
   ```bash
   nest generate service modules/new-feature/new-feature
   ```

3. **Create a new controller**:
   ```bash
   nest generate controller modules/new-feature/new-feature
   ```

## 🛡️ Privacy and Ethics

### Responsible Web Scraping
- **Rate Limiting**: Built-in delays between requests
- **User-Agent Rotation**: Respectful scraping practices
- **Robots.txt Compliance**: Respects website crawling policies
- **Error Handling**: Graceful handling of blocked requests

### Data Protection
- **Local Processing**: All analysis done locally
- **No Data Storage**: No personal data is stored permanently
- **Secure API Calls**: Encrypted communication with OpenAI
- **Configurable Retention**: Control over report storage

## 🐛 Troubleshooting

### Common Issues

1. **Puppeteer Installation Issues**
   ```bash
   # Reinstall Puppeteer
   npm uninstall puppeteer
   npm install puppeteer
   ```

2. **OpenAI API Errors**
   ```bash
   # Check API key
   echo $OPENAI_API_KEY
   # Verify in .env file
   ```

3. **Permission Errors**
   ```bash
   # Make CLI executable
   chmod +x dist/cli.js
   ```

4. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev
   ```

### Debug Mode

Enable verbose logging:
```bash
npm run start:debug
```

## 📈 Performance Optimization

### Speed Improvements
- **Parallel Processing**: Analyze multiple sites simultaneously
- **Caching**: Cache previously analyzed content
- **Selective Analysis**: Focus on specific content types
- **Optimized Parsing**: Efficient HTML parsing strategies

### Memory Management
- **Streaming Processing**: Process large documents in chunks
- **Resource Cleanup**: Automatic cleanup of browser instances
- **Memory Monitoring**: Track and optimize memory usage

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd ai-website-agent-ts

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Run tests
npm run test

# Start development server
npm run start:dev
```

### Code Style
- Follow TypeScript best practices
- Use NestJS decorators and patterns
- Add comprehensive unit tests
- Update API documentation
- Follow conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS**: For the excellent framework and architecture
- **OpenAI**: For providing the GPT models for intelligent analysis
- **Puppeteer**: For web automation capabilities
- **Cheerio**: For HTML parsing
- **TypeScript**: For type safety and developer experience

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation at `/api`
- Check the service status with `npm run cli status`

---

**Note**: This tool is designed for educational and research purposes. Always respect website terms of service and robots.txt files when scraping websites.
