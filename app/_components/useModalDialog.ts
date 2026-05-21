"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * native <dialog> をモーダル表示する小さなフック。マウント時に showModal() を
 * 呼び、アンマウント時に close() で後始末する。
 *
 * native dialog は以下を標準で提供する:
 * - Esc キーで閉じる (onCancel イベントで onClose を呼ぶ)
 * - フォーカスを dialog 内に閉じ込める (タブ循環)
 * - 背景コンテンツを inert 化 (背後ボタンをタブで辿れない)
 * - top-layer に描画される (z-index 階層から独立)
 */
export function useModalDialog(): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.open) return;
    el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);
  return ref;
}

/**
 * <dialog onClick={...}> の onClick に渡して使う。コンテンツを子要素で包んでいる
 * 限り、dialog 本体への click は ::backdrop へのクリックと等価なので閉じる。
 */
export function handleDialogBackdropClick(
  e: React.MouseEvent<HTMLDialogElement>,
  onClose: () => void,
) {
  if (e.target === e.currentTarget) onClose();
}
