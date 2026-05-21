"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/app/lib/tokens";
import { useAuth, signOut } from "@/app/lib/auth";
import { subscribeStationCounts } from "@/app/lib/firestore";
import { getAllStations, type StationWithMeta } from "@/app/lib/stations";
import { Btn } from "./ui";
import { Icon } from "./Icon";
import { UserAvatar } from "./UserAvatar";
import { GoogleMapView } from "./GoogleMapView";
import { StationSheet } from "./StationSheet";
import { StationListView } from "./StationListView";
import { MyPageView } from "./MyPageView";
import { AuthModal } from "./AuthModal";
import { BottomNav, type Tab } from "./BottomNav";

export function StationApp() {
  const { user, ready, isAdmin, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("map");
  const [selected, setSelected] = useState<StationWithMeta | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [allStations, setAllStations] = useState<StationWithMeta[]>([]);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  useEffect(() => {
    let cancelled = false;
    getAllStations().then((s) => {
      if (!cancelled) setAllStations(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 地図ではマーカー重複を避けるため、駅 key 単位で重複排除する。
  const mapStations = useMemo(() => {
    const seen = new Set<string>();
    const out: StationWithMeta[] = [];
    for (const s of allStations) {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        out.push(s);
      }
    }
    return out;
  }, [allStations]);

  useEffect(() => {
    return subscribeStationCounts(setCounts);
  }, []);

  const handleSelect = useCallback((stn: StationWithMeta) => {
    setSelected(stn);
  }, []);

  const handleLoginRequest = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTabChange = useCallback((t: Tab) => {
    setTab(t);
    if (t !== "map") setSelected(null);
  }, []);

  const handleCloseSelected = useCallback(() => setSelected(null), []);
  const handleCloseAuth = useCallback(() => setShowAuth(false), []);
  const handleOpenMyPage = useCallback(() => setTab("mypage"), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        background: C.white,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "calc(12px + env(safe-area-inset-top))",
          paddingRight: "calc(14px + env(safe-area-inset-right))",
          paddingBottom: 12,
          paddingLeft: "calc(14px + env(safe-area-inset-left))",
          borderBottom: `1px solid ${C.slate200}`,
          background: C.white,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="train-front" size={18} color={C.slate900} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>
            駅周辺リクエスト
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {ready && !user && (
            <Btn size="sm" onClick={handleLoginRequest}>
              ログイン
            </Btn>
          )}
          {ready && user && (
            <button
              onClick={handleOpenMyPage}
              aria-label="マイページを開く"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <UserAvatar
                photoURL={user.photoURL}
                fallback={
                  (user.displayName || user.email || "U")[0]?.toUpperCase() ??
                  "U"
                }
                size={30}
                bg={C.slate900}
                fg={C.white}
                fontSize={12}
              />
            </button>
          )}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            display: tab === "map" ? "flex" : "none",
            flex: 1,
            flexDirection: "column",
            position: "relative",
          }}
        >
          {mapsApiKey ? (
            <GoogleMapView
              apiKey={mapsApiKey}
              mapId={mapsMapId}
              stations={mapStations}
              counts={counts}
              onSelect={handleSelect}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                fontSize: 12,
                color: C.slate500,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が未設定です。
              <br />
              .envrc に Google Maps API キーを設定して
              <br />
              direnv allow を実行してください。
            </div>
          )}
        </div>

        {tab === "list" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <StationListView
              allStations={allStations}
              counts={counts}
              onSelect={handleSelect}
            />
          </div>
        )}

        {tab === "mypage" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: C.slate50,
            }}
          >
            <MyPageView
              key={user?.uid ?? "anon"}
              user={user}
              isAdmin={isAdmin}
              onLogin={handleLoginRequest}
              onLogout={handleLogout}
              onRefreshUser={refreshUser}
            />
          </div>
        )}

        {selected && (
          <StationSheet
            station={selected}
            user={user}
            onClose={handleCloseSelected}
            onLoginRequest={handleLoginRequest}
          />
        )}

        {showAuth && (
          <AuthModal onClose={handleCloseAuth} onSuccess={handleAuthSuccess} />
        )}
      </main>

      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  );
}
