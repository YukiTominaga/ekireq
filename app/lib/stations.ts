// 駅データの型・小さな定数・ユーティリティはここに置き、
// 巨大な STATION_DATA 本体は stations-data.ts に分離する。
//
// クライアントの初期バンドルから ~125KB の静的データを切り離すため、
// データ取得は dynamic import で別チャンクに分割される。
// 同期版が必要なテスト等は stations-data.ts から直接 import すること。

export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type StationWithMeta = Station & {
  prefecture: string;
  line: string;
  key: string;
};

export const PREFECTURES = ["東京", "神奈川", "埼玉", "千葉"] as const;
export type Prefecture = (typeof PREFECTURES)[number];

export const CATEGORIES = [
  "スーパー・コンビニ",
  "飲食店",
  "病院・クリニック",
  "銀行・ATM",
  "図書館・自習室",
  "公園・広場",
  "スポーツ施設",
  "コインランドリー",
  "駐輪場",
  "保育・子育て",
  "ショッピング",
  "その他",
] as const;

export function stationKey(prefecture: string, stationName: string): string {
  return `${prefecture}:${stationName}`;
}

export async function getAllStations(): Promise<StationWithMeta[]> {
  const m = await import("./stations-data");
  return m.getAllStations();
}

export async function getUniqueStations(): Promise<StationWithMeta[]> {
  const m = await import("./stations-data");
  return m.getUniqueStations();
}
