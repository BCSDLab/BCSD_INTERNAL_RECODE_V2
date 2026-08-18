import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-10"
      style={{
        background:
          'radial-gradient(ellipse 900px 500px at 25% 15%, rgba(195,96,243,.16), transparent),' +
          'radial-gradient(ellipse 700px 500px at 80% 85%, rgba(195,96,243,.09), transparent),' +
          '#0b0d1a',
      }}
    >
      {children}
    </div>
  );
}
