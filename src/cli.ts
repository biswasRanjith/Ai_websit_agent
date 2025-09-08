#!/usr/bin/env node

import { Command } from 'commander';
// import * as chalk from 'chalk';
// import ora from 'ora';
// import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AnalysisService } from './modules/analysis/analysis.service';

const program = new Command();

program
  .name('ai-website-agent')
  .description('AI-powered website analysis agent for privacy policies and trust centers')
  .version('1.0.0');

// Single website analysis command
program
  .command('analyze <url>')
  .description('Analyze a single website')
  .option('-a, --ai', 'Enable AI analysis (requires OpenAI API key)')
  .option('-o, --output <path>', 'Output directory for reports')
  .option('-f, --format <format>', 'Output format (markdown, json, html)', 'markdown')
  .option('--no-headless', 'Run browser in non-headless mode')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (url: string, options: any) => {
    console.log('Initializing analysis service...');
    
    try {
      // Create NestJS application context
      const app = await NestFactory.createApplicationContext(AppModule);
      const analysisService = app.get(AnalysisService);
      
      console.log(`Analyzing ${url}...`);
      
      const result = await analysisService.analyzeWebsite(url, {
        useAI: options.ai,
        headless: options.headless,
        timeout: parseInt(options.timeout),
      });
      
      if (result.success && result.data) {
        console.log(`✅ Analysis completed for ${result.data.companyName}`);
        
        // Generate report if output path is specified
        if (options.output) {
          const reportPath = await analysisService.generateReport(
            result.data,
            options.format,
            options.output
          );
          console.log(`📄 Report saved to: ${reportPath}`);
        }
        
        // Print summary
        printAnalysisSummary(result.data, options.ai);
      } else {
        console.log(`❌ Analysis failed: ${result.error}`);
        process.exit(1);
      }
      
      await app.close();
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Batch analysis command
program
  .command('batch <file>')
  .description('Analyze multiple websites from a file (one URL per line)')
  .option('-a, --ai', 'Enable AI analysis (requires OpenAI API key)')
  .option('-o, --output <path>', 'Output directory for reports')
  .option('-f, --format <format>', 'Output format (markdown, json, html)', 'markdown')
  .option('--no-headless', 'Run browser in non-headless mode')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (file: string, options: any) => {
    console.log('Reading URLs file...');
    
    try {
      // Check if file exists
      if (!await fs.pathExists(file)) {
        console.log(`❌ File not found: ${file}`);
        process.exit(1);
      }
      
      // Read URLs from file
      const content = await fs.readFile(file, 'utf8');
      const urls = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      if (urls.length === 0) {
        console.log('❌ No valid URLs found in file');
        process.exit(1);
      }
      
      console.log(`Found ${urls.length} URLs to analyze`);
      
      // Create NestJS application context
      const app = await NestFactory.createApplicationContext(AppModule);
      const analysisService = app.get(AnalysisService);
      
      console.log('Starting batch analysis...');
      
      const result = await analysisService.analyzeBatch({
        urls,
        options: {
          useAI: options.ai,
          headless: options.headless,
          timeout: parseInt(options.timeout),
        },
        outputFormat: options.format,
        outputPath: options.output,
      });
      
      console.log(`✅ Batch analysis completed: ${result.successful}/${result.total} successful`);
      
      // Print batch summary
      printBatchSummary(result);
      
      await app.close();
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Interactive mode command (disabled due to inquirer ESM issues)
/*
program
  .command('interactive')
  .description('Run in interactive mode')
  .action(async () => {
    console.log('🤖 AI Website Agent - Interactive Mode');
    console.log('Enter website URLs to analyze (type "done" when finished)\n');
    
    const urls: string[] = [];
    
    while (true) {
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter website URL (or "done" to finish):',
          validate: (input: string) => {
            if (input.toLowerCase() === 'done') return true;
            if (!input.trim()) return 'Please enter a valid URL';
            return true;
          },
        },
      ]);
      
      if (url.toLowerCase() === 'done') break;
      urls.push(url.trim());
    }
    
    if (urls.length === 0) {
      console.log('No URLs provided. Exiting.');
      return;
    }
    
    const { options } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useAI',
        message: 'Enable AI analysis? (requires OpenAI API key)',
        default: true,
      },
      {
        type: 'confirm',
        name: 'headless',
        message: 'Run browser in headless mode?',
        default: true,
      },
      {
        type: 'list',
        name: 'format',
        message: 'Select output format:',
        choices: ['markdown', 'json', 'html'],
        default: 'markdown',
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output directory (leave empty for default):',
        default: './reports',
      },
    ]);
    
    console.log('Starting analysis...');
    
    try {
      const app = await NestFactory.createApplicationContext(AppModule);
      const analysisService = app.get(AnalysisService);
      
      if (urls.length === 1) {
        // Single URL analysis
        const result = await analysisService.analyzeWebsite(urls[0], {
          useAI: options.useAI,
          headless: options.headless,
        });
        
        if (result.success && result.data) {
          console.log(`✅ Analysis completed for ${result.data.companyName}`);
          
          if (options.outputPath) {
            const reportPath = await analysisService.generateReport(
              result.data,
              options.format,
              options.outputPath
            );
            console.log(`📄 Report saved to: ${reportPath}`);
          }
          
          printAnalysisSummary(result.data, options.useAI);
        } else {
          console.log(`❌ Analysis failed: ${result.error}`);
        }
      } else {
        // Batch analysis
        const result = await analysisService.analyzeBatch({
          urls,
          options: {
            useAI: options.useAI,
            headless: options.headless,
          },
          outputFormat: options.format,
          outputPath: options.outputPath,
        });
        
        console.log(`✅ Batch analysis completed: ${result.successful}/${result.total} successful`);
        printBatchSummary(result);
      }
      
      await app.close();
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });
*/

// Status command
program
  .command('status')
  .description('Show service status and configuration')
  .action(async () => {
    console.log('Checking service status...');
    
    try {
      const app = await NestFactory.createApplicationContext(AppModule);
      const analysisService = app.get(AnalysisService);
      
      const status = analysisService.getAnalysisStatus();
      
      console.log('✅ Service status retrieved');
      
      console.log('\n🔧 Service Status:');
      console.log(`AI Analysis: ${status.aiAvailable ? '✅ Available' : '❌ Not available'}`);
      console.log(`Browser: ${status.browserAvailable ? '✅ Available' : '❌ Not available'}`);
      
              console.log('\n⚙️  Configuration:');
        console.log(`AI Analysis Enabled: ${status.config.enableAI ? 'Yes' : 'No'}`);
        console.log(`Default Output Format: ${status.config.defaultOutputFormat}`);
        console.log(`Request Timeout: ${status.config.timeout}ms`);
        console.log(`Max Retries: ${status.config.maxRetries}`);
      
      await app.close();
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });

function printAnalysisSummary(websiteInfo: any, useAI: boolean) {
  console.log('\n📊 Analysis Summary:');
  console.log(`🏢 Company: ${websiteInfo.companyName}`);
  console.log(`🔒 Privacy Policy: ${websiteInfo.privacyPolicyUrl ? '✅ Found' : '❌ Not found'}`);
  console.log(`🛡️  Trust Center: ${websiteInfo.trustCenterUrl ? '✅ Found' : '❌ Not found'}`);
  console.log(`📈 Data Collection Points: ${websiteInfo.dataCollection.length}`);
  console.log(`🔐 Security Measures: ${websiteInfo.securityMeasures.length}`);
  console.log(`📋 Compliance Mentions: ${websiteInfo.compliance.length}`);
  
  if (useAI && websiteInfo.aiAnalysis) {
    console.log('\n🤖 AI Analysis Results:');
    console.log(`Privacy Score: ${websiteInfo.aiAnalysis.privacyScore}/10`);
    console.log(`Security Score: ${websiteInfo.aiAnalysis.securityScore}/10`);
    console.log(`Compliance Score: ${websiteInfo.aiAnalysis.complianceScore}/10`);
  }
}

function printBatchSummary(result: any) {
  console.log('\n📊 Batch Analysis Summary:');
  console.log(`✅ Successful: ${result.successful}`);
  console.log(`❌ Failed: ${result.failed}`);
  
  if (result.summary.averagePrivacyScore) {
    console.log('\n🏆 Average Scores:');
    console.log(`Privacy: ${result.summary.averagePrivacyScore}/10`);
    console.log(`Security: ${result.summary.averageSecurityScore}/10`);
    console.log(`Compliance: ${result.summary.averageComplianceScore}/10`);
  }
  
  if (result.summary.topCompanies.length > 0) {
    console.log('\n🏢 Top Companies:');
    result.summary.topCompanies.forEach((company: string, index: number) => {
      console.log(`${index + 1}. ${company}`);
    });
  }
}

program.parse();
