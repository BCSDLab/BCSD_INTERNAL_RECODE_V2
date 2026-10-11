import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';

export const DEFAULT_DUES_LIST_URL = 'https://internal.bcsdlab.com/ledger/dues';

export const DUES_NOTIFICATION_TEMPLATE = `[{년도 및 학기} 회비 납부 안내]

안녕하세요. BCSD 부회장 {발신자}입니다.

{년도 및 학기} 개강을 맞이하여, BCSD 회비 납부를 부탁드립니다.

💰금액: {금액}

🧾납입 계좌: 신한은행 100-031-597757 비씨에스디랩

🍎면제 대상: 트랙장, 교육장을 포함하여 <{회칙URL}|회칙>상 면제 대상자로 지정된 분 및 임원진 회의를 통해 면제 대상자로 지정된 분

📝면제 신청: <{면제신청서URL}|면제신청서>를 통해 면제 신청 후, 트랙장을 통해 임원진에 전달 부탁드립니다. (트랙장 및 교육장 제외)

📆납부 기간: ~ {납부 마감일}

👀납부 확인: <{회비납부목록URL}|회비납부목록>에 익월 반영.

원활한 동아리 운영을 위해 회비 납부를 부탁드립니다.`;

export const UNPAID_NOTIFICATION_TEMPLATE = `BCSD는 회원분들의 성장을 위해 다양한 서비스를 기획 및 개발하고 있습니다.
또한 동아리의 원활한 운영을 위해 모든 회원은 회칙에 따라 회비를 납부하고 있습니다.

{이름}님, {회비이름} 중 {미납액}이 미납상태입니다.

원활한 운영을 위해 아래 계좌로 신속한 납부를 부탁드립니다.
계좌: 신한은행 100-031-597757 (비씨에스디랩)

세부적인 미납 내역은 <{회비납부목록URL}|납부 문서>에서 확인할 수 있습니다.

이미 회비를 납부했는데 미납 처리되었거나 문의 사항이 있다면 Slack {담당자 멘션} 또는 {전화번호}로 연락해 주세요.
감사합니다.`;

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function getDuesNotificationTargets(members: MemberDues[]) {
  return members.filter((member) => (member.assessedAmount ?? 0) > 0);
}

export function getUnpaidNotificationTargets(members: MemberDues[]) {
  return members.filter((member) => (member.unpaidAmount ?? 0) > 0);
}

export function getDistinctDuesAmounts(members: MemberDues[]) {
  return [...new Set(getDuesNotificationTargets(members).map((member) => member.assessedAmount as number))].sort(
    (first, second) => first - second,
  );
}

export function formatDuesDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isValidDuesDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function formatDeadline(value: string) {
  if (!isValidDuesDate(value)) return '{납부 마감일}';
  const [year, month, day] = value.split('-').map(Number);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')} (${weekday})`;
}

function semesterLabel(semester: SemesterDuesSummary) {
  return semester.title.replace(/\s*회비$/, '');
}

function duesName(semester: SemesterDuesSummary) {
  return `${semesterLabel(semester)} 정기회비`;
}

export function createDuesNotificationMessage({
  template,
  semester,
  amount,
  senderName,
  rulesUrl,
  exemptionFormUrl,
  duesListUrl,
  deadline,
}: {
  template: string;
  semester: SemesterDuesSummary;
  amount: number;
  senderName: string;
  rulesUrl: string;
  exemptionFormUrl: string;
  duesListUrl: string;
  deadline: string;
}) {
  return template
    .replaceAll('{년도 및 학기}', semesterLabel(semester))
    .replaceAll('{발신자}', senderName || '{발신자}')
    .replaceAll('{금액}', formatCurrency(amount))
    .replaceAll('{회칙URL}', rulesUrl || '{회칙URL}')
    .replaceAll('{면제신청서URL}', exemptionFormUrl || '{면제신청서URL}')
    .replaceAll('{회비납부목록URL}', duesListUrl || '{회비납부목록URL}')
    .replaceAll('{납부 마감일}', formatDeadline(deadline));
}

export function createUnpaidNotificationMessage({
  template,
  semester,
  member,
  duesListUrl,
  managerPhoneNumber,
}: {
  template: string;
  semester: SemesterDuesSummary;
  member: MemberDues;
  duesListUrl: string;
  managerPhoneNumber?: string | null;
}) {
  return (
    template
      .replaceAll('{이름}', member.name)
      .replaceAll('{회비이름}', duesName(semester))
      .replaceAll('{미납액}', formatCurrency(member.unpaidAmount ?? 0))
      .replaceAll('{회비납부목록URL}', duesListUrl || '{회비납부목록URL}')
      // {담당자 멘션}은 그대로 둔다 — 서버가 로그인한 관리자의 Slack ID로 바꾼다.
      .replaceAll('{전화번호}', managerPhoneNumber?.trim() || '{전화번호}')
  );
}
