'use client';

import { RULES } from '@/app/(admin)/reservations/constants';

export function RulesScreen() {
  return (
    <div className="max-w-[780px] px-10 pt-9 pb-11">
      <div className="text-[22px] font-bold tracking-[-0.4px] text-[#1B0B28]">이용 규칙 / 안내</div>
      <div className="mt-1.5 text-[13px] text-[#8895A7]">예약 폼의 동의 체크박스에서 이 페이지로 연결됩니다.</div>

      <div className="mt-6 flex flex-col gap-px overflow-hidden rounded-xl border border-[#E7ECF3] bg-[#E7ECF3]">
        {RULES.map((rule, index) => (
          <div key={rule} className="flex gap-4 bg-white px-[18px] py-4">
            <span className="pt-0.5 text-xs font-bold text-[#b611f5] [font-variant-numeric:tabular-nums]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm leading-[1.55] text-[#2A3A4D]">{rule}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-6 rounded-xl border border-dashed border-[#DDE3EC] bg-[#FBFAFD] px-[18px] py-4">
        <div>
          <div className="text-[11.5px] font-semibold text-[#9AA6B5]">운영 시간</div>
          <div className="mt-1 text-sm font-semibold text-[#1B0B28]">매일 24시간</div>
        </div>
        <div>
          <div className="text-[11.5px] font-semibold text-[#9AA6B5]">1인 1일 최대</div>
          <div className="mt-1 text-sm font-semibold text-[#1B0B28]">3시간</div>
        </div>
        <div>
          <div className="text-[11.5px] font-semibold text-[#9AA6B5]">문의</div>
          <div className="mt-1 text-sm font-semibold text-[#1B0B28]">동아리방 담당자</div>
        </div>
      </div>
    </div>
  );
}
