import { type QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

function RootLayout() {
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    const semester = /^\/ledger\/dues\/(\d{4})-([12])\/?$/.exec(pathname);
    const title = semester
      ? `${semester[1]}년 ${semester[2]}학기 회비`
      : pathname.startsWith('/ledger/exemptions')
        ? '면제 사유 관리'
        : pathname.startsWith('/ledger/dues')
          ? '학기 회비 목록'
          : pathname === '/ledger'
            ? '장부 관리'
            : undefined;
    document.title = title ? `${title} | BCSD Internal` : 'BCSD Internal';
  }, [pathname]);
  return <Outlet />;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="text-text p-10">
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link to="/">처음으로</Link>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main className="text-text p-10">
      <h1>화면을 불러오지 못했습니다.</h1>
      <button onClick={reset}>다시 시도</button>
    </main>
  ),
});
