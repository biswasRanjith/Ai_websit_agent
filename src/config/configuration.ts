export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
  },
  
  // Web Scraping Configuration
  scraping: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    userAgentRotation: process.env.USER_AGENT_ROTATION === 'true',
    rateLimit: parseInt(process.env.RATE_LIMIT, 10) || 60,
    delayBetweenRequests: parseInt(process.env.DELAY_BETWEEN_REQUESTS, 10) || 1000,
  },
  
  // Browser Configuration
  browser: {
    headless: process.env.HEADLESS_MODE !== 'false',
    windowSize: process.env.BROWSER_WINDOW_SIZE || '1920,1080',
    userAgent: process.env.DEFAULT_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  
  // Analysis Configuration
  analysis: {
    enableAI: process.env.ENABLE_AI_ANALYSIS !== 'false',
    saveRawData: process.env.SAVE_RAW_DATA === 'true',
    defaultOutputFormat: process.env.DEFAULT_OUTPUT_FORMAT || 'markdown',
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/agent.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },
  
  // Output Configuration
  output: {
    defaultPath: process.env.DEFAULT_OUTPUT_PATH || './reports',
    reportTemplatePath: process.env.REPORT_TEMPLATE_PATH || './templates',
  },
});
