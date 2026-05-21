import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegister } from "./_components/ServiceWorkerRegister";
import { BASE_PATH } from "./lib/basePath";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "駅リク",
  description: "駅周辺に欲しい施設をリクエストできるアプリ",
  applicationName: "駅リク",
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.ico`, sizes: "any" },
      {
        url: `${BASE_PATH}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${BASE_PATH}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `${BASE_PATH}/icons/apple-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "駅リク",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // WCAG 1.4.4 (Resize Text) 準拠: ユーザーピンチズームを禁止しない。
  maximumScale: 5,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-slate-200 flex justify-center overflow-hidden">
        <div className="w-full max-w-[390px] h-full bg-white shadow-xl flex flex-col">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
