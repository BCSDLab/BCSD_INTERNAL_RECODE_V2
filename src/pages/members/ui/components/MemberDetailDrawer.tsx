import { Dialog } from '@base-ui/react/dialog';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import {
  type MemberDirectoryItem,
  ACADEMIC_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  MEMBER_TYPE_LABELS,
} from '@/entities/member';
import { positionQueries } from '@/entities/position';
import { formatPhoneNumber } from '@/shared/lib/format-phone';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Eyebrow } from '@/shared/ui/section-card';

import { type MemberRowActions } from './MemberTable';
import { TrackChip } from './TrackChip';

/**
 * 이름을 누르면 오른쪽에서 열리는 부원 상세. 표에서 뺀 연락처·소속·관리 정보를 모두 여기서 본다.
 * 관리 동작을 누르면 패널을 닫고 해당 모달을 연다(부모의 모달 상태를 바꾸는 방식).
 *
 * Portal은 AdminLayout의 text-text 래퍼 밖이라 Popup에 text-text를 다시 건다(modal.tsx 참고).
 */
export function MemberDetailDrawer({
  member,
  isAdmin,
  actions,
  onClose,
}: {
  member: MemberDirectoryItem;
  isAdmin: boolean;
  actions: Pick<MemberRowActions, 'onEditProfile' | 'onSendPasswordLink' | 'onWithdraw'>;
  onClose: () => void;
}) {
  const { data: positions = [] } = useQuery(positionQueries.list());
  const positionLabels = new Map(positions.map((position) => [position.code, position.name]));
  const positionText = member.positionCodes.map((code) => positionLabels.get(code) ?? code).join(', ');

  return (
    <Dialog.Root open modal onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(10,8,16,.35)]" />
        <Dialog.Popup className="border-line2 bg-panel text-text fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-full flex-col border-l shadow-[-16px_0_40px_rgba(10,8,16,.18)] outline-none">
          <div className="border-line flex items-start gap-3.5 border-b px-6 py-5">
            <span aria-hidden="true" className="flex">
              <Avatar src={member.photoUrl} name={member.name} size="xl" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <Dialog.Title className="m-0 text-[17px] font-semibold tracking-[-.01em]">{member.name}</Dialog.Title>
                <TrackChip track={member.track} />
              </div>
              <Dialog.Description className="text-muted m-0 text-xs">
                {member.generation} · {MEMBER_TYPE_LABELS[member.memberType]} ·{' '}
                {ACADEMIC_STATUS_LABELS[member.academicStatus]} · {member.active ? '활동' : '비활동'}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="닫기"
              className="text-faint hover:text-text flex-none cursor-pointer px-2 py-1 transition-colors"
            >
              <X size={15} />
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-5">
            <DetailSection title="기본 정보">
              <DetailRow label="학번" value={member.studentNumber} />
              <DetailRow label="소속" value={member.university} />
              <DetailRow label="학부(학과)" value={member.department} />
              <DetailRow label="보직" value={positionText} />
              <DetailRow label="생일" value={member.birthDate} />
              {isAdmin && <DetailRow label="직장" value={member.company} />}
            </DetailSection>

            <DetailSection title="연락처">
              <DetailRow label="전화번호" value={member.phoneNumber && formatPhoneNumber(member.phoneNumber)} />
              <DetailRow label="이메일" value={member.email} />
              <DetailRow label="Github" value={member.githubId && `@${member.githubId}`} />
              <DetailRow label="Slack ID" value={member.slackId} />
            </DetailSection>

            <DetailSection title="관리">
              <DetailRow label="권한" value={MEMBER_ROLE_LABELS[member.role]} />
              <DetailRow label="회비 납부" value={member.duesRequired ? '납부 대상' : '납부 대상 아님'} />
              {isAdmin && member.hasAccount !== undefined && (
                <DetailRow label="계정" value={member.hasAccount ? '있음' : '없음 (비밀번호 미설정)'} />
              )}
            </DetailSection>
          </div>

          {isAdmin && (
            <div className="border-line bg-panel2 flex flex-wrap items-center gap-2 border-t px-6 py-3.5">
              <Button variant="primary" onClick={() => actions.onEditProfile(member)}>
                정보 수정
              </Button>
              <Button onClick={() => actions.onSendPasswordLink(member)}>비밀번호 설정 링크</Button>
              <Button variant="danger" onClick={() => actions.onWithdraw(member)} className="ml-auto">
                탈퇴 처리
              </Button>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>{title}</Eyebrow>
      <dl className="m-0 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-faint">{label}</dt>
      <dd className="m-0 break-all">{value || <span className="text-faint">—</span>}</dd>
    </>
  );
}
