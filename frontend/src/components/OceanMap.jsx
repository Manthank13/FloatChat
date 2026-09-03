import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  RotateCcw, 
  Radio,
  ShieldAlert,
  Thermometer,
  Compass
} from 'lucide-react';

export default function OceanMap({ 
  floats = [], 
  selectedFloatId = null, 
  onSelectFloat = () => {},
  center = { lat: 12.0, lng: 80.0, zoom: 5 },
  height = "420px",
  interactive = true,
  showControls = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const trajectoryLayerRef = useRef(null);
  const riskLayerRef = useRef(null);
  const onSelectFloatRef = useRef(onSelectFloat);

  useEffect(() => {
    onSelectFloatRef.current = onSelectFloat;
  }, [onSelectFloat]);

  // Contextual Layers: 'observations' | 'risk_zones' | 'anomalies' | 'floats'
  const [activeLayer, setActiveLayer] = useState('observations');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: center.zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
      });

      // Oceanographic Bathymetric Basemap (Esri World Ocean / OpenStreetMap)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 13,
        minZoom: 2,
        attribution: 'Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org',
      }).addTo(map);

      // Add Zoom control at top-right
      if (interactive) {
        L.control.zoom({ position: 'topright' }).addTo(map);
      }

      // Add Bathymetric & Thermal Scale Legend
      const depthScaleControl = L.control({ position: 'bottomleft' });
      depthScaleControl.onAdd = () => {
        const div = L.DomUtil.create('div', 'map-depth-legend');
        div.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: #38BDF8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace;">
            Bathymetry & Risk Scale
          </div>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 9px; color: #94A3B8; font-family: monospace;">
            <span>0m (Shelf)</span>
            <div style="width: 70px; height: 6px; background: linear-gradient(90deg, #0284C7, #082F49, #020611); border-radius: 3px; border: 1px solid rgba(56,189,248,0.3);"></div>
            <span>4,000m (Abyssal)</span>
          </div>
        `;
        return div;
      };
      depthScaleControl.addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], center.zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center]);

  // Render Float Markers, Trajectories & Risk Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old float markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Clear old trajectory
    if (trajectoryLayerRef.current) {
      trajectoryLayerRef.current.remove();
      trajectoryLayerRef.current = null;
    }

    // Clear old risk layer
    if (riskLayerRef.current) {
      riskLayerRef.current.remove();
      riskLayerRef.current = null;
    }

    // 1. RISK ZONES & ANOMALIES LAYER
    if (activeLayer === 'risk_zones' || activeLayer === 'anomalies') {
      const riskGroup = L.layerGroup();

      // Bay of Bengal High TCHP Zone
      const bobCircle = L.circle([13.5, 83.0], {
        radius: 380000,
        color: activeLayer === 'risk_zones' ? '#F43F5E' : '#FB7185',
        fillColor: '#F43F5E',
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4'
      }).bindTooltip(
        activeLayer === 'risk_zones'
          ? "<strong>Bay of Bengal Risk Sector</strong><br/>TCHP >85 kJ/cm² • Elevated Cyclone Potential"
          : "<strong>Thermal Anomaly Hotspot</strong><br/>+0.8°C to +1.2°C above 30-year climatology",
        { className: 'map-risk-tooltip', permanent: false }
      );
      bobCircle.addTo(riskGroup);

      // Arabian Sea High Salinity Zone
      const asCircle = L.circle([16.0, 70.0], {
        radius: 320000,
        color: '#F59E0B',
        fillColor: '#F59E0B',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      }).bindTooltip(
        activeLayer === 'risk_zones'
          ? "<strong>Arabian Sea High-Salinity Sector</strong><br/>Evaporative Core • Deep OMZ Hypoxia"
          : "<strong>Moderate Thermal Departure</strong><br/>+0.3°C above baseline",
        { className: 'map-risk-tooltip', permanent: false }
      );
      asCircle.addTo(riskGroup);

      // Equatorial Warm Pool
      const eqCircle = L.circle([0.5, 82.0], {
        radius: 400000,
        color: '#00E5FF',
        fillColor: '#00E5FF',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      }).bindTooltip(
        "<strong>Equatorial Warm Pool Core</strong><br/>Long-term Thermal Accumulation",
        { className: 'map-risk-tooltip', permanent: false }
      );
      eqCircle.addTo(riskGroup);

      riskGroup.addTo(map);
      riskLayerRef.current = riskGroup;
    }

    // 2. IN-SITU ARGO SENSOR MARKERS
    floats.forEach(float => {
      const isSelected = float.id === selectedFloatId;
      const isElevated = float.surfaceTemp > 28.5;

      const customIcon = L.divIcon({
        className: 'custom-argo-marker-wrapper',
        html: `
          <div class="argo-marker-node ${isSelected ? 'selected' : ''} ${isElevated ? 'elevated-risk' : ''}">
            <div class="marker-pulse-ring"></div>
            <div class="marker-inner-dot"></div>
            ${isSelected ? `<span class="marker-callout-pill">${float.id}</span>` : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([float.lat, float.lng], { icon: customIcon }).addTo(map);

      // Popup Content HUD
      const popupHtml = `
        <div class="map-popup-card font-mono">
          <div class="popup-top">
            <span class="popup-title">IN-SITU CLIMATE SENSOR</span>
            <span class="popup-status ${isElevated ? 'elevated' : 'nominal'}">
              ${isElevated ? 'Elevated Heat' : 'Nominal'}
            </span>
          </div>

          <div class="popup-name">${float.id} (${float.name})</div>
          <div class="popup-coords">Lat: ${float.lat.toFixed(2)}°N, Lng: ${float.lng.toFixed(2)}°E</div>

          <div class="popup-metrics-grid">
            <div class="popup-metric">
              <span class="pm-k">SST</span>
              <span class="pm-v ${isElevated ? 'text-red' : 'text-cyan'}">${float.surfaceTemp} °C</span>
            </div>
            <div class="popup-metric">
              <span class="pm-k">Salinity</span>
              <span class="pm-v text-cyan">${float.surfaceSalinity} PSU</span>
            </div>
            <div class="popup-metric">
              <span class="pm-k">Max Cast</span>
              <span class="pm-v">${float.maxDepth}m</span>
            </div>
            <div class="popup-metric">
              <span class="pm-k">Cycle</span>
              <span class="pm-v">#${float.cycleNumber || 142}</span>
            </div>
          </div>

          <button id="btn-inspect-${float.id}" class="popup-inspect-btn font-mono">
            Inspect Sensor Telemetry →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'ocean-dark-popup',
        maxWidth: 280,
        closeButton: false,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${float.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectFloatRef.current) {
              onSelectFloatRef.current(float);
            }
          };
        }
      });

      marker.on('click', () => {
        if (onSelectFloatRef.current) {
          onSelectFloatRef.current(float);
        }
      });

      markersRef.current[float.id] = marker;

      // Render Trajectory for selected float
      if (isSelected && float.trajectory && float.trajectory.length > 1) {
        const latLngs = float.trajectory.map(pt => [pt.lat, pt.lng]);
        const polyline = L.polyline(latLngs, {
          color: '#00E5FF',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6',
          lineCap: 'round',
        }).addTo(map);

        trajectoryLayerRef.current = polyline;
      }
    });

    // Auto-open popup if selected
    if (selectedFloatId && markersRef.current[selectedFloatId]) {
      markersRef.current[selectedFloatId].openPopup();
    }
  }, [floats, selectedFloatId, activeLayer]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], center.zoom, { duration: 1.0 });
    }
  };

  return (
    <div className="ocean-map-container" style={{ height }}>
      <div ref={mapContainerRef} className="ocean-leaflet-map" />

      {/* Layer Selector Bar */}
      {showControls && (
        <div className="map-layer-selector font-mono">
          <button
            className={`layer-btn ${activeLayer === 'observations' ? 'active' : ''}`}
            onClick={() => setActiveLayer('observations')}
            title="In-situ sensor telemetry"
          >
            <Radio size={12} />
            <span>Observations</span>
          </button>
          <button
            className={`layer-btn ${activeLayer === 'risk_zones' ? 'active' : ''}`}
            onClick={() => setActiveLayer('risk_zones')}
            title="Regional climate & disaster risk sectors"
          >
            <ShieldAlert size={12} />
            <span>Risk Zones</span>
          </button>
          <button
            className={`layer-btn ${activeLayer === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveLayer('anomalies')}
            title="Thermal departure anomalies"
          >
            <Thermometer size={12} />
            <span>Anomalies</span>
          </button>
          <button
            className={`layer-btn ${activeLayer === 'floats' ? 'active' : ''}`}
            onClick={() => setActiveLayer('floats')}
            title="Active profiling probes"
          >
            <Compass size={12} />
            <span>Floats</span>
          </button>
        </div>
      )}

      {/* Reset View Button */}
      {showControls && (
        <button 
          className="map-reset-btn font-mono"
          onClick={handleResetView}
          title="Reset map perspective"
        >
          <RotateCcw size={13} />
          <span className="desktop-only">Reset View</span>
        </button>
      )}

      <style>{`
        .ocean-map-container {
          position: relative;
          width: 100%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--data-border);
          background: #020611;
        }

        .ocean-leaflet-map {
          width: 100%;
          height: 100%;
          background: #020611;
        }

        .map-layer-selector {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(4, 13, 26, 0.88);
          backdrop-filter: blur(12px);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--data-border);
        }

        .layer-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .layer-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }

        .layer-btn.active {
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.35);
        }

        .map-reset-btn {
          position: absolute;
          top: 14px;
          right: 54px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(4, 13, 26, 0.85);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all var(--transition-fast);
        }

        .map-reset-btn:hover {
          color: #FFFFFF;
          border-color: var(--cyan-primary);
          background: rgba(10, 28, 54, 0.95);
        }

        /* Leaflet Custom Marker Styling */
        .custom-argo-marker-wrapper {
          background: transparent;
          border: none;
        }

        .argo-marker-node {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .marker-pulse-ring {
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          border: 1.5px solid var(--cyan-primary);
          animation: sonarPulse 2.5s infinite;
          opacity: 0.8;
        }

        .marker-inner-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--cyan-primary);
          box-shadow: 0 0 10px var(--cyan-primary);
        }

        .argo-marker-node.elevated-risk .marker-pulse-ring {
          border-color: var(--red-critical);
        }

        .argo-marker-node.elevated-risk .marker-inner-dot {
          background: var(--red-critical);
          box-shadow: 0 0 10px var(--red-critical);
        }

        .argo-marker-node.selected .marker-inner-dot {
          background: #FFFFFF;
          box-shadow: 0 0 14px #FFFFFF, 0 0 20px var(--cyan-primary);
          transform: scale(1.3);
        }

        .marker-callout-pill {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 229, 255, 0.95);
          color: #020611;
          font-family: monospace;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 3px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        /* Popup HUD */
        .ocean-dark-popup .leaflet-popup-content-wrapper {
          background: rgba(4, 13, 26, 0.95);
          border: 1px solid var(--cyan-primary);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 229, 255, 0.2);
          padding: 0;
        }

        .ocean-dark-popup .leaflet-popup-content {
          margin: 14px;
        }

        .map-popup-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .popup-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 6px;
        }

        .popup-title {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .popup-status {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 2px;
        }

        .popup-status.nominal {
          color: var(--emerald-nominal);
          background: rgba(16, 185, 129, 0.15);
        }

        .popup-status.elevated {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.15);
        }

        .popup-name {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .popup-coords {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .popup-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: rgba(10, 25, 47, 0.6);
          padding: 8px;
          border-radius: var(--radius-sm);
        }

        .popup-metric {
          display: flex;
          flex-direction: column;
        }

        .pm-k {
          font-size: 8.5px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .pm-v {
          font-size: 11px;
          font-weight: 700;
          color: #E2E8F0;
        }

        .popup-inspect-btn {
          width: 100%;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(2, 132, 199, 0.3) 100%);
          border: 1px solid rgba(0, 229, 255, 0.4);
          color: var(--cyan-primary);
          padding: 6px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-top: 2px;
        }

        .popup-inspect-btn:hover {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }
      `}</style>
    </div>
  );
}
