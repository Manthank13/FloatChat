import { useState, useEffect, useRef } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const SUGGESTED_QUERIES = [
  "What is the salinity near Chennai at 100 meters?",
  "Show Argo floats operating in the Bay of Bengal.",
  "What is the average temperature near Kochi between 50 and 200m?",
  "Compare salinity in the Arabian Sea and Bay of Bengal.",
  "What is the mixed layer depth near Chennai?"
]

export default function App() {
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => 'sess-' + Math.random().toString(36).substring(2, 9))
  const [backendHealthy, setBackendHealthy] = useState(null)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'indicators'
  const messagesEndRef = useRef(null)

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setBackendHealthy(data.status === 'ok' || data.status === 'healthy'))
      .catch(() => setBackendHealthy(false))
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (queryText) => {
    const query = (queryText || inputQuery).trim()
    if (!query || loading) return

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          session_id: sessionId,
          use_llm: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        data: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        isError: true,
        text: `Error processing query: ${err.message}. Please verify the FastAPI backend is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleResetSession = () => {
    const newId = 'sess-' + Math.random().toString(36).substring(2, 9)
    setSessionId(newId)
    setMessages([])
  }

  return (
    <div className="floatchat-app">
      {/* Header */}
      <header className="floatchat-header">
        <div className="brand-group">
          <div className="logo-icon">🌊</div>
          <div>
            <h1 className="brand-title">FloatChat</h1>
            <p className="brand-tagline">Ask the Ocean. Understand the Risk.</p>
          </div>
        </div>

        <div className="status-group">
          <div className={`health-pill ${backendHealthy ? 'online' : backendHealthy === false ? 'offline' : 'checking'}`}>
            <span className="dot"></span>
            {backendHealthy ? 'API Online' : backendHealthy === false ? 'API Offline' : 'Connecting...'}
          </div>
          <button className="session-btn" onClick={handleResetSession} title="Clear conversation memory">
            🔄 New Session <span className="session-id">({sessionId})</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="floatchat-main">
        {messages.length === 0 ? (
          <div className="welcome-hero">
            <div className="hero-badge">ARGO GLOBAL DATA ASSEMBLY CENTER • SCIENTIFIC AI</div>
            <h2>Conversational Ocean Intelligence</h2>
            <p className="hero-desc">
              Query real-time and archival ARGO profiling floats, compute thermoclines and mixed layer depths,
              and analyze marine climate anomalies across the global ocean.
            </p>

            <div className="suggestions-container">
              <p className="suggestions-label">Try asking:</p>
              <div className="suggestions-grid">
                {SUGGESTED_QUERIES.map((q, idx) => (
                  <button key={idx} className="suggestion-chip" onClick={() => handleSend(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-thread">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="message-avatar">
                  {msg.sender === 'user' ? '👤' : '🌊'}
                </div>

                <div className="message-bubble">
                  {msg.sender === 'user' ? (
                    <div className="user-text">{msg.text}</div>
                  ) : msg.isError ? (
                    <div className="error-text">⚠️ {msg.text}</div>
                  ) : (
                    <div className="ai-response-content">
                      {/* Markdown Answer */}
                      <div className="answer-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.data.answer}
                      </div>

                      {/* Key Findings */}
                      {msg.data.key_findings && msg.data.key_findings.length > 0 && (
                        <div className="findings-box">
                          <div className="findings-title">Key Findings</div>
                          <ul>
                            {msg.data.key_findings.map((finding, idx) => (
                              <li key={idx}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ARGO Float Citations */}
                      {msg.data.citations && msg.data.citations.length > 0 && (
                        <div className="citations-box">
                          <div className="citations-title">Verified ARGO Citations ({msg.data.citations.length})</div>
                          <div className="citations-list">
                            {msg.data.citations.map((c, idx) => (
                              <div key={idx} className="citation-pill">
                                <span className="float-id">WMO #{c.platform_id}</span>
                                {c.cycle_number && <span className="cycle">Cycle {c.cycle_number}</span>}
                                {c.distance_km != null && <span className="dist">{c.distance_km.toFixed(1)} km</span>}
                                <span className="coords">({c.latitude.toFixed(2)}°, {c.longitude.toFixed(2)}°)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Depth Profile Chart Table Preview */}
                      {msg.data.chart_data && msg.data.chart_data.data_points && msg.data.chart_data.data_points.length > 0 && (
                        <div className="chart-preview-box">
                          <div className="chart-title">📊 {msg.data.chart_data.title}</div>
                          <div className="data-table-wrapper">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Depth (m)</th>
                                  <th>{msg.data.chart_data.parameter} ({msg.data.chart_data.unit})</th>
                                  <th>Float WMO</th>
                                </tr>
                              </thead>
                              <tbody>
                                {msg.data.chart_data.data_points.slice(0, 8).map((pt, idx) => (
                                  <tr key={idx}>
                                    <td>{pt.depth_m.toFixed(1)}m</td>
                                    <td className="val-cell">{pt.value.toFixed(2)}</td>
                                    <td>#{pt.platform_id}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {msg.data.chart_data.data_points.length > 8 && (
                              <div className="table-more">
                                + {msg.data.chart_data.data_points.length - 8} deeper observation levels
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Suggestions */}
                      {msg.data.follow_up_suggestions && msg.data.follow_up_suggestions.length > 0 && (
                        <div className="followup-box">
                          <span className="followup-label">Follow-up:</span>
                          {msg.data.follow_up_suggestions.map((sug, idx) => (
                            <button key={idx} className="followup-chip" onClick={() => handleSend(sug)}>
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="message-time">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row ai">
                <div className="message-avatar">🌊</div>
                <div className="message-bubble loading-bubble">
                  <div className="loading-spinner"></div>
                  <span>Retrieving ARGO float profiles & synthesizing scientific response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Footer Query Input */}
      <footer className="floatchat-footer">
        <form
          className="input-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <input
            type="text"
            className="chat-input"
            placeholder="Ask FloatChat about ocean temperature, salinity, mixed layer depth, ARGO floats..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !inputQuery.trim()}>
            {loading ? '...' : 'Send ➔'}
          </button>
        </form>
      </footer>
    </div>
  )
}
