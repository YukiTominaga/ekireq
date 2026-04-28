"use client";

import {
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { C } from "@/app/lib/tokens";
import type { StationWithMeta } from "@/app/lib/stations";
import { Icon } from "./Icon";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_MAP_ID = "DEMO_MAP_ID";
const NEAREST_THRESHOLD_DEG = 0.001;
const SEARCH_ZOOM = 16;

function findNearestStation(
  stations: StationWithMeta[],
  lat: number,
  lng: number,
): StationWithMeta | null {
  let best: StationWithMeta | null = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = Math.hypot(s.lat - lat, s.lng - lng);
    if (d <= NEAREST_THRESHOLD_DEG && d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
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
          style={{ width: "100%", height: "100%" }}
        >
          <MapClickListener stations={stations} onSelect={onSelect} />

          {stations.map((stn) => {
            const count = counts[stn.key] ?? 0;
            return (
              <AdvancedMarker
                key={stn.key}
                position={{ lat: stn.lat, lng: stn.lng }}
                onClick={() => onSelect(stn)}
                title={
                  count > 0
                    ? `${stn.name}駅: ${count}件の投稿`
                    : `${stn.name}駅`
                }
                anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
              >
                {count > 0 ? (
                  <div className="stn-badge">{count}</div>
                ) : (
                  <div className="stn-hit" />
                )}
              </AdvancedMarker>
            );
          })}

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
        const nearest = findNearestStation(stations, ll.lat(), ll.lng());
        if (nearest) onSelect(nearest);
      },
    );
    return () => listener.remove();
  }, [map, stations, onSelect]);
  return null;
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
