'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { activityQueries } from '@/api/activity/queries';
import { logout } from '@/api/auth/api';
import { memberQueries } from '@/api/member/queries';
import { trackQueries } from '@/api/track/queries';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { setSession } from '@/lib/auth/session-store';
import { MEMBER_TYPE_LABELS, TRACK_LABELS } from '@/lib/member-labels';

const NAV_ITEMS = [
  { href: '/tracks', label: '트랙 페이지' },
  { href: '/curriculums', label: '커리큘럼' },
  { href: '/activities', label: '활동' },
  { href: '/members', label: '인명부' },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuthGuard();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAuthenticated = status === 'ready' && !!session;

  const { data: trackPages } = useQuery({ ...trackQueries.trackPages(), enabled: isAuthenticated });

  // 활동 총 건수는 size=1로 첫 페이지만 받아 totalElements만 읽는다.
  // 커리큘럼은 시안에 "18주"가 있지만 전체 주차를 세는 저렴한 엔드포인트가 없어 비워 둔다.
  const { data: activityPage } = useQuery({ ...activityQueries.total(), enabled: isAuthenticated });

  // 인명부 총원. counts는 필터와 무관한 전체 집계라 1건만 받아도 총원이 정확하다.
  // 관리자와 일반이 읽는 경로가 다르므로 role로 갈라 준다(일반도 목록 조회는 허용된다).
  const { data: memberPage } = useQuery({
    ...memberQueries.total(session?.member.role === 'ADMIN'),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    // 세션 부트스트랩 중이거나 로그인으로 리다이렉트되는 동안 빈 화면을 보인다.
    return null;
  }

  const counts: Record<string, number | undefined> = {
    '/tracks': trackPages?.length,
    '/curriculums': undefined,
    '/activities': activityPage?.totalElements,
    '/members': memberPage?.counts.total,
  };

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setSession(null);
      router.replace('/login');
    }
  }

  return (
    <div className="bg-bg text-text flex min-h-screen">
      <aside className="border-line bg-sidebar sticky top-0 flex h-screen w-[250px] flex-none flex-col border-r px-4 pt-[22px] pb-[18px]">
        <div className="flex items-center gap-[11px] px-1.5 pb-5">
          <div className="border-primary-line flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border">
            <div className="bg-primary h-2.5 w-2.5 rounded-full" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[15px] font-semibold tracking-[-.01em] whitespace-nowrap">BCSD Internal</div>
            <div className="text-faint text-[11px] whitespace-nowrap">홈페이지 콘텐츠 관리</div>
          </div>
        </div>

        <div className="text-faint px-2 pb-[9px] text-[11px] tracking-[.14em] whitespace-nowrap uppercase">Pages</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const count = counts[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary-soft text-primary-text' : 'text-muted hover:bg-panel2'
                }`}
              >
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-current opacity-70" />
                {item.label}
                {count !== undefined && <span className="ml-auto flex-none text-[11px] opacity-55">{count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-line relative mt-auto border-t pt-3.5">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="flex w-full cursor-pointer items-center gap-2.5 text-left"
          >
            <div className="bg-primary h-7 w-7 flex-none rounded-full" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="text-xs font-medium whitespace-nowrap">{session.member.name}</div>
              <div className="text-faint text-[11px] whitespace-nowrap">
                {MEMBER_TYPE_LABELS[session.member.memberType]} · {TRACK_LABELS[session.member.track]}
              </div>
            </div>
            <div className="text-faint ml-auto flex-none text-sm">⌄</div>
          </button>
          {isUserMenuOpen && (
            <div className="border-line2 bg-panel absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-[10px] border">
              <button
                type="button"
                onClick={handleLogout}
                className="text-muted hover:bg-panel2 hover:text-text w-full cursor-pointer px-3 py-2.5 text-left text-xs transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
