import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  // 개발 서버와 프로덕션 빌드가 서로의 출력을 덮어쓰지 않도록 폴더를 나눕니다.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        // 고객 공유 페이지는 검색에 노출되지 않게 합니다.
        source: "/s/:token",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
