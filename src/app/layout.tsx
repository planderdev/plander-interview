import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "플랜더 인터뷰", template: "%s, 플랜더 인터뷰" },
  description: "고객 미팅을 기록하고 정리해 의뢰로 이어 주는 플랜더 사내 도구",
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** 저장된 테마를 첫 화면 전에 적용합니다. (기본: 다크, 웍스와 같은 키) */
const themeInit = `try{if(localStorage.getItem("pw-theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-dvh antialiased">
        <div className="ambient" aria-hidden />
        <div className="relative z-[2]">{children}</div>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
