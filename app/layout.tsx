import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegister } from "./_components/ServiceWorkerRegister";
import { ToastProvider } from "./_components/Toast";
import { BASE_PATH } from "./lib/basePath";
import "./globals.css";

// weight を指定しない場合 next/font は Inter の可変フォント (variable axis) を
// 単一ファイルでロードする。固定 weight を 4 つ並べるより配信バイト数が小さく、
// かつ font-weight を任意の値で指定できる。
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
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

// GitHub Pages では HTTP レスポンスヘッダを追加できないため、Content-Security-Policy
// は <meta http-equiv> で宣言する。inline style を多用する都合上 style-src には
// 'unsafe-inline' を含めている。Google Maps の SDK は 'unsafe-eval' を要求する。
// 必要なサードパーティ origin は最小に絞ること。
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com https://*.google.com https://maps.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body className="h-full bg-slate-200 flex justify-center overflow-hidden">
        <ToastProvider>
          <div className="w-full max-w-[390px] h-full bg-white shadow-xl flex flex-col">
            {children}
          </div>
        </ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
