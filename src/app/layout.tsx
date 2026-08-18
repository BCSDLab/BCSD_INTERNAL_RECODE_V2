import type { Metadata } from 'next';
import { SessionBootstrap } from '@/lib/auth/session-bootstrap';
import './globals.css';

export const metadata: Metadata = {
  title: 'BCSD Internal',
  description: 'BCSD Internal 로그인',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full">
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
