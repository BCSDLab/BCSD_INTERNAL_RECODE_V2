'use client';

import { RULES } from '@/app/(admin)/reservations/constants';

export function RulesScreen() {
  return (
    <div className="max-w-[780px] px-10 pt-9 pb-11">
      <div className="text-text text-[22px] font-bold tracking-[-0.4px]">이용 규칙 / 안내</div>
      <div className="text-muted mt-1.5 text-[13px]">예약 폼의 동의 체크박스에서 이 페이지로 연결됩니다.</div>

      <div className="border-line bg-line mt-6 flex flex-col gap-px overflow-hidden rounded-xl border">
        {RULES.map((rule, index) => (
          <div key={rule} className="bg-panel flex gap-4 px-[18px] py-4">
            <span className="pt-0.5 text-xs font-bold text-[#b611f5] [font-variant-numeric:tabular-nums]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-text text-sm leading-[1.55]">{rule}</span>
          </div>
        ))}
      </div>

      <div className="border-line bg-panel2 mt-5 flex gap-6 rounded-xl border border-dashed px-[18px] py-4">
        <div>
          <div className="text-faint text-[11.5px] font-semibold">운영 시간</div>
          <div className="text-text mt-1 text-sm font-semibold">매일 24시간</div>
        </div>
        <div>
          <div className="text-faint text-[11.5px] font-semibold">1인 1일 최대</div>
          <div className="text-text mt-1 text-sm font-semibold">3시간</div>
        </div>
        <div>
          <div className="text-faint text-[11.5px] font-semibold">문의</div>
          <div className="text-text mt-1 text-sm font-semibold">동아리방 담당자</div>
        </div>
      </div>
    </div>
  );
}
