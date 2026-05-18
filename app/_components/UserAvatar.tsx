"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";
import { C } from "@/app/lib/tokens";

type Props = {
  photoURL: string | null | undefined;
  fallback: string;
  size: number;
  bg?: string;
  fg?: string;
  fontSize?: number;
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  style?: CSSProperties;
};

export function UserAvatar({
  photoURL,
  fallback,
  size,
  bg = C.slate200,
  fg = C.slate600,
  fontSize,
  referrerPolicy,
  style,
}: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSize ?? Math.round(size * 0.4),
        fontWeight: 700,
        overflow: "hidden",
        ...style,
      }}
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt=""
          width={size}
          height={size}
          referrerPolicy={referrerPolicy}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
