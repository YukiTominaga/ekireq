"use client";

import { useMemo, useState } from "react";
import { C } from "@/app/lib/tokens";
import {
  PREFECTURES,
  STATION_DATA,
  getAllStations,
  stationKey,
  type Prefecture,
  type StationWithMeta,
} from "@/app/lib/stations";
import { Icon } from "./Icon";

type Props = {
  counts: Record<string, number>;
  onSelect: (s: StationWithMeta) => void;
};

type SearchResult = {
  meta: StationWithMeta;
  lineCount: number;
};

export function StationListView({ counts, onSelect }: Props) {
  const [pref, setPref] = useState<Prefecture>("東京");
  const [query, setQuery] = useState("");

  const allStations = useMemo(() => getAllStations(), []);

  const trimmed = query.trim();
  const isSearching = trimmed !== "";

  const results = useMemo<SearchResult[]>(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    const map = new Map<string, SearchResult>();
    for (const stn of allStations) {
      if (!stn.name.toLowerCase().includes(q)) continue;
      const existing = map.get(stn.key);
      if (existing) {
        existing.lineCount += 1;
      } else {
        map.set(stn.key, { meta: stn, lineCount: 1 });
      }
    }
    return Array.from(map.values());
  }, [allStations, trimmed, isSearching]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.white }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: C.white,
          zIndex: 5,
          borderBottom: `1px solid ${C.slate100}`,
        }}
      >
        <div style={{ padding: "10px 14px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              borderRadius: 8,
              padding: "0 10px",
              height: 36,
            }}
          >
            <Icon name="search" size={15} color={C.slate400} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="駅名で検索"
              style={{
                flex: 1,
                marginLeft: 8,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
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
        </div>

        {!isSearching && (
          <div style={{ display: "flex" }}>
            {PREFECTURES.map((p) => (
              <button
                key={p}
                onClick={() => setPref(p)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  fontSize: 12,
                  fontWeight: pref === p ? 600 : 400,
                  color: pref === p ? C.slate900 : C.slate500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: `2px solid ${pref === p ? C.slate900 : "transparent"}`,
                  fontFamily: "inherit",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {isSearching ? (
        <SearchResults results={results} counts={counts} onSelect={onSelect} />
      ) : (
        <Lines key={pref} pref={pref} counts={counts} onSelect={onSelect} />
      )}
    </div>
  );
}

function SearchResults({
  results,
  counts,
  onSelect,
}: {
  results: SearchResult[];
  counts: Record<string, number>;
  onSelect: (s: StationWithMeta) => void;
}) {
  if (results.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: C.slate400,
          fontSize: 13,
        }}
      >
        該当する駅が見つかりません
      </div>
    );
  }
  return (
    <>
      {results.map(({ meta, lineCount }) => {
        const count = counts[meta.key] ?? 0;
        const sub =
          lineCount > 1
            ? `${meta.prefecture} · ${meta.line} ほか ${lineCount - 1} 路線`
            : `${meta.prefecture} · ${meta.line}`;
        return (
          <button
            key={meta.key}
            onClick={() => onSelect(meta)}
            style={{
              width: "100%",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              borderBottom: `1px solid ${C.slate100}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.slate900 }}>
                {meta.name}駅
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
                {sub}
              </div>
            </div>
            {count > 0 && (
              <span
                style={{
                  background: C.slate900,
                  color: C.white,
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 9px",
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}

function Lines({
  pref,
  counts,
  onSelect,
}: {
  pref: Prefecture;
  counts: Record<string, number>;
  onSelect: (s: StationWithMeta) => void;
}) {
  const [openLine, setOpenLine] = useState<string | null>(null);
  const lines = Object.keys(STATION_DATA[pref] ?? {});

  const totals = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const line of lines) {
      let sum = 0;
      for (const stn of STATION_DATA[pref][line]) {
        sum += counts[stationKey(pref, stn.name)] ?? 0;
      }
      out[line] = sum;
    }
    return out;
    // lines は STATION_DATA[pref] から導出される静的データなので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref, counts]);

  return (
    <>
      {lines.map((line) => {
        const stations = STATION_DATA[pref][line];
        const isOpen = openLine === line;
        const total = totals[line] ?? 0;
        return (
          <div key={line} style={{ borderBottom: `1px solid ${C.slate100}` }}>
            <button
              onClick={() => setOpenLine(isOpen ? null : line)}
              style={{
                width: "100%",
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <div>
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: C.slate800 }}
                >
                  {line}
                </span>
                {total > 0 && (
                  <span
                    style={{ marginLeft: 8, fontSize: 11, color: C.slate500 }}
                  >
                    {total}件
                  </span>
                )}
              </div>
              <Icon
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={15}
                color={C.slate400}
              />
            </button>
            {isOpen && (
              <div style={{ background: C.slate50 }}>
                {stations.map((stn) => {
                  const key = stationKey(pref, stn.name);
                  const count = counts[key] ?? 0;
                  const meta: StationWithMeta = {
                    ...stn,
                    prefecture: pref,
                    line,
                    key,
                  };
                  return (
                    <button
                      key={stn.id}
                      onClick={() => onSelect(meta)}
                      style={{
                        width: "100%",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        borderTop: `1px solid ${C.slate100}`,
                      }}
                    >
                      <span style={{ fontSize: 13, color: C.slate700 }}>
                        {stn.name}駅
                      </span>
                      {count > 0 && (
                        <span
                          style={{
                            background: C.slate900,
                            color: C.white,
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "1px 8px",
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
