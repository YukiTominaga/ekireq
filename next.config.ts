import type { NextConfig } from "next";

/** GitHub Actions では GITHUB_REPOSITORY=owner/repo が渡る。`*.github.io` リポジトリはユーザーサイト（ルート配信）なので basePath なし。 */
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath =
  repoName && !repoName.endsWith(".github.io") ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
