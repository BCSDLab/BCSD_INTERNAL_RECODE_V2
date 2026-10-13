import { useMutation } from '@tanstack/react-query';

import { sendMemberPasswordLinkBySlack, type MemberDirectoryItem } from '@/entities/member';
import { getApiErrorMessage } from '@/shared/api/error';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';

/**
 * 비밀번호 설정 링크를 Slack DM으로 보낸다 — 가입 메일을 받지 못한 부원이나 비밀번호를 잊은 부원용.
 *
 * 새로 보내면 이전에 보낸 링크(메일로 보낸 재설정 링크 포함)는 무효가 된다. 인명부 응답에 계정 상태가 없어서
 * 가입 전인지는 화면에서 알 수 없다. 가입 전 부원은 링크로 비밀번호를 정한 뒤 로그인해서 초기 설정을 마친다.
 */
export function PasswordLinkModal({ member, onClose }: { member: MemberDirectoryItem; onClose: () => void }) {
  const sendMutation = useMutation({ mutationFn: () => sendMemberPasswordLinkBySlack(member.id) });

  const hasSlackId = Boolean(member.slackId);
  const error = sendMutation.isError ? getApiErrorMessage(sendMutation.error, 'DM 발송에 실패했습니다.') : null;

  return (
    <Modal
      eyebrow="인명부"
      title="비밀번호 설정 링크"
      onClose={onClose}
      width="440px"
      footer={
        sendMutation.isSuccess ? (
          <Button variant="primary" onClick={onClose} className="ml-auto px-4 py-2.5">
            닫기
          </Button>
        ) : (
          <>
            <Button onClick={onClose} className="ml-auto px-4 py-2.5">
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => sendMutation.mutate()}
              disabled={!hasSlackId || sendMutation.isPending}
              className="px-4 py-2.5"
            >
              {sendMutation.isPending ? '보내는 중…' : 'Slack DM 보내기'}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-3.5 px-6 py-5">
        <div className="border-line bg-panel2 flex flex-col gap-1.5 rounded-[12px] border px-3.5 py-3">
          <span className="text-[13px] font-medium">
            {member.name} · {member.studentNumber} · {member.generation}
          </span>
          <span className="text-muted text-[11px] leading-[1.65]">
            삐봇이 이 부원에게 비밀번호 설정 링크를 DM으로 보냅니다. 링크는 24시간 동안 한 번만 쓸 수 있고, 이전에 보낸
            링크는 무효가 됩니다.
          </span>
        </div>

        {!hasSlackId && (
          <p className="text-danger m-0 text-[11px]">Slack ID가 없어 보낼 수 없습니다. 먼저 Slack ID를 등록하세요.</p>
        )}
        {sendMutation.isSuccess && (
          <p role="status" className="text-primary-text m-0 text-[12px]">
            DM을 보냈습니다.
          </p>
        )}
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}
