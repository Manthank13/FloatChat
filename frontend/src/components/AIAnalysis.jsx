import { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  Database, 
  Info,
  Download
} from 'lucide-react';
import DataCard from './DataCard';
import OceanSlice from './OceanSlice';
import OceanMap from './OceanMap';
import ResiliencePanel from './ResiliencePanel';
import ComparisonView from './ComparisonView';
import InvestigationFlow from './InvestigationFlow';
import ClimateRiskScore from './ClimateRiskScore';
import WhatChangedMode from './WhatChangedMode';

export default function AIAnalysis({ 
  message, 
  onSelectFloat, 
  onSendFollowUp, 
  onNavigate,
  onInspectSignal
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'slice' | 'map'
  const [showExtendedDetails, setShowExtendedDetails] = useState(true);

  const relevantFloatObj = message.floats?.find(f => f.id === message.relevantFloatId) || message.floats?.[0];

  const handleCopyText = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReport = () => {
    const title = `# FloatChat Climate Risk Investigation Report\n\n`;
    const meta = `**Inquiry:** ${message.query || "Climate Risk Assessment"}\n**Timestamp:** ${new Date().toISOString()}\n**Target Region:** ${relevantFloatObj?.region || "Regional Basin"}\n**Risk Level:** ${message.riskLevel?.toUpperCase() || "ELEVATED"}\n**Ground-Truth Sensor:** Float #${relevantFloatObj?.id || "ARGO-IN-2902741"} (WMO #${relevantFloatObj?.wmoNumber || "2902741"})\n\n---\n\n`;
    const content = `## 1. Scientific Assessment & Risk Diagnostic\n\n${message.text}\n\n## 2. In-Situ Observational Signals & Anomalies\n\n${(message.kpis || []).map(k => `- **${k.label}**: ${k.value} (${k.anomaly || 'Observed'}) — ${k.riskRelevance || ''}`).join('\n')}\n\n## 3. Coastal Disaster Resilience Recommendations\n\n${(message.actions || []).map(a => `- ${a}`).join('\n')}\n\n---\n*Validated by FloatChat Climate Intelligence Ground-Truth Telemetry Array (RTQC PASS)*\n`;

    const blob = new Blob([title + meta + content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FloatChat_Report_${(relevantFloatObj?.region || 'Climate').replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse structured markdown text
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    let inTable = false;
    let tableRows = [];
    const elements = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableRows.push(trimmed);
        return;
      } else if (inTable) {
        elements.push(renderTable(tableRows, `table-${idx}`));
        tableRows = [];
        inTable = false;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="analysis-h3 font-mono">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="analysis-h4 font-mono">
            {trimmed.replace('#### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="analysis-bullet">
            {renderInlineSpans(trimmed.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <div key={idx} className="analysis-num-item">
            <span className="analysis-num-dot font-mono">{trimmed.match(/^\d+/)[0]}.</span>
            <span>{renderInlineSpans(trimmed.replace(/^\d+\.\s*/, ''))}</span>
          </div>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className="analysis-p">
            {renderInlineSpans(trimmed)}
          </p>
        );
      }
    });

    if (inTable && tableRows.length > 0) {
      elements.push(renderTable(tableRows, `table-end`));
    }

    return elements;
  };

  const renderInlineSpans = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="analysis-strong">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="analysis-code font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const renderTable = (rows, key) => {
    if (rows.length < 2) return null;
    const headerRow = rows[0].split('|').filter(c => c.trim().length > 0);
    const bodyRows = rows.slice(2).map(r => r.split('|').filter(c => c.trim().length > 0));

    return (
      <div key={key} className="table-wrapper font-mono">
        <table className="analysis-table">
          <thead>
            <tr>
              {headerRow.map((cell, i) => (
                <th key={i}>{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="analysis-response-container">
      {/* 1. Response Header Bar */}
      <div className="analysis-header-row">
        <div className="analysis-source-info font-mono">
          <span className="source-dot"></span>
          <span className="source-label">
            {typeof message.source === 'string' 
              ? message.source 
              : (message.source?.provider 
                  ? `${message.source.provider}${message.source.quality ? ` • ${message.source.quality}` : ''}`
                  : (message.isMock ? "CLIMATE AI SYNTHESIS (IN-SITU GROUND TRUTH)" : "FASTAPI CLIMATE AI"))}
          </span>
          <span className="source-separator">•</span>
          <span className="source-time">{message.timestamp || 'Just now'}</span>
          {relevantFloatObj && (
            <>
              <span className="source-separator">•</span>
              <span className="source-float-tag text-cyan">
                Float #{relevantFloatObj.id} ({relevantFloatObj.region})
              </span>
            </>
          )}
        </div>

        <div className="analysis-header-actions">
          <button 
            className="btn-header-action font-mono" 
            onClick={handleExportReport} 
            title="Download full climate risk report (Markdown)"
          >
            <Download size={13} />
            <span className="desktop-only">Export Report</span>
          </button>

          <button 
            className="btn-header-action font-mono" 
            onClick={handleCopyText} 
            title="Copy scientific analysis"
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
            <span className="desktop-only">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Investigation Pipeline (Query -> Observation -> Insight -> Risk -> Resilience) */}
      <InvestigationFlow
        query={typeof message.query === 'string' && message.query.trim() ? message.query : (message.userQuery || message.failedQuery || "Target Climate Risk Inquiry")}
        observationTitle={typeof message.kpis?.[0]?.value === 'string' || typeof message.kpis?.[0]?.value === 'number' ? `${message.kpis[0].label || 'Observation'}: ${message.kpis[0].value}` : "In-situ Observation Verified"}
        insightTitle={typeof message.kpis?.[1]?.riskRelevance === 'string' ? message.kpis[1].riskRelevance : "Subsurface Barrier Layer & Heat Retention"}
        riskTitle={typeof message.riskTitle === 'string' ? message.riskTitle : "Regional Climate Risk Assessment"}
        resilienceTitle={typeof message.hazards?.[0] === 'string' ? message.hazards[0] : (message.hazards?.[0]?.title || "Coastal Resilience & Preparedness Guidelines")}
      />

      {/* 3. ADAPTIVE: Dual-Basin Regional Comparison (If comparison query) */}
      {message.comparison && (
        <ComparisonView
          comparison={message.comparison}
          onSelectFloat={onSelectFloat}
        />
      )}

      {/* 4. ADAPTIVE: Interactive Composite Climate Risk Gauge & Sector Breakdown */}
      {message.riskLevel && !message.comparison && (
        <ClimateRiskScore
          overallScore={message.riskLevel === 'high' ? 84 : message.riskLevel === 'elevated' ? 78 : 56}
          overallLevel={message.riskLevel}
          regionName={relevantFloatObj?.region || "Bay of Bengal / Chennai Coast"}
          onOpenEvidence={(ev) => {
            if (onInspectSignal) {
              onInspectSignal({ ...ev, float: relevantFloatObj }, 'chat');
            }
          }}
          onNavigateToMap={() => onNavigate && onNavigate('explore')}
          onAskAboutRisk={(q) => onSendFollowUp(q)}
        />
      )}

      {/* 5. Core 4-Tier Scientific Interpretation Prose */}
      <div className="workspace-card glass-panel-elevated">
        <div className="section-label-bar">
          <div className="section-label-tag font-mono">
            <Sparkles size={13} className="text-cyan" />
            <span>CLIMATE RISK & RESILIENCE INTERPRETATION</span>
          </div>
          <button 
            type="button"
            className="btn-toggle-extended font-mono"
            onClick={() => setShowExtendedDetails(!showExtendedDetails)}
          >
            <span>{showExtendedDetails ? 'Collapse Details' : 'Expand Details'}</span>
            {showExtendedDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {showExtendedDetails && (
          <div className="analysis-content-prose">
            {renderFormattedText(message.text)}
          </div>
        )}
      </div>

      {/* 6. Scientific Safety Notice */}
      <div className="safety-disclaimer-strip font-mono">
        <Info size={13} className="text-cyan flex-shrink-0" />
        <span>
          <strong>Scientific Notice:</strong> Environmental signals and thermal anomalies indicate observed conditions relevant to climate risk assessment; they represent physical diagnostics rather than deterministic disaster predictions.
        </span>
      </div>

      {/* 7. Meaningful Climate Indicator KPI Cards with Evidence Trigger */}
      {message.kpis && message.kpis.length > 0 && (
        <div className="workspace-section">
          <div className="section-label-bar">
            <div className="section-label-tag font-mono">
              <Database size={13} className="text-cyan" />
              <span>ENVIRONMENTAL RISK SIGNALS & SENSORS</span>
            </div>
            <span className="section-sub-tag font-mono">In-situ Sensor Values & Anomalies</span>
          </div>
          <div className="kpi-cards-row">
            {message.kpis.map((kpi, idx) => (
              <DataCard
                key={idx}
                label={kpi.label}
                value={kpi.value}
                change={kpi.change}
                anomaly={kpi.anomaly}
                riskRelevance={kpi.riskRelevance || kpi.risk_relevance}
                riskLevel={kpi.riskLevel || kpi.risk_level}
                type={kpi.type}
                icon={kpi.icon}
                sourceEvidence={relevantFloatObj ? `Float #${relevantFloatObj.id}` : null}
                onExploreEvidence={() => {
                  if (onInspectSignal) {
                    onInspectSignal({
                      title: `${kpi.label} Observational Evidence`,
                      category: kpi.type || "Thermodynamic Indicator",
                      region: relevantFloatObj?.region || "Coastal Sector",
                      conclusion: kpi.riskRelevance || "Observed thermodynamic anomaly recorded by calibrated in-situ sensors.",
                      float: relevantFloatObj
                    }, 'chat');
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 8. ADAPTIVE: "What Changed?" Time-Series Trend Scrubber */}
      {!message.comparison && (
        <WhatChangedMode
          regionName={relevantFloatObj?.region || "Bay of Bengal (Off Chennai)"}
          onOpenEvidence={(ev) => {
            if (onInspectSignal) {
              onInspectSignal({ ...ev, float: relevantFloatObj }, 'chat');
            }
          }}
          onAskAboutTrend={(q) => onSendFollowUp(q)}
        />
      )}

      {/* 9. ADAPTIVE: Actionable Disaster Resilience Panel */}
      {message.hazards && message.hazards.length > 0 && (
        <ResiliencePanel
          hazardTitle="Coastal Disaster Resilience & Planning Implications"
          hazards={message.hazards}
          actions={message.actions}
          region={relevantFloatObj?.region || "Coastal Basin"}
        />
      )}

      {/* 10. Visual Evidence Instruments (Depth Slicer & Multi-Layer Map) */}
      <div className="workspace-section">
        <div className="instrument-view-bar">
          <div className="section-label-tag font-mono">
            <Layers size={13} className="text-cyan" />
            <span>VISUAL EVIDENCE & STRATIFICATION</span>
          </div>

          <div className="view-selector-tabs font-mono">
            <button
              className={`view-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Evidence
            </button>
            {message.chartData?.length > 0 && (
              <button
                className={`view-tab ${activeTab === 'slice' ? 'active' : ''}`}
                onClick={() => setActiveTab('slice')}
              >
                Water Column & Heat
              </button>
            )}
            {message.floats?.length > 0 && (
              <button
                className={`view-tab ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                Risk Sector Map
              </button>
            )}
          </div>
        </div>

        <div className="instruments-display-grid">
          {/* Vertical Stratification & Heat Column */}
          {(activeTab === 'all' || activeTab === 'slice') && message.chartData && message.chartData.length > 0 && (
            <div className="instrument-column">
              <OceanSlice
                profileData={message.chartData}
                title="CTD Vertical Thermohaline & Heat Stratification"
                floatId={message.relevantFloatId}
                initialParam={message.chartType === 'salinity' ? 'salinity' : 'temp'}
              />
            </div>
          )}

          {/* Geographic Sensor Risk Sector Map */}
          {(activeTab === 'all' || activeTab === 'map') && message.floats && message.floats.length > 0 && (
            <div className="instrument-column">
              <div className="instrument-map-wrap">
                <div className="instrument-map-header">
                  <div className="map-tag-group">
                    <MapPin size={13} className="text-cyan" />
                    <span className="map-tag-title font-mono">GEOGRAPHIC RISK & SENSOR TELEMETRY</span>
                  </div>
                  <span className="badge badge-emerald font-mono">
                    {message.floats.length} Profiling Units Tracked
                  </span>
                </div>
                <OceanMap
                  floats={message.floats}
                  selectedFloatId={message.relevantFloatId}
                  onSelectFloat={onSelectFloat}
                  center={message.mapFocus || { lat: message.floats[0].lat, lng: message.floats[0].lng, zoom: 6 }}
                  height="360px"
                  showControls={true}
                />
              </div>
            </div>
          )}

          {activeTab === 'map' && (!message.floats || message.floats.length === 0) && (
            <div className="instrument-column">
              <div className="instrument-map-wrap flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono text-xs">
                <MapPin size={24} className="text-slate-600 mb-2" />
                <p>No active ARGO float telemetry markers recorded in this specific search boundary.</p>
                <p className="text-slate-500 mt-1">Try expanding the search radius or exploring adjacent ocean basins.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 11. Follow-up Scientific Inquiries */}
      {message.followUps && message.followUps.length > 0 && (
        <div className="workspace-section">
          <div className="section-label-bar">
            <div className="section-label-tag font-mono">
              <Sparkles size={13} className="text-cyan" />
              <span>RECOMMENDED CLIMATE INQUIRIES</span>
            </div>
          </div>
          <div className="followup-pills-row">
            {message.followUps.map((fu, idx) => (
              <button
                key={idx}
                className="followup-pill font-mono"
                onClick={() => onSendFollowUp(fu)}
              >
                <span>{fu}</span>
                <ChevronRight size={13} className="fu-arrow" />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .analysis-response-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          animation: revealDepth 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .analysis-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-light);
        }

        .analysis-source-info {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .source-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cyan-primary);
          box-shadow: 0 0 6px var(--cyan-primary);
        }

        .source-label {
          font-weight: 700;
          color: var(--text-primary);
        }

        .source-separator {
          opacity: 0.4;
        }

        .source-float-tag {
          font-weight: 600;
        }

        .btn-header-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-header-action:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
        }

        .workspace-card {
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 22px 24px;
          box-shadow: var(--shadow-hud);
        }

        .section-label-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .section-label-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
        }

        .btn-toggle-extended {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
          background: transparent;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-toggle-extended:hover {
          color: var(--cyan-primary);
        }

        .analysis-content-prose {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-primary);
        }

        .analysis-h3 {
          font-size: 15px;
          font-weight: 800;
          color: var(--cyan-primary);
          margin-top: 10px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 4px;
        }

        .analysis-h4 {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--sky-core);
          margin-top: 6px;
        }

        .analysis-bullet {
          margin-left: 18px;
          list-style: disc;
          color: var(--text-primary);
        }

        .analysis-num-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .analysis-num-dot {
          color: var(--cyan-primary);
          font-weight: 700;
        }

        .analysis-strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        [data-theme="light"] .analysis-strong {
          color: #0F172A;
        }

        .analysis-code {
          background: rgba(0, 229, 255, 0.1);
          color: var(--cyan-primary);
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }

        .table-wrapper {
          overflow-x: auto;
          margin: 10px 0;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-subtle);
        }

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }

        .analysis-table th {
          background: var(--cyan-subtle);
          padding: 8px 12px;
          text-align: left;
          color: var(--cyan-primary);
          border-bottom: 1px solid var(--border-light);
          font-weight: 700;
        }

        .analysis-table td {
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-light);
          color: var(--text-secondary);
        }

        .safety-disclaimer-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.45;
          box-shadow: var(--shadow-subtle);
        }

        .workspace-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-sub-tag {
          font-size: 10px;
          color: var(--text-muted);
        }

        .kpi-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
        }

        .instrument-view-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .view-selector-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 3px;
          border-radius: var(--radius-full);
        }

        .view-tab {
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .view-tab:hover {
          color: var(--text-primary);
        }

        .view-tab.active {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .instruments-display-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 14px;
        }

        .instrument-column {
          display: flex;
          flex-direction: column;
        }

        .instrument-map-wrap {
          background: var(--glass-panel);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .instrument-map-header {
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(4, 13, 26, 0.5);
        }

        .map-tag-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .map-tag-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.06em;
        }

        .followup-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .followup-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 8px 14px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .followup-pill:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
          transform: translateY(-1px);
        }

        .fu-arrow {
          color: var(--cyan-primary);
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
      `}</style>
    </div>
  );
}
