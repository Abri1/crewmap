import { useState } from 'react'
import './TraccarSetup.css'

interface TraccarSetupProps {
  driverId: string
  nickname: string
  onComplete: () => void
}

export const TraccarSetup = ({ driverId, onComplete }: TraccarSetupProps) => {
  const [copied, setCopied] = useState<'id' | 'url' | null>(null)
  const serverUrl = `${window.location.origin}/api/traccar-webhook`

  const handleCopy = async (text: string, type: 'id' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="traccar-setup-overlay">
      <div className="traccar-setup-container">
        <div className="setup-header">
          <div className="setup-icon">📍</div>
          <h1>Setup GPS Tracking</h1>
          <p>Install Traccar to share your location with the crew</p>
        </div>

        {/* Step 1: Download */}
        <div className="setup-section">
          <div className="section-title">
            <span className="step-badge">1</span>
            <h2>Download Traccar App</h2>
          </div>
          <div className="download-grid">
            <a
              href="https://apps.apple.com/app/traccar-client/id843156974"
              target="_blank"
              rel="noopener noreferrer"
              className="download-card"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="download-info">
                <div className="download-label">iOS</div>
                <div className="download-name">App Store</div>
              </div>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=org.traccar.client"
              target="_blank"
              rel="noopener noreferrer"
              className="download-card"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m2.35-1.35c.5.28.84.76.84 1.35s-.34 1.07-.84 1.35l-1.98 1.11-2.47-2.47 2.47-2.47 1.98 1.13m-11.11-11.3l10.76 6.22-2.27 2.27-8.49-8.49z"/>
              </svg>
              <div className="download-info">
                <div className="download-label">Android</div>
                <div className="download-name">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Step 2: Configure */}
        <div className="setup-section">
          <div className="section-title">
            <span className="step-badge">2</span>
            <h2>Enter These Settings in Traccar</h2>
          </div>

          <div className="config-card">
            <div className="config-item">
              <label>Device Identifier (or "Identifier")</label>
              <div className="input-copy-group">
                <input
                  type="text"
                  value={driverId}
                  readOnly
                  className="config-input"
                />
                <button
                  onClick={() => handleCopy(driverId, 'id')}
                  className={`copy-btn ${copied === 'id' ? 'copied' : ''}`}
                >
                  {copied === 'id' ? '✓' : '📋'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px', marginBottom: '0' }}>
                In Traccar, this field might be called "Device Identifier", "Identifier", or "Device ID"
              </p>
            </div>

            <div className="config-item">
              <label>Server URL</label>
              <div className="input-copy-group">
                <input
                  type="text"
                  value={serverUrl}
                  readOnly
                  className="config-input"
                />
                <button
                  onClick={() => handleCopy(serverUrl, 'url')}
                  className={`copy-btn ${copied === 'url' ? 'copied' : ''}`}
                >
                  {copied === 'url' ? '✓' : '📋'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px', marginBottom: '0' }}>
                In Traccar, this is the "Server URL" or "Server Address" field
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Configure Traccar Settings */}
        <div className="setup-section">
          <div className="section-title">
            <span className="step-badge">3</span>
            <h2>Configure Traccar Settings</h2>
          </div>
          <ul className="checklist">
            <li>Set Frequency to 5 seconds (for real-time tracking)</li>
            <li>Set Distance to 0 meters</li>
            <li>Set Angle to 0 degrees</li>
            <li>Keep Location Provider on "Mixed"</li>
          </ul>
        </div>

        {/* Step 4: Enable */}
        <div className="setup-section">
          <div className="section-title">
            <span className="step-badge">4</span>
            <h2>Enable Tracking</h2>
          </div>
          <ul className="checklist">
            <li>Grant location permission (select "Always")</li>
            <li>Toggle service status to ON (green)</li>
            <li>You'll see a tracking notification appear</li>
            <li>Check status shows "Location update..."</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="setup-actions">
          <button onClick={onComplete} className="btn-primary">
            Done, Start Tracking
          </button>
          <button onClick={onComplete} className="btn-secondary">
            Skip for Now
          </button>
        </div>

        <div className="setup-tip">
          💡 You can access these settings anytime from the menu
        </div>
      </div>
    </div>
  )
}
