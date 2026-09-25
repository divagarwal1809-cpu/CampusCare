import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident, Responder } from '../types';

interface TacticalMapProps {
  incidents: Incident[];
  responders: Responder[];
  onSelectIncident?: (incident: Incident) => void;
  onSelectResponder?: (responder: Responder) => void;
}

type MapTheme = 'voyager' | 'satellite' | 'dark' | 'positron';

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  responders,
  onSelectIncident,
  onSelectResponder,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeTheme, setActiveTheme] = useState<MapTheme>('voyager');

  const cartoKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_3xed_1_f7694041997360545e6b3b83';

  // Map theme configurations
  const MAP_STYLES: Record<
    MapTheme,
    { label: string; icon: string; url: string; subdomains?: string; maxZoom: number; isDarkBoost?: boolean }
  > = {
    voyager: {
      label: 'Voyager (Clear)',
      icon: '🗺️',
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
      subdomains: 'abcd',
      maxZoom: 19,
    },
    satellite: {
      label: 'Satellite',
      icon: '🛰️',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    },
    dark: {
      label: 'Tactical Dark',
      icon: '🌙',
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
      subdomains: 'abcd',
      maxZoom: 19,
      isDarkBoost: true,
    },
    positron: {
      label: 'Light Slate',
      icon: '☀️',
      url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
      subdomains: 'abcd',
      maxZoom: 19,
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Campus center coordinates
    const map = L.map(mapContainerRef.current, {
      center: [12.9720, 77.5945],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Campus key landmark zones
    const landmarks = [
      { name: 'Science Complex', coords: [12.9722, 77.5938] as [number, number], color: '#38bdf8' },
      { name: 'Central Library', coords: [12.9730, 77.5952] as [number, number], color: '#818cf8' },
      { name: 'Hostel Zone A-D', coords: [12.9740, 77.5965] as [number, number], color: '#f43f5e' },
      { name: 'Sports Pavilion', coords: [12.9719, 77.5947] as [number, number], color: '#10b981' },
      { name: 'Main Campus Gate', coords: [12.9698, 77.5942] as [number, number], color: '#fbbf24' },
      { name: 'Block E Tech Substation', coords: [12.9734, 77.5928] as [number, number], color: '#a855f7' },
    ];

    landmarks.forEach((lm) => {
      L.circle(lm.coords, {
        radius: 65,
        color: lm.color,
        fillColor: lm.color,
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '4, 6',
      }).addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Theme Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = MAP_STYLES[activeTheme];
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || 'abc',
      attribution: '&copy; CARTO / OpenStreetMap / Esri',
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;

    // Toggle dark boost contrast filter
    if (mapContainerRef.current) {
      if (cfg.isDarkBoost) {
        mapContainerRef.current.classList.add('carto-dark-boost');
      } else {
        mapContainerRef.current.classList.remove('carto-dark-boost');
      }
    }
  }, [activeTheme]);

  // Update Markers & Dispatch Lines
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Incidents
    incidents.forEach((inc) => {
      if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return;

      const isCritical = inc.priority_score >= 75;
      const isHigh = inc.priority_score >= 50 && inc.priority_score < 75;
      const pinColor = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#38bdf8';

      // Custom animated pulse marker icon
      const customIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute inline-flex w-full h-full rounded-full opacity-75 ${
              isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-400' : 'bg-sky-400'
            }"></span>
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full font-mono text-[10px] font-bold text-white shadow-lg border-2 border-white/80" style="background-color: ${pinColor}">
              ${inc.category[0]}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="p-2 space-y-1.5 text-xs font-sans">
          <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span class="font-mono font-bold text-sky-700">${inc.code}</span>
            <span class="font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
              isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }">${inc.priority_level} (${inc.priority_score})</span>
          </div>
          <p class="font-bold text-slate-900">${inc.title}</p>
          <p class="text-[11px] text-slate-600">📍 ${inc.location_name}</p>
          <div class="text-[11px] text-slate-500 flex justify-between pt-1">
            <span>Required: <strong class="text-sky-700">${inc.required_team}</strong></span>
            <span>SLA: <strong>${inc.sla_target_minutes}m</strong></span>
          </div>
        </div>
      `);

      if (onSelectIncident) {
        marker.on('click', () => onSelectIncident(inc));
      }

      layerGroup.addLayer(marker);
    });

    // 2. Render Responders
    responders.forEach((resp) => {
      const isAvailable = resp.is_available;
      const respColor = isAvailable ? '#10b981' : '#f59e0b';

      const customIcon = L.divIcon({
        className: 'custom-responder-pin',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <div class="flex items-center justify-center w-5 h-5 rounded-md font-mono text-[9px] font-bold text-slate-950 shadow-md border border-white" style="background-color: ${respColor}">
              ${resp.primary_team[0]}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([resp.latitude, resp.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="p-2 space-y-1 text-xs font-sans">
          <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span class="font-mono font-bold text-slate-800">${resp.code}</span>
            <span class="font-extrabold text-[10px] ${isAvailable ? 'text-emerald-700' : 'text-amber-700'}">${resp.status}</span>
          </div>
          <p class="font-bold text-slate-900">${resp.name}</p>
          <p class="text-[11px] text-slate-600">Team: ${resp.primary_team} | Shift: ${resp.shift}</p>
          <p class="text-[11px] text-slate-500">Skills: ${resp.skills.join(', ')}</p>
        </div>
      `);

      if (onSelectResponder) {
        marker.on('click', () => onSelectResponder(resp));
      }

      layerGroup.addLayer(marker);

      // 3. Draw dispatch vector polyline if assigned to an active incident
      if (resp.current_assignment_code) {
        const targetInc = incidents.find((i) => i.code === resp.current_assignment_code);
        if (targetInc) {
          const line = L.polyline(
            [
              [resp.latitude, resp.longitude],
              [targetInc.latitude, targetInc.longitude],
            ],
            {
              color: '#38bdf8',
              weight: 2,
              dashArray: '6, 8',
              opacity: 0.8,
            }
          );
          layerGroup.addLayer(line);
        }
      }
    });
  }, [incidents, responders, onSelectIncident, onSelectResponder]);

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Style Selector Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-lg gap-1">
        {(Object.keys(MAP_STYLES) as MapTheme[]).map((themeKey) => {
          const s = MAP_STYLES[themeKey];
          const isActive = activeTheme === themeKey;
          return (
            <button
              key={themeKey}
              type="button"
              onClick={() => setActiveTheme(themeKey)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={s.label}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline text-[11px]">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-lg text-[10px] text-slate-700 space-y-1.5 pointer-events-none">
        <div className="font-extrabold uppercase tracking-wider text-slate-400 text-[9px] mb-1">
          Tactical Map Telemetry
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
          <span className="font-medium text-slate-800">Critical Incident (75-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="font-medium text-slate-800">High Priority (50-74)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
          <span className="font-medium text-slate-800">Available Responder Unit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
          <span className="font-medium text-slate-800">Deployed Unit (En Route)</span>
        </div>
      </div>
    </div>
  );
};
