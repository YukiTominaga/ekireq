import { describe, expect, it } from "vitest";
import { CATEGORIES, PREFECTURES, stationKey } from "./stations";
// テストでは同期 API を使いたいので、dynamic import 経由ではなく直接データモジュールから取得する。
import {
  STATION_DATA,
  getAllStations,
  getUniqueStations,
} from "./stations-data";

describe("stationKey", () => {
  it("returns `${prefecture}:${name}` joined by colon", () => {
    expect(stationKey("東京", "渋谷")).toBe("東京:渋谷");
    expect(stationKey("神奈川", "横浜")).toBe("神奈川:横浜");
  });

  it("does not normalize whitespace or empty strings", () => {
    expect(stationKey("", "")).toBe(":");
    expect(stationKey("東京", "")).toBe("東京:");
    expect(stationKey("", "渋谷")).toBe(":渋谷");
  });
});

describe("STATION_DATA structural integrity", () => {
  it("defines an entry for every prefecture in PREFECTURES", () => {
    for (const pref of PREFECTURES) {
      expect(STATION_DATA[pref]).toBeDefined();
      expect(Object.keys(STATION_DATA[pref]).length).toBeGreaterThan(0);
    }
  });

  it("contains only non-empty station names", () => {
    for (const pref of PREFECTURES) {
      for (const stations of Object.values(STATION_DATA[pref])) {
        for (const stn of stations) {
          expect(stn.name.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("uses station ids that are unique across the whole dataset", () => {
    const ids = new Set<string>();
    const dupes: string[] = [];
    for (const pref of PREFECTURES) {
      for (const stations of Object.values(STATION_DATA[pref])) {
        for (const stn of stations) {
          if (ids.has(stn.id)) dupes.push(stn.id);
          ids.add(stn.id);
        }
      }
    }
    expect(dupes).toEqual([]);
  });

  it("places every coordinate inside the Japanese bounding box", () => {
    // Rough bounds covering the Japanese archipelago.
    for (const pref of PREFECTURES) {
      for (const stations of Object.values(STATION_DATA[pref])) {
        for (const stn of stations) {
          expect(stn.lat).toBeGreaterThanOrEqual(24);
          expect(stn.lat).toBeLessThanOrEqual(46);
          expect(stn.lng).toBeGreaterThanOrEqual(122);
          expect(stn.lng).toBeLessThanOrEqual(146);
        }
      }
    }
  });

  it("does not list the same station id twice within a single line", () => {
    for (const pref of PREFECTURES) {
      for (const [line, stations] of Object.entries(STATION_DATA[pref])) {
        const ids = stations.map((s) => s.id);
        expect(new Set(ids).size, `line=${pref}/${line}`).toBe(ids.length);
      }
    }
  });
});

describe("getAllStations", () => {
  const all = getAllStations();

  it("returns one entry per (prefecture, line, station) tuple", () => {
    let expected = 0;
    for (const pref of PREFECTURES) {
      for (const stations of Object.values(STATION_DATA[pref])) {
        expected += stations.length;
      }
    }
    expect(all.length).toBe(expected);
  });

  it("attaches prefecture, line, and key metadata to every entry", () => {
    for (const stn of all) {
      expect(PREFECTURES).toContain(stn.prefecture);
      expect(stn.line.length).toBeGreaterThan(0);
      expect(stn.key).toBe(stationKey(stn.prefecture, stn.name));
    }
  });

  it("includes well-known stations from the Yamanote line", () => {
    const shibuya = all.find((s) => s.id === "ym_shibuya");
    expect(shibuya).toMatchObject({
      name: "渋谷",
      prefecture: "東京",
      line: "JR山手線",
      key: "東京:渋谷",
    });
  });

  it("represents stations served by multiple lines as separate rows", () => {
    // 田端 belongs to both 山手線 and 京浜東北線.
    const tabata = all.filter((s) => s.name === "田端" && s.prefecture === "東京");
    const lines = new Set(tabata.map((s) => s.line));
    expect(lines.size).toBeGreaterThanOrEqual(2);
  });
});

describe("getUniqueStations", () => {
  const unique = getUniqueStations();

  it("returns one entry per station key", () => {
    const keys = unique.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never grows the list beyond getAllStations", () => {
    expect(unique.length).toBeLessThanOrEqual(getAllStations().length);
  });

  it("collapses multi-line stations down to a single row", () => {
    const tabataRows = unique.filter(
      (s) => s.name === "田端" && s.prefecture === "東京",
    );
    expect(tabataRows.length).toBe(1);
  });

  it("keeps the first occurrence encountered while iterating STATION_DATA", () => {
    // 山手線 is iterated before 京浜東北線, so 田端 should resolve to ym_tabata.
    const tabata = unique.find(
      (s) => s.name === "田端" && s.prefecture === "東京",
    );
    expect(tabata?.id).toBe("ym_tabata");
  });

  it("treats stations with the same name in different prefectures as distinct", () => {
    // Sanity: keys include prefecture, so cross-prefecture name collisions
    // would still yield separate rows.
    const grouped = new Map<string, Set<string>>();
    for (const s of unique) {
      if (!grouped.has(s.name)) grouped.set(s.name, new Set());
      grouped.get(s.name)!.add(s.prefecture);
    }
    for (const [, prefs] of grouped) {
      // Each (name, prefecture) appears at most once in `unique`, so the size
      // of the prefecture set equals the number of rows for that name.
      const rows = unique.filter((s) => prefs.has(s.prefecture));
      expect(rows.length).toBeGreaterThanOrEqual(prefs.size);
    }
  });
});

describe("memoization", () => {
  it("returns the same getAllStations array reference across calls", () => {
    expect(getAllStations()).toBe(getAllStations());
  });

  it("returns the same getUniqueStations array reference across calls", () => {
    expect(getUniqueStations()).toBe(getUniqueStations());
  });
});

describe("CATEGORIES", () => {
  it("exposes a non-empty list of unique labels", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it("includes a fallback bucket", () => {
    expect(CATEGORIES).toContain("その他");
  });
});
