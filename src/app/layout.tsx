import type { Metadata } from 'next';
import { SessionBootstrap } from '@/lib/auth/session-bootstrap';
import { QueryProvider } from '@/lib/query-provider';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'BCSD Internal',
  description: 'BCSD Internal 로그인',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // 부트 스크립트가 하이드레이션 전에 data-theme을 심으므로 서버 HTML과 달라진다.
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/*
          시안이 쓰는 variable 빌드로 맞춘다(기존에는 static pretendard.css였다).
          관리 화면 디자인이 'Pretendard Variable'을 전제로 자간·굵기를 정해 두었다.
        */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <SessionBootstrap />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
