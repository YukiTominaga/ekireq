"use client";

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
      className="flex border-t border-slate-200 bg-white"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-label={t.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 pt-2 pb-1.5 flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer font-[inherit] ${
              isActive ? "text-slate-900" : "text-slate-400"
            }`}
          >
            <Icon name={t.icon} size={21} sw={isActive ? 2 : 1.5} />
            <span
              className={`text-[11px] ${isActive ? "font-semibold" : "font-normal"}`}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
