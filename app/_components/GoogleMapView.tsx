"use client";

import {
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { C } from "@/app/lib/tokens";
import type { StationWithMeta } from "@/app/lib/stations";
import { Icon } from "./Icon";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_MAP_ID = "DEMO_MAP_ID";
const POI_HIT_THRESHOLD_PX = 30;
const SEARCH_ZOOM = 16;

function findStationByPixel(
  map: google.maps.Map,
  stations: StationWithMeta[],
  clickLatLng: google.maps.LatLng,
  thresholdPx = POI_HIT_THRESHOLD_PX,
): StationWithMeta | null {
  const proj = map.getProjection();
  if (!proj) return null;
  const zoom = map.getZoom();
  if (zoom == null) return null;
  const scale = 2 ** zoom;
  const clickPt = proj.fromLatLngToPoint(clickLatLng);
  if (!clickPt) return null;
  let only: StationWithMeta | null = null;
  for (const s of stations) {
    const sp = proj.fromLatLngToPoint(new google.maps.LatLng(s.lat, s.lng));
    if (!sp) continue;
    const dx = (sp.x - clickPt.x) * scale;
    const dy = (sp.y - clickPt.y) * scale;
    if (Math.hypot(dx, dy) <= thresholdPx) {
      if (only) return null;
      only = s;
    }
  }
  return only;
}

type Props = {
  apiKey: string;
  mapId?: string;
  stations: StationWithMeta[];
  counts: Record<string, number>;
  onSelect: (s: StationWithMeta) => void;
};

export function GoogleMapView({
  apiKey,
  mapId = DEFAULT_MAP_ID,
  stations,
  counts,
  onSelect,
}: Props) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={mapId}
          defaultCenter={TOKYO_CENTER}
          defaultZoom={11}
          gestureHandling="greedy"
          mapTypeControl={false}
          mapTypeId="roadmap"
          clickableIcons={true}
          streetViewControl={false}
          panControl={false}
          cameraControl={false}
          zoomControl={false}
          rotateControl={false}
          fullscreenControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <MapClickListener stations={stations} onSelect={onSelect} />
          <ClusteredStationMarkers
            stations={stations}
            counts={counts}
            onSelect={onSelect}
          />
          <MapSearch stations={stations} onSelect={onSelect} />
        </Map>
      </APIProvider>
    </div>
  );
}

function MapClickListener({
  stations,
  onSelect,
}: {
  stations: StationWithMeta[];
  onSelect: (s: StationWithMeta) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener(
      "click",
      (e: google.maps.IconMouseEvent | google.maps.MapMouseEvent) => {
        if (!("placeId" in e) || !e.placeId) return;
        e.stop();
        const ll = e.latLng;
        if (!ll) return;
        const hit = findStationByPixel(map, stations, ll);
        if (hit) onSelect(hit);
      },
    );
    return () => listener.remove();
  }, [map, stations, onSelect]);
  return null;
}

function ClusteredStationMarkers({
  stations,
  counts,
  onSelect,
}: {
  stations: StationWithMeta[];
  counts: Record<string, number>;
  onSelect: (s: StationWithMeta) => void;
}) {
  const map = useMap();
  const [markers, setMarkers] = useState<
    Record<string, google.maps.marker.AdvancedMarkerElement>
  >({});
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    const clusterer = new MarkerClusterer({ map });
    clustererRef.current = clusterer;
    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
      clustererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = useCallback(
    (key: string) =>
      (marker: google.maps.marker.AdvancedMarkerElement | null) => {
        setMarkers((prev) => {
          if (marker && prev[key] === marker) return prev;
          if (!marker && !prev[key]) return prev;
          const next = { ...prev };
          if (marker) {
            next[key] = marker;
          } else {
            delete next[key];
          }
          return next;
        });
      },
    [],
  );

  return (
    <>
      {stations.map((stn) => {
        const count = counts[stn.key] ?? 0;
        return (
          <AdvancedMarker
            key={stn.key}
            ref={setMarkerRef(stn.key)}
            position={{ lat: stn.lat, lng: stn.lng }}
            onClick={() => onSelect(stn)}
            title={
              count > 0 ? `${stn.name}駅: ${count}件の投稿` : `${stn.name}駅`
            }
            anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
            zIndex={count > 0 ? 1000 : 1}
          >
            {count > 0 ? (
              <div className="stn-badge">{count}</div>
            ) : (
              <div className="stn-hit" />
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function MapSearch({
  stations,
  onSelect,
}: {
  stations: StationWithMeta[];
  onSelect: (s: StationWithMeta) => void;
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const trimmed = query.trim();
  const results = useMemo(() => {
    if (!trimmed) return [] as StationWithMeta[];
    const q = trimmed.toLowerCase();
    const seen = new Set<string>();
    const out: StationWithMeta[] = [];
    for (const s of stations) {
      if (seen.has(s.key)) continue;
      if (!s.name.toLowerCase().includes(q)) continue;
      seen.add(s.key);
      out.push(s);
      if (out.length >= 12) break;
    }
    return out;
  }, [stations, trimmed]);

  function handlePick(s: StationWithMeta) {
    if (map) {
      map.panTo({ lat: s.lat, lng: s.lng });
      const z = map.getZoom() ?? 11;
      if (z < SEARCH_ZOOM) map.setZoom(SEARCH_ZOOM);
    }
    setQuery("");
    setFocused(false);
    onSelect(s);
  }

  const showDropdown = focused && trimmed !== "";

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: C.white,
          borderRadius: 10,
          padding: "0 12px",
          height: 40,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          border: `1px solid ${C.slate200}`,
        }}
      >
        <Icon name="search" size={16} color={C.slate400} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // ドロップダウンクリックを処理する余地を残す
            setTimeout(() => setFocused(false), 150);
          }}
          placeholder="駅名で検索して移動"
          style={{
            flex: 1,
            marginLeft: 10,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontFamily: "inherit",
            color: C.slate900,
            height: "100%",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              color: C.slate400,
            }}
            aria-label="クリア"
          >
            <Icon name="x" size={14} color={C.slate400} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          style={{
            marginTop: 6,
            background: C.white,
            borderRadius: 10,
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            border: `1px solid ${C.slate200}`,
            overflow: "hidden",
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: "14px 16px",
                fontSize: 13,
                color: C.slate400,
                textAlign: "center",
              }}
            >
              該当する駅が見つかりません
            </div>
          ) : (
            results.map((s) => (
              <button
                key={s.key}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(s)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  borderBottom: `1px solid ${C.slate100}`,
                }}
              >
                <Icon name="map-pin" size={14} color={C.slate400} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: C.slate900 }}
                  >
                    {s.name}駅
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate500,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.prefecture} · {s.line}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
