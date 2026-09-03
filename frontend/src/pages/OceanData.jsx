import { useState, useEffect } from 'react';
import OceanSlice from '../components/OceanSlice';
import WhatChangedMode from '../components/WhatChangedMode';
import { 
  Database, 
  Layers, 
  ArrowLeftRight,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Scale
} from 'lucide-react';
import { getFloatLocations, getRegionalComparison } from '../services/api';

export default function OceanData({ onNavigateToChat, onInspectSignal }) {
  const [availableFloats, setAvailableFloats] = useState([]);
  const [floatAId, setFloatAId] = useState('');
  const [floatBId, setFloatBId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState('slices'); // 'slices' | 'trends'

  // Initial load of float fleet
  useEffect(() => {
    getFloatLocations().then((res) => {
      if (res.success && res.data?.length > 0) {
        setAvailableFloats(res.data);
        const firstId = res.data[0]?.id || '';
        const secondId = res.data[1]?.id || res.data[0]?.id || '';
        setFloatAId(firstId);
        setFloatBId(secondId);
      }
    });
  }, []);

  // Fetch comparison data when selections change
  useEffect(() => {
    if (!floatAId || !floatBId) return;
    let isMounted = true;
    getRegionalComparison(floatAId, floatBId).then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setComparisonData(res.data);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [floatAId, floatBId]);

  const floatA = comparisonData?.floatA || availableFloats.find(f => f.id === floatAId) || null;
  const floatB = comparisonData?.floatB || availableFloats.find(f => f.id === floatBId) || null;

  const handleExportCSV = () => {
    if (!floatA || !floatB) return;

    const headers = "FloatID,Depth(m),Temperature(C),Salinity(PSU),Oxygen(umol/kg),Density(kg/m3)\n";
    const rowsA = (floatA.profile || []).map(p => `${floatA.id},${p.depth},${p.temp || p.temperature},${p.salinity},${p.oxygen || 0},${p.density || 0}`).join('\n');
    const rowsB = (floatB.profile || []).map(p => `${floatB.id},${p.depth},${p.temp || p.temperature},${p.salinity},${p.oxygen || 0},${p.density || 0}`).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rowsA + '\n' + rowsB);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `ocean_profiles_${floatA.id}_vs_${floatB.id}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyPreset = (idA, idB) => {
    setFloatAId(idA);
    setFloatBId(idB);
  };

  return (
    <div className="ocean-data-container">
      {/* Top Header */}
      <div className="data-page-header">
        <div className="header-left">
          <div className="data-title-row">
            <Database size={20} className="text-cyan" />
            <h2 className="data-page-title font-mono">ENVIRONMENTAL SIGNALS & THERMOHALINE COMPARATOR</h2>
          </div>
          <p className="data-page-desc">
            Comparative analysis of vertical thermohaline structure, haloclines, barrier layers, and upper-ocean heat reservoirs across climate basins.
          </p>
        </div>

        <div className="header-right font-mono">
          <button className="btn-export-csv" onClick={handleExportCSV} disabled={!floatA || !floatB}>
            <FileSpreadsheet size={14} />
            <span>Export Comparison CSV</span>
          </button>
        </div>
      </div>

      {/* Preset Basin Comparisons */}
      <div className="preset-basins-bar font-mono">
        <span className="preset-label">COMPARISON PRESETS:</span>
        <button 
          className="preset-pill"
          onClick={() => handleApplyPreset('ARGO-IN-2902741', 'ARGO-IN-2903118')}
        >
          <span>⚡ Chennai (BoB) vs Mumbai (Arabian Sea)</span>
        </button>
        <button 
          className="preset-pill"
          onClick={() => handleApplyPreset('ARGO-IN-2902890', 'ARGO-IN-2903345')}
        >
          <span>🌊 Kolkata (Ganges Plume) vs Lakshadweep</span>
        </button>
        <button 
          className="preset-pill"
          onClick={() => handleApplyPreset('ARGO-IN-2903550', 'ARGO-IN-2902672')}
        >
          <span>🌡️ Andaman Sea (MHW) vs Equatorial Warm Pool</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="data-mode-tabs font-mono">
        <button
          className={`mode-tab ${activeTab === 'slices' ? 'active' : ''}`}
          onClick={() => setActiveTab('slices')}
        >
          <Layers size={14} />
          <span>Dual Water Column Slicer</span>
        </button>
        <button
          className={`mode-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <Activity size={14} />
          <span>"What Changed?" Historical Analytics</span>
        </button>
      </div>

      {activeTab === 'slices' ? (
        <>
          {/* Float Selection Bar */}
          <div className="comparator-selector-bar">
            <div className="selector-group">
              <label className="selector-label font-mono">PRIMARY WATER COLUMN (BASIN A):</label>
              <select 
                value={floatAId} 
                onChange={(e) => setFloatAId(e.target.value)}
                className="float-select font-mono"
              >
                {availableFloats.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.id} — {f.region} ({f.surfaceTemp}°C, {f.surfaceSalinity} PSU)
                  </option>
                ))}
              </select>
            </div>

            <div className="comparator-vs-badge font-mono">
              <ArrowLeftRight size={14} className="text-cyan" />
              <span>VS</span>
            </div>

            <div className="selector-group">
              <label className="selector-label font-mono">COMPARISON WATER COLUMN (BASIN B):</label>
              <select 
                value={floatBId} 
                onChange={(e) => setFloatBId(e.target.value)}
                className="float-select font-mono"
              >
                {availableFloats.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.id} — {f.region} ({f.surfaceTemp}°C, {f.surfaceSalinity} PSU)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slices Side-by-Side View */}
          <div className="slices-comparison-grid">
            <div className="slice-column">
              <div className="slice-col-header font-mono">
                <span className="col-tag text-cyan">BASIN A SECTOR</span>
                <span className="col-name">{floatA?.region || floatAId}</span>
              </div>
              {floatA?.profile ? (
                <OceanSlice 
                  profileData={floatA.profile} 
                  title={`Water Column Profile (${floatA.id})`}
                  floatId={floatA.id}
                  initialParam="temp"
                />
              ) : (
                <div className="loading-slice font-mono"><Activity size={18} className="text-cyan animate-pulse" /> Loading profile...</div>
              )}
            </div>

            <div className="slice-column">
              <div className="slice-col-header font-mono">
                <span className="col-tag text-emerald">BASIN B SECTOR</span>
                <span className="col-name">{floatB?.region || floatBId}</span>
              </div>
              {floatB?.profile ? (
                <OceanSlice 
                  profileData={floatB.profile} 
                  title={`Water Column Profile (${floatB.id})`}
                  floatId={floatB.id}
                  initialParam="temp"
                />
              ) : (
                <div className="loading-slice font-mono"><Activity size={18} className="text-cyan animate-pulse" /> Loading profile...</div>
              )}
            </div>
          </div>

          {/* Comparison Synthesis Insights */}
          <div className="comparison-synthesis-card glass-panel">
            <div className="csc-header">
              <div className="csc-tag font-mono">
                <Scale size={14} className="text-cyan" />
                <span>THERMOHALINE CONTRAST & RESILIENCE SYNTHESIS</span>
              </div>
              {onNavigateToChat && (
                <div className="csc-actions-group">
                  <button 
                    type="button"
                    className="btn-inspect-basin font-mono"
                    onClick={() => {
                      if (onInspectSignal) {
                        onInspectSignal({
                          title: `Environmental Signal Analysis — ${floatA?.region || "Bay of Bengal"}`,
                          region: floatA?.region || "Bay of Bengal (Off Chennai)",
                          surfaceTemp: floatA?.surfaceTemp || 28.4,
                          surfaceSalinity: floatA?.surfaceSalinity || 33.1,
                          mixedLayerDepth: floatA?.mixedLayerDepth || 35,
                          float: floatA
                        }, 'data');
                      }
                    }}
                  >
                    <Activity size={13} />
                    <span>Inspect Primary Signal</span>
                  </button>

                  <button 
                    type="button"
                    className="btn-ask-comp font-mono"
                    onClick={() => onNavigateToChat(`Compare climate risk and environmental conditions between ${floatA?.region || "Basin A"} and ${floatB?.region || "Basin B"}.`)}
                  >
                    <Sparkles size={12} />
                    <span>Ask FloatChat to Analyze Both</span>
                  </button>
                </div>
              )}
            </div>

            <div className="csc-metrics-grid font-mono">
              <div className="csc-metric-box">
                <span className="cm-k">SST Gradient (A vs B):</span>
                <strong className="cm-v text-rose">
                  {floatA && floatB ? `${Math.abs(floatA.surfaceTemp - floatB.surfaceTemp).toFixed(1)} °C Delta` : '0.7 °C'}
                </strong>
              </div>

              <div className="csc-metric-box">
                <span className="cm-k">Halocline Salinity Delta:</span>
                <strong className="cm-v text-cyan">
                  {floatA && floatB ? `${Math.abs(floatA.surfaceSalinity - floatB.surfaceSalinity).toFixed(1)} PSU Delta` : '3.5 PSU'}
                </strong>
              </div>

              <div className="csc-metric-box">
                <span className="cm-k">Mixed Layer Depth Shift:</span>
                <strong className="cm-v text-emerald">
                  {floatA && floatB ? `${Math.abs((floatA.mixedLayerDepth || 35) - (floatB.mixedLayerDepth || 65))}m Depth Delta` : '30m'}
                </strong>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* "What Changed?" Historical Mode */
        <WhatChangedMode
          regionName={floatA?.region || "Bay of Bengal (Off Chennai)"}
          onOpenEvidence={(ev) => {
            if (onInspectSignal) {
              onInspectSignal({ ...ev, float: floatA }, 'data');
            }
          }}
          onAskAboutTrend={(q) => onNavigateToChat && onNavigateToChat(q)}
        />
      )}

      <style>{`
        .ocean-data-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 24px 24px 48px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .data-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .data-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .data-page-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .data-page-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          max-width: 800px;
          line-height: 1.5;
        }

        .btn-export-csv {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: var(--radius-md);
          color: var(--cyan-primary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-csv:hover:not(:disabled) {
          background: rgba(0, 229, 255, 0.2);
          border-color: var(--cyan-primary);
        }

        .btn-export-csv:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .preset-basins-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .preset-label {
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.06em;
          flex-shrink: 0;
        }

        .preset-pill {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 5px 11px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .preset-pill:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
        }

        .data-mode-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
        }

        .mode-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 7px 14px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mode-tab:hover {
          color: var(--text-primary);
        }

        .mode-tab.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: var(--cyan-primary);
          color: var(--text-primary);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
        }

        .comparator-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: var(--glass-panel);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 14px 18px;
          flex-wrap: wrap;
        }

        .selector-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 280px;
        }

        .selector-label {
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .float-select {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
          width: 100%;
        }

        .float-select:focus {
          outline: none;
          border-color: var(--cyan-primary);
        }

        .comparator-vs-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          padding: 6px 12px;
          background: var(--data-surface);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-light);
        }

        .slices-comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .slices-comparison-grid {
            grid-template-columns: 1fr;
          }
        }

        .slice-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .slice-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 11px;
        }

        .col-tag {
          font-weight: 800;
        }

        .col-name {
          color: var(--text-primary);
          font-weight: 600;
        }

        .loading-slice {
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          background: var(--data-surface);
          border-radius: var(--radius-lg);
        }

        .comparison-synthesis-card {
          border-radius: var(--radius-xl);
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .csc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .csc-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.06em;
        }

        .btn-ask-comp {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%);
          border: 1px solid rgba(0, 229, 255, 0.35);
          color: var(--cyan-primary);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-ask-comp:hover {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .csc-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .csc-metric-box {
          background: rgba(4, 13, 26, 0.6);
          border: 1px solid var(--border-light);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cm-k {
          font-size: 10px;
          color: var(--text-muted);
        }

        .cm-v {
          font-size: 14px;
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
      `}</style>
    </div>
  );
}
