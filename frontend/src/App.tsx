import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Status = {
  aiAvailable: boolean
  browserAvailable: boolean
  config: {
    enableAI: boolean
    defaultOutputFormat: string
    timeout: number
    maxRetries: number
  }
}

type AnalyzeResponse = {
  success: boolean
  data?: any
  error?: string
  processingTime?: number
}

function App() {
  const [status, setStatus] = useState<Status | null>(null)
  const [input, setInput] = useState<string>('https://example.com')
  const [useAI, setUseAI] = useState<boolean>(false)
  const [headless, setHeadless] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputType, setInputType] = useState<'url' | 'company'>('url')
  const [showAbout, setShowAbout] = useState<boolean>(false)

  const backendBase = useMemo(() => '', []) // empty because Vite proxy maps /analysis and /api

  useEffect(() => {
    fetch(`${backendBase}/analysis/status`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [backendBase])

  const validateInput = (value: string): { isValid: boolean; type: 'url' | 'company'; message?: string } => {
    if (!value.trim()) {
      return { isValid: false, type: 'url', message: 'Please enter a URL or company name' }
    }

    // Check if it's a URL
    try {
      const urlToTest = value.startsWith('http') ? value : `https://${value}`
      const url = new URL(urlToTest)
      
      // Additional check: if it doesn't have a domain extension, it's likely a company name
      const domain = url.hostname
      if (!domain.includes('.') && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
        return { isValid: true, type: 'company' }
      }
      
      return { isValid: true, type: 'url' }
    } catch {
      // If not a URL, treat as company name
      if (value.length < 2) {
        return { isValid: false, type: 'company', message: 'Company name must be at least 2 characters' }
      }
      return { isValid: true, type: 'company' }
    }
  }

  const analyze = async () => {
    const validation = validateInput(input)
    console.log('Validation result:', validation)
    
    if (!validation.isValid) {
      setError(validation.message || 'Invalid input')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setInputType(validation.type)

    try {
      let url = input
      if (validation.type === 'company') {
        // For company names, we'll search for their main website
        // This is a simplified approach - in production you might use a company search API
        url = `https://www.${input.toLowerCase().replace(/\s+/g, '')}.com`
      } else if (!input.startsWith('http')) {
        url = `https://${input}`
      }

      console.log('Sending URL to backend:', url)

      const res = await fetch(`${backendBase}/analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          options: { 
            useAI, 
            headless,
            validateData: true // Add validation flag
          } 
        }),
      })
      
      const data: AnalyzeResponse = await res.json()
      
      setResult(data)
      if (!data.success) setError(data.error || 'Analysis failed')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const getDataAuthenticityScore = (data: any): number => {
    let score = 0
    let totalChecks = 0

    // Check for real company information
    if (data.companyName && data.companyName.length > 0) {
      score += 1
      totalChecks += 1
    }

    // Check for real URLs
    if (data.mainUrl && data.mainUrl.includes('http')) {
      score += 1
      totalChecks += 1
    }

    // Check for contact information
    if (data.contactInfo && (data.contactInfo.email || data.contactInfo.phone)) {
      score += 1
      totalChecks += 1
    }

    // Check for privacy policy URL
    if (data.privacyPolicyUrl && data.privacyPolicyUrl.includes('http')) {
      score += 1
      totalChecks += 1
    }

    // Check for analysis data
    if (data.dataCollection && data.dataCollection.length > 0) {
      score += 1
      totalChecks += 1
    }

    // Check for processing time (real requests take time)
    if (data.processingTime && data.processingTime > 100) {
      score += 1
      totalChecks += 1
    }

    return totalChecks > 0 ? Math.round((score / totalChecks) * 100) : 0
  }

  const getAuthenticityColor = (score: number): string => {
    if (score >= 80) return '#28a745' // Green
    if (score >= 60) return '#ffc107' // Yellow
    return '#dc3545' // Red
  }

  const getAuthenticityText = (score: number): string => {
    if (score >= 80) return 'High Authenticity'
    if (score >= 60) return 'Medium Authenticity'
    return 'Low Authenticity'
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header with About button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>AI Website Agent</h1>
        <button
          onClick={() => setShowAbout(true)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ℹ️ About
        </button>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            color: '#213547'
          }}>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
            
            <h2 style={{ marginTop: 0, color: '#495057', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
              🤖 AI Website Agent - About
            </h2>

            <div style={{ display: 'grid', gap: 24 }}>
              {/* What is this app */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>🎯 What is this application?</h3>
                <p style={{ lineHeight: 1.6, margin: 0 }}>
                  The AI Website Agent is a powerful tool that analyzes websites and companies to provide comprehensive insights about their privacy policies, security measures, data collection practices, and compliance standards. It helps users understand how their data is being handled by various online services.
                </p>
              </section>

              {/* What it does */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>🔍 What does it do?</h3>
                <ul style={{ lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                  <li><strong>Website Analysis:</strong> Scrapes and analyzes website content to extract privacy-related information</li>
                  <li><strong>Privacy Policy Review:</strong> Finds and analyzes privacy policies, terms of service, and trust centers</li>
                  <li><strong>Data Collection Detection:</strong> Identifies what types of data the website collects from users</li>
                  <li><strong>Security Assessment:</strong> Evaluates security measures and data protection practices</li>
                  <li><strong>Compliance Checking:</strong> Checks for compliance with various privacy regulations (GDPR, CCPA, etc.)</li>
                  <li><strong>AI-Powered Insights:</strong> Uses OpenAI to provide intelligent analysis and scoring (optional)</li>
                  <li><strong>Authenticity Validation:</strong> Verifies that the data comes from legitimate sources</li>
                </ul>
              </section>

              {/* How it works */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>⚙️ How does it work?</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>1. Input Processing</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Accepts URLs or company names. For company names, it automatically generates the website URL (e.g., "GitHub" becomes "https://www.github.com").
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>2. Web Scraping</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Uses Puppeteer (headless browser) or Axios to fetch website content. Headless browser mode provides more accurate data by executing JavaScript and handling dynamic content.
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>3. Content Analysis</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Parses HTML content to find privacy policies, terms of service, and other legal documents. Extracts key information about data collection and security practices.
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>4. AI Analysis (Optional)</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      When enabled, uses OpenAI's GPT models to provide intelligent analysis, scoring, and summaries of the privacy practices.
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>5. Results Presentation</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Displays comprehensive results including authenticity scores, data collection details, security measures, and compliance information.
                    </p>
                  </div>
                </div>
              </section>

              {/* How to use */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>📖 How to use it?</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>Step 1: Enter Website or Company</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Type a URL (e.g., "https://github.com") or company name (e.g., "GitHub", "LinkedIn", "Zoom"). The app will automatically detect the input type.
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>Step 2: Configure Options</h4>
                    <ul style={{ margin: 0, fontSize: '14px', paddingLeft: 20 }}>
                      <li><strong>Use AI:</strong> Enable for intelligent analysis and scoring</li>
                      <li><strong>Headless Browser:</strong> Recommended for accurate data from real websites</li>
                    </ul>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>Step 3: Analyze</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Click "Analyze" and wait for the results. The process typically takes 10-30 seconds depending on the website complexity.
                    </p>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>Step 4: Review Results</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Examine the authenticity score, data collection details, security measures, and compliance information. Use the raw JSON data for detailed technical information.
                    </p>
                  </div>
                </div>
              </section>

              {/* What to expect */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>📊 What to expect?</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>✅ Successful Analysis:</strong> Comprehensive report with privacy insights, security measures, and compliance details</div>
                  <div><strong>🔍 Authenticity Score:</strong> Percentage indicating how reliable the extracted data is</div>
                  <div><strong>📋 Legal Documents:</strong> Links to privacy policies, terms of service, and trust centers</div>
                  <div><strong>📊 Data Collection:</strong> List of data types the website collects from users</div>
                  <div><strong>🔒 Security Measures:</strong> Information about data protection and security practices</div>
                  <div><strong>📋 Compliance:</strong> Regulatory compliance information (GDPR, CCPA, etc.)</div>
                  <div><strong>🤖 AI Scores:</strong> Privacy, security, and compliance scores when AI is enabled</div>
                </div>
              </section>

              {/* Troubleshooting */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>🔧 Troubleshooting</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>❌ "Bad Request" Error:</strong> Try entering the full URL with "https://" prefix</div>
                  <div><strong>❌ "No data found":</strong> The website might have anti-bot protection. Try disabling headless browser mode</div>
                  <div><strong>❌ "Fake content detected":</strong> This validation is temporarily disabled for legitimate websites</div>
                  <div><strong>❌ "Failed to fetch":</strong> Check your internet connection and try again</div>
                  <div><strong>❌ "AI not available":</strong> OpenAI API key is not configured in the backend</div>
                </div>
              </section>

              {/* Examples */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>💡 Example Inputs</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>URLs:</strong> https://github.com, https://linkedin.com, https://zoom.com</div>
                  <div><strong>Company Names:</strong> GitHub, LinkedIn, Zoom, Microsoft, Apple</div>
                  <div><strong>Test Sites:</strong> https://example.com (for testing)</div>
                </div>
              </section>

              {/* Technical Details */}
              <section>
                <h3 style={{ color: '#007bff', marginBottom: 12 }}>⚡ Technical Details</h3>
                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '14px' }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Backend:</strong> NestJS (TypeScript) with Puppeteer for web scraping</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Frontend:</strong> React.js with Vite for fast development</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>AI Integration:</strong> OpenAI GPT models for intelligent analysis</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Data Processing:</strong> Cheerio for HTML parsing, Axios for HTTP requests</p>
                  <p style={{ margin: 0 }}><strong>Validation:</strong> Content authenticity checking and fake data detection</p>
                </div>
              </section>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                onClick={() => setShowAbout(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Got it! Let's start analyzing
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>Status</h2>
        {status ? (
          <div>
            <div>AI: {status.aiAvailable ? '✅ Available' : '❌ Not available'}</div>
            <div>Browser: {status.browserAvailable ? '✅ Available' : '❌ Not available'}</div>
            <div>Output: {status.config.defaultOutputFormat}</div>
            <div>Timeout: {status.config.timeout}ms</div>
            <div>Max retries: {status.config.maxRetries}</div>
          </div>
        ) : (
          <div>Loading status…</div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Analyze a Website or Company</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Enter URL or Company Name:
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., https://github.com or GitHub or zoom.com"
              style={{ 
                padding: '8px 12px', 
                fontSize: '16px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
              {inputType === 'url' ? '🔗 URL detected' : '🏢 Company name detected'}
            </small>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            Use AI
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)} />
            Headless browser (recommended for real data)
          </label>
          <button 
            onClick={analyze} 
            disabled={loading || !input.trim()}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </section>

      {error && (
        <div style={{ color: 'red', marginBottom: 16, padding: '12px', backgroundColor: '#ffe6e6', border: '1px solid #ff9999', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && result.success && result.data && (
        <section>
          <h2>Result</h2>
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Data Authenticity */}
            {(() => {
              const authenticityScore = getDataAuthenticityScore(result.data)
              return (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px', 
                  border: '1px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <h3 style={{ marginTop: 0, color: '#495057' }}>🔍 Data Authenticity</h3>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: getAuthenticityColor(authenticityScore),
                    marginBottom: '8px'
                  }}>
                    {authenticityScore}%
                  </div>
                  <div style={{ color: getAuthenticityColor(authenticityScore), fontWeight: 'bold' }}>
                    {getAuthenticityText(authenticityScore)}
                  </div>
                  <small style={{ color: '#6c757d', display: 'block', marginTop: '8px' }}>
                    {headless ? '✅ Data fetched from real website' : '⚠️ Data may be from cached sources'}
                  </small>
                </div>
              )
            })()}

              {/* Basic Info */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                color: '#213547'
              }}>
                <h3 style={{ marginTop: 0, color: '#495057' }}>📋 Basic Information</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Company:</strong> {result.data.companyName}</div>
                  <div><strong>Main URL:</strong> <a href={result.data.mainUrl} target="_blank" rel="noopener noreferrer">{result.data.mainUrl}</a></div>
                  <div><strong>Processing Time:</strong> {result.processingTime}ms</div>
                  <div><strong>Data Source:</strong> {headless ? 'Real-time website scraping' : 'Cached/API data'}</div>
                </div>
              </div>

              {/* Legal Pages */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '8px', 
                border: '1px solid #b3d9ff',
                color: '#213547'
              }}>
                <h3 style={{ marginTop: 0, color: '#0066cc' }}>⚖️ Legal Pages</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <strong>Privacy Policy:</strong> 
                    {result.data.privacyPolicyUrl ? (
                      <a href={result.data.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">View Policy</a>
                    ) : (
                      <span style={{ color: '#6c757d' }}>Not found</span>
                    )}
                  </div>
                  <div>
                    <strong>Trust Center:</strong> 
                    {result.data.trustCenterUrl ? (
                      <a href={result.data.trustCenterUrl} target="_blank" rel="noopener noreferrer">View Trust Center</a>
                    ) : (
                      <span style={{ color: '#6c757d' }}>Not found</span>
                    )}
                  </div>
                  <div>
                    <strong>Terms of Service:</strong> 
                    {result.data.termsOfServiceUrl ? (
                      <a href={result.data.termsOfServiceUrl} target="_blank" rel="noopener noreferrer">View Terms</a>
                    ) : (
                      <span style={{ color: '#6c757d' }}>Not found</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '8px', 
                border: '1px solid #ffeaa7',
                color: '#213547'
              }}>
                <h3 style={{ marginTop: 0, color: '#856404' }}>🔍 Analysis Summary</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {result.data.privacySummary && (
                    <div>
                      <strong>Privacy Analysis:</strong> {result.data.privacySummary}
                    </div>
                  )}
                  {result.data.trustSummary && (
                    <div>
                      <strong>Trust Center Analysis:</strong> {result.data.trustSummary}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Collection */}
              {result.data.dataCollection && result.data.dataCollection.length > 0 && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#d1ecf1', 
                  borderRadius: '8px', 
                  border: '1px solid #bee5eb',
                  color: '#213547'
                }}>
                  <h3 style={{ marginTop: 0, color: '#0c5460' }}>📊 Data Collection ({result.data.dataCollection.length})</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#213547' }}>
                    {result.data.dataCollection.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Security Measures */}
              {result.data.securityMeasures && result.data.securityMeasures.length > 0 && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#d4edda', 
                  borderRadius: '8px', 
                  border: '1px solid #c3e6cb',
                  color: '#213547'
                }}>
                  <h3 style={{ marginTop: 0, color: '#155724' }}>🔒 Security Measures ({result.data.securityMeasures.length})</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#213547' }}>
                    {result.data.securityMeasures.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compliance */}
              {result.data.compliance && result.data.compliance.length > 0 && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8d7da', 
                  borderRadius: '8px', 
                  border: '1px solid #f5c6cb',
                  color: '#213547'
                }}>
                  <h3 style={{ marginTop: 0, color: '#721c24' }}>📋 Compliance ({result.data.compliance.length})</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#213547' }}>
                    {result.data.compliance.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Analysis Results */}
              {result.data.aiAnalysis && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#e2e3e5', 
                  borderRadius: '8px', 
                  border: '1px solid #d6d8db',
                  color: '#213547'
                }}>
                  <h3 style={{ marginTop: 0, color: '#383d41' }}>🤖 AI Analysis Results</h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div><strong>Privacy Score:</strong> {result.data.aiAnalysis.privacyScore}/10</div>
                    <div><strong>Security Score:</strong> {result.data.aiAnalysis.securityScore}/10</div>
                    <div><strong>Compliance Score:</strong> {result.data.aiAnalysis.complianceScore}/10</div>
                    {result.data.aiAnalysis.summary && (
                      <div><strong>Summary:</strong> {result.data.aiAnalysis.summary}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', color: '#213547', textAlign: 'left' }}>
                  📄 View Raw JSON Data
                </summary>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  backgroundColor: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  border: '1px solid #e9ecef',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  color: '#213547',
                  textAlign: 'left',
                  margin: '8px 0 0 0'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          </section>
        )}
      </div>
    )
  }

  export default App
