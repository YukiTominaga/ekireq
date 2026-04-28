"use client";

import { C } from "@/app/lib/tokens";
import { Icon } from "./Icon";

export type Tab = "map" | "list" | "mypage";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "map", icon: "map", label: "地図" },
  { id: "list", icon: "train", label: "駅一覧" },
  { id: "mypage", icon: "user", label: "マイページ" },
];

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      style={{
        display: "flex",
        borderTop: `1px solid ${C.slate200}`,
        background: C.white,
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            padding: "9px 0 7px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            color: active === t.id ? C.slate900 : C.slate400,
          }}
        >
          <Icon
            name={t.icon}
            size={21}
            sw={active === t.id ? 2 : 1.5}
            color={active === t.id ? C.slate900 : C.slate400}
          />
          <span
            style={{ fontSize: 9, fontWeight: active === t.id ? 600 : 400 }}
          >
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
