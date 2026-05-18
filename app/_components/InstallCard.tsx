"use client";

import { C } from "@/app/lib/tokens";
import { triggerInstall, useInstallPrompt } from "@/app/lib/pwaInstall";
import { Btn } from "./ui";
import { Icon } from "./Icon";

export function InstallCard() {
  const prompt = useInstallPrompt();
  if (!prompt) return null;

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 10,
        border: `1px solid ${C.slate200}`,
        marginBottom: 14,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: C.slate100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="download" size={18} color={C.slate900} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.slate900 }}>
          アプリをインストール
        </p>
        <p
          style={{
            fontSize: 12,
            color: C.slate500,
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          ホーム画面に追加していつでもすぐ起動できます
        </p>
      </div>
      <Btn size="sm" onClick={triggerInstall}>
        インストール
      </Btn>
    </div>
  );
}
