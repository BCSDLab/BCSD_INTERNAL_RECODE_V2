'use client';

import { PageHeader } from '@/components/ui/page-header';
import { MentorSection } from './components/MentorSection';
import { QnaSection } from './components/QnaSection';
import { RecruitLinkSection } from './components/RecruitLinkSection';

/** 와이어프레임 1c: 메인 한 화면에 멘토 캐러셀 + Q&A + 모집 링크가 세로로 쌓인다. */
export default function HomePage() {
  return (
    <>
      <PageHeader crumb="홈페이지 / 메인" slug="bcsdlab.com" title="메인 페이지" />

      <div className="flex w-full flex-col gap-5 px-8 pt-6 pb-10">
        <MentorSection />
        <QnaSection />
        <RecruitLinkSection />
      </div>
    </>
  );
}
