import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const appCheckSiteKey =
  process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_KEY;

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "demo-ekireq.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-ekireq",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "demo-ekireq.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "demo-app-id",
};

function ensureConfigured() {
  if (useEmulator) return;
  const required = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Firebase 設定が不足しています: ${missing.join(", ")}. .envrc に NEXT_PUBLIC_FIREBASE_* を設定して direnv allow を実行してください。`,
    );
  }
}

// App Check: 未ログインでの閲覧は許可しつつ、正規アプリ以外（Firebase SDK を
// 直叩きするスクレイピング等）からの Firestore アクセスを reCAPTCHA v3 で弾く。
// emulator 接続時・site key 未設定時・サーバ(SSG)実行時は初期化しない。
function initAppCheck(app: FirebaseApp) {
  if (typeof window === "undefined") return;
  if (useEmulator || !appCheckSiteKey) return;

  // ローカルで実 Firebase に対して App Check を試す場合のデバッグトークン。
  // 起動後にコンソールへ出力されるトークンを
  // Firebase Console > App Check > アプリ > デバッグトークンの管理 に登録する。
  if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG === "true") {
    // @ts-expect-error App Check のデバッグトークン用グローバル
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // HMR 等で二重初期化された場合は無視する。
  }
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _emulatorConnected = false;

export function getFirebase() {
  if (!_app) {
    ensureConfigured();
    _app = getApps()[0] ?? initializeApp(config);
    // 他サービスを使う前に App Check を初期化し、トークンを自動付与させる。
    initAppCheck(_app);
    _auth = getAuth(_app);
    _db = getFirestore(_app, "ekireq");

    if (useEmulator && !_emulatorConnected) {
      connectAuthEmulator(_auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(_db, "127.0.0.1", 8080);
      _emulatorConnected = true;
    }
  }
  return { app: _app, auth: _auth!, db: _db! };
}
