import { defineConfig } from "vitest/config";

// Firestore ルールの allow/deny テスト専用。エミュレータ前提なので
// 通常の vitest.config.ts (app/**) とは分離し、`npm run test:rules` から
// firebase emulators:exec 経由で実行する。
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
