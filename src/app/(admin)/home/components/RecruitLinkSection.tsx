'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateRecruitLink } from '@/api/home/api';
import { homeKeys, homeQueries } from '@/api/home/queries';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { SectionCard } from '@/components/ui/section-card';
import { SwitchRow } from '@/components/ui/switch';

interface FormValues {
  googleFormUrl: string;
  isOpen: boolean;
  closeDate: string;
  closedMessage: string;
}

const EMPTY_FORM: FormValues = { googleFormUrl: '', isOpen: false, closeDate: '', closedMessage: '모집 예정' };

/**
 * 유일하게 변경 이력을 남기는 콘텐츠다(백엔드 AdminRecruitLinkService) — 자동저장이
 * 아니라 명시적 "저장" 버튼으로만 반영해 이력이 타이핑마다 쌓이지 않게 한다.
 */
export function RecruitLinkSection() {
  const queryClient = useQueryClient();
  const { data: current } = useQuery(homeQueries.recruitLink());
  const { data: history } = useQuery(homeQueries.recruitLinkHistory());

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [initialized, setInitialized] = useState(false);
  if (current && !initialized) {
    setInitialized(true);
    setForm({
      googleFormUrl: current.googleFormUrl,
      isOpen: current.isOpen,
      closeDate: current.closeDate ?? '',
      closedMessage: current.closedMessage,
    });
  }

  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateRecruitLink({
        googleFormUrl: form.googleFormUrl.trim(),
        isOpen: form.isOpen,
        closeDate: form.closeDate || null,
        closedMessage: form.closedMessage.trim(),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: homeKeys.recruitLink() });
      queryClient.invalidateQueries({ queryKey: homeKeys.recruitLinkHistory() });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });

  return (
    <SectionCard
      title="모집 링크"
      caption="메인과 모집 페이지 버튼이 이 링크를 씁니다"
      action={
        <button
          type="button"
          onClick={() => setIsHistoryOpen((v) => !v)}
          className="text-faint hover:text-text cursor-pointer text-[11px]"
        >
          변경 기록 {isHistoryOpen ? '숨기기' : '보기'} ({history?.length ?? 0})
        </button>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="구글폼 URL" hint="forms.gle 또는 docs.google.com/forms 주소만 저장됩니다">
          <input
            value={form.googleFormUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, googleFormUrl: e.target.value }))}
            placeholder="https://forms.gle/…"
            className={INPUT_CLASS}
          />
        </Field>

        <div className="flex gap-3.5">
          {/*
            Field는 <label>로 감싸는데, 그 안의 SwitchRow도 자체적으로 클릭·hidden input을
            관리하는 컨트롤이라 <label> 안에 두면 클릭이 이중으로 먹을 수 있다(암묵적
            label-for 연결 + SwitchRow 자체 클릭이 겹침). 그래서 이 필드만 Field를 쓰지
            않고 같은 캡션 레이아웃을 <div>로 직접 만든다.
          */}
          <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <span className="text-muted text-xs whitespace-nowrap">모집 상태</span>
            <SwitchRow
              checked={form.isOpen}
              onCheckedChange={(next) => setForm((prev) => ({ ...prev, isOpen: next }))}
              className={`w-full gap-[9px] rounded-[10px] border px-[13px] py-[11px] ${
                form.isOpen ? 'border-primary-line bg-primary-soft' : 'border-line bg-panel2'
              }`}
            >
              <span className={`text-sm whitespace-nowrap ${form.isOpen ? 'text-primary-text' : 'text-muted'}`}>
                {form.isOpen ? '모집 중 · 버튼 활성' : '모집 종료'}
              </span>
            </SwitchRow>
          </div>
          <Field label="모집 종료 예정일" hint="선택" className="w-[180px] flex-none">
            <input
              type="date"
              value={form.closeDate}
              onChange={(e) => setForm((prev) => ({ ...prev, closeDate: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="모집이 닫혔을 때 버튼 문구">
          <input
            value={form.closedMessage}
            maxLength={100}
            onChange={(e) => setForm((prev) => ({ ...prev, closedMessage: e.target.value }))}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={!form.googleFormUrl.trim() || !form.closedMessage.trim() || saveMutation.isPending}
          >
            저장
          </Button>
        </div>

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}

        {isHistoryOpen && (
          <div className="border-line flex flex-col gap-1.5 border-t pt-3">
            {!history || history.length === 0 ? (
              <p className="text-faint m-0 text-[12px]">변경 기록이 없습니다.</p>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="text-faint flex items-center gap-2 text-[11px]">
                  <span className="flex-none">{new Date(entry.changedAt).toLocaleString('ko-KR')}</span>
                  <span className="flex-none">{entry.changedByName ?? '알 수 없음'}</span>
                  <span className="truncate">· {entry.googleFormUrl}</span>
                  <span className="flex-none">{entry.isOpen ? '모집 시작' : '모집 종료'}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
