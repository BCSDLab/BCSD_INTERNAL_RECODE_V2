import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';

import { gameQueries } from '@/entities/game';
import { canManageGames } from '@/entities/member';
import { useSession } from '@/entities/session';
import { PageHeader } from '@/shared/ui/page-header';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/shared/ui/tabs';

import { GAME_TABS as TABS } from '../../model/search';
import { BasicInfoTab } from './components/BasicInfoTab';
import { BuildsTab } from './components/BuildsTab';
import { DescriptionTab } from './components/DescriptionTab';
import { RatingTab } from './components/RatingTab';
import { ScreenshotsTab } from './components/ScreenshotsTab';

/**
 * 와이어프레임 1b: "← 목록" + 제목 아래 탭 5개, 탭마다 저장 방식이 다르다
 * (기본정보·등급정보는 debounce/upsert, 상세설명은 자동저장, 스크린샷·빌드는
 * 즉시 반영). 탭 선택은 URL에 남기고,
 * 각 탭이 detail을 그대로 받아 자기 저장 방식을 스스로 정한다.
 */
export default function GameEditPage() {
  const params = useParams({ from: '/_admin/games/$gameId' });
  const gameId = Number(params.gameId);
  const search = useSearch({ from: '/_admin/games/$gameId' });
  const navigate = useNavigate({ from: '/games/$gameId' });
  const tab = search.tab ?? '기본정보';
  const setTab = (nextTab: (typeof TABS)[number]) => {
    void navigate({ search: { tab: nextTab }, resetScroll: false });
  };
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
        <Link to="/games" className="text-faint hover:text-text mb-4 inline-block text-xs">
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
