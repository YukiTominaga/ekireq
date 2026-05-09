"use client";

import { useEffect } from "react";
import { BASE_PATH } from "../lib/basePath";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const url = `${BASE_PATH}/sw.js`;
    const scope = `${BASE_PATH}/`;
    const register = () => {
      navigator.serviceWorker.register(url, { scope }).catch(() => {
        // Registration failure should not break the app.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
