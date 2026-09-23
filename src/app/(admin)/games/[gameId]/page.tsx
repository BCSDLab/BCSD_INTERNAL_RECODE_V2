'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { gameQueries } from '@/api/game/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { useSession } from '@/lib/auth/use-session';
import { canManageGames } from '@/lib/permissions';
import { BasicInfoTab } from './components/BasicInfoTab';
import { BuildsTab } from './components/BuildsTab';
import { DescriptionTab } from './components/DescriptionTab';
import { RatingTab } from './components/RatingTab';
import { ScreenshotsTab } from './components/ScreenshotsTab';

const TABS = ['기본정보', '상세설명', '스크린샷', '등급정보', '빌드'] as const;
type Tab = (typeof TABS)[number];

/**
 * 와이어프레임 1b: "← 목록" + 제목 아래 탭 5개, 탭마다 저장 방식이 다르다
 * (기본정보·등급정보는 debounce/upsert, 상세설명은 자동저장, 스크린샷·빌드는
 * 즉시 반영). 그래서 탭 전환은 페이지 이동이 아니라 클라이언트 상태로만 하고,
 * 각 탭이 detail을 그대로 받아 자기 저장 방식을 스스로 정한다.
 */
export default function GameEditPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = Number(params.gameId);
  const [tab, setTab] = useState<Tab>('기본정보');
  const { session } = useSession();
  const canManage = canManageGames(session?.member);

  const { data: detail, isLoading } = useQuery(gameQueries.game(gameId));

  return (
    <>
      <PageHeader
        crumb="홈페이지 / 게임"
        slug={detail ? `/games/${detail.slug}` : undefined}
        title={detail?.name ?? '게임'}
      />

      <div className="w-full px-8 pt-6 pb-10">
        <Link href="/games" className="text-faint hover:text-text mb-4 inline-block text-xs">
          ← 목록
        </Link>

        {isLoading || !detail ? (
          <p className="text-faint m-0 text-[13px]">불러오는 중…</p>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex min-w-0 flex-col gap-5">
            <TabsList>
              {TABS.map((item) => (
                <TabsTab key={item} value={item}>
                  {item}
                  {item === '스크린샷' && detail.screenshots.length > 0 && (
                    <span className="text-faint ml-1.5 text-[11px]">{detail.screenshots.length}</span>
                  )}
                </TabsTab>
              ))}
            </TabsList>

            <TabsPanel value="기본정보">
              <BasicInfoTab gameId={gameId} detail={detail} canManage={canManage} />
            </TabsPanel>
            <TabsPanel value="상세설명">
              <DescriptionTab gameId={gameId} detail={detail} canManage={canManage} />
            </TabsPanel>
            <TabsPanel value="스크린샷">
              <ScreenshotsTab gameId={gameId} detail={detail} canManage={canManage} />
            </TabsPanel>
            <TabsPanel value="등급정보">
              <RatingTab gameId={gameId} detail={detail} canManage={canManage} />
            </TabsPanel>
            <TabsPanel value="빌드">
              <BuildsTab gameId={gameId} canManage={canManage} />
            </TabsPanel>
          </Tabs>
        )}
      </div>
    </>
  );
}
