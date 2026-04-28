import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "駅周辺リクエスト",
  description: "駅周辺に欲しい施設をリクエストできるアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-slate-200 flex justify-center">
        <div className="w-full max-w-[390px] bg-white shadow-xl flex flex-col min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
