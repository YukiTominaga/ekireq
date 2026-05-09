"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/app/lib/tokens";
import { useAuth, signOut } from "@/app/lib/auth";
import { subscribeStationCounts } from "@/app/lib/firestore";
import { getUniqueStations, type StationWithMeta } from "@/app/lib/stations";
import { Btn } from "./ui";
import { Icon } from "./Icon";
import { GoogleMapView } from "./GoogleMapView";
import { StationSheet } from "./StationSheet";
import { StationListView } from "./StationListView";
import { MyPageView } from "./MyPageView";
import { AuthModal } from "./AuthModal";
import { BottomNav, type Tab } from "./BottomNav";

export function StationApp() {
  const { user, ready, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("map");
  const [selected, setSelected] = useState<StationWithMeta | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const mapStations = useMemo(() => getUniqueStations(), []);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  useEffect(() => {
    return subscribeStationCounts(setCounts);
  }, []);

  function handleSelect(stn: StationWithMeta) {
    setSelected(stn);
  }

  function handleLoginRequest() {
    setShowAuth(true);
  }

  function handleAuthSuccess() {
    setShowAuth(false);
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        background: C.white,
      }}
    >
      {/* Header */}
      <div
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
              onClick={() => setTab("mypage")}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: C.slate900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: C.white,
                cursor: "pointer",
                border: "none",
                overflow: "hidden",
                padding: 0,
              }}
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (user.displayName || user.email || "U")[0]?.toUpperCase()
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div
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
            <StationListView counts={counts} onSelect={handleSelect} />
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
            />
          </div>
        )}

        {selected && (
          <StationSheet
            station={selected}
            user={user}
            onClose={() => setSelected(null)}
            onLoginRequest={handleLoginRequest}
          />
        )}

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>

      <BottomNav
        active={tab}
        onChange={(t) => {
          setTab(t);
          if (t !== "map") setSelected(null);
        }}
      />
    </div>
  );
}
