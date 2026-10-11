import Link from 'next/link';
import type { SemesterDuesSummary } from '@/components/dues/types';

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

export function SemesterDuesListView({ semesters }: { semesters: SemesterDuesSummary[] }) {
  if (semesters.length === 0) return <SemesterDuesEmptyView />;

  return (
    <main className="mx-auto w-full max-w-[1480px] flex-1 px-8 pt-7 pb-12">
      <div className="mb-5">
        <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
        <h1 className="text-[25px] font-extrabold tracking-[-0.02em]">학기 회비 목록</h1>
        <p className="text-muted mt-1.5 text-xs">학기별 납부 현황과 미납·초과납부 상태를 확인하세요.</p>
      </div>

      <section className="border-line bg-panel overflow-hidden rounded-[13px] border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-panel2 text-faint text-[11px] font-bold tracking-[0.04em]">
              <tr className="border-line border-b">
                <th className="w-[180px] px-3 py-2.5">회비</th>
                <th className="px-3 py-2.5 text-right">납부대상</th>
                <th className="px-3 py-2.5 text-right">완료</th>
                <th className="px-3 py-2.5 text-right">미납</th>
                <th className="px-3 py-2.5 text-right">총액</th>
                <th className="px-3 py-2.5 text-right">납부액</th>
                <th className="px-3 py-2.5 text-right">미납액</th>
                <th className="w-[110px] px-3 py-2.5 text-right">비고</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => (
                <tr key={semester.id} className="border-line hover:bg-primary-sunken border-b last:border-b-0">
                  <td className="p-0">
                    <Link
                      className="text-primary-text block px-3 py-3 text-[12.5px] font-medium"
                      href={`/ledger/dues/${semester.id}`}
                    >
                      {semester.shortLabel}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right text-[12.5px]">{semester.targetMembers}명</td>
                  <td className="px-3 py-3 text-right text-[12.5px]">{semester.completedMembers}명</td>
                  <td className="px-3 py-3 text-right text-[12.5px]">{semester.unpaidMembers}명</td>
                  <td className="text-muted px-3 py-3 text-right text-[12.5px]">{formatWon(semester.totalAmount)}</td>
                  <td className="text-muted px-3 py-3 text-right text-[12.5px]">{formatWon(semester.paidAmount)}</td>
                  <td className="text-muted px-3 py-3 text-right text-[12.5px]">{formatWon(semester.unpaidAmount)}</td>
                  <td className="px-3 py-3 text-right">
                    {semester.needsReview ? (
                      <span className="border-danger-line bg-danger-soft text-danger inline-flex rounded-full border px-2.5 py-[3px] text-[11px] font-semibold">
                        확인 필요
                      </span>
                    ) : (
                      <span className="text-faint text-[12px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-faint max-w-[900px] pt-3 text-[11px] leading-[1.7]">
        회비별 행을 선택하면 학기 회비 상세와 회원별 납부 상태로 이동합니다.
      </p>
    </main>
  );
}

export function SemesterDuesEmptyView() {
  return (
    <main className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col px-8 pt-7 pb-12">
      <div className="text-faint mb-1.5 text-[10.5px] font-bold tracking-[0.16em]">장부 · 회비 관리</div>
      <h1 className="text-[25px] font-extrabold tracking-[-0.02em]">학기 회비 목록</h1>
      <div className="flex min-h-[520px] flex-1 items-center justify-center">
        <div className="border-dash text-muted rounded-[13px] border border-dashed px-16 py-11 text-center text-[13px]">
          아직 생성된 학기 회비가 없습니다.
        </div>
      </div>
    </main>
  );
}
