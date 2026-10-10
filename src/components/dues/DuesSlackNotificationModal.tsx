'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { sendDuesNotifications } from '@/api/dues/api';
import { SlackIdInputModal } from '@/components/dues/SlackIdInputModal';
import {
  createDuesNotificationMessage,
  createUnpaidNotificationMessage,
  DEFAULT_DUES_LIST_URL,
  DUES_NOTIFICATION_TEMPLATE,
  formatCurrency,
  formatDuesDateInput,
  getDistinctDuesAmounts,
  getDuesNotificationTargets,
  getUnpaidNotificationTargets,
  isValidDuesDate,
  UNPAID_NOTIFICATION_TEMPLATE,
} from '@/components/dues/slack-notifications';
import type { MemberDues, SemesterDuesSummary } from '@/components/dues/types';
import { Button } from '@/components/ui/button';
import { INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { useSession } from '@/lib/auth/use-session';

type NoticeType = 'payment' | 'overdue';

interface SlackMessagePayload {
  memberId: number;
  message: string;
}

/** 수신자 Slack 계정은 서버가 회원 이메일로 찾는다(users.lookupByEmail). 화면은 찾지 못한 회원만 안다. */
const MANAGER_MENTION_TOKEN = '{담당자 멘션}';

function templateFor(type: NoticeType) {
  return type === 'payment' ? DUES_NOTIFICATION_TEMPLATE : UNPAID_NOTIFICATION_TEMPLATE;
}

/** "https://"를 직접 치지 않아도 되게 — scheme이 없으면 https://를 붙인다. 빈 값은 그대로. */
function withHttps(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(withHttps(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted text-[11px] font-semibold">
        {label}
        <span className="text-danger ml-0.5">*</span>
      </span>
      {children}
    </label>
  );
}

function SlackStatus({ missing }: { missing: boolean }) {
  return !missing ? null : (
    <span className="border-danger-line bg-danger-soft text-danger rounded-full border px-2 py-0.5 text-[10px] font-semibold">
      Slack ID 없음
    </span>
  );
}

export function DuesSlackNotificationModal({
  semester,
  members,
  onClose,
  onResult,
}: {
  semester: SemesterDuesSummary;
  members: MemberDues[];
  onClose: () => void;
  onResult: (message: string, tone: 'success' | 'neutral') => void;
}) {
  const { session } = useSession();
  // 인명부 Slack ID가 비어 있으면 보낼 수 없다. members는 학기 회비 쿼리 값이라, "Slack ID 입력"
  // 모달에서 저장해 쿼리가 다시 받아지면 여기 상태도 함께 바뀐다.
  const isSlackMissing = (member: MemberDues) => !member.slackId;
  const [isSlackIdModalOpen, setIsSlackIdModalOpen] = useState(false);
  const slackMissingFirst = (first: MemberDues, second: MemberDues) =>
    Number(isSlackMissing(second)) - Number(isSlackMissing(first));
  const paymentTargets = useMemo(() => getDuesNotificationTargets(members), [members]);
  const unpaidTargets = useMemo(() => getUnpaidNotificationTargets(members), [members]);
  const duesAmounts = useMemo(() => getDistinctDuesAmounts(members), [members]);

  const [type, setType] = useState<NoticeType>('payment');
  const [draft, setDraft] = useState(DUES_NOTIFICATION_TEMPLATE);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<NoticeType | null>(null);
  const [rulesUrl, setRulesUrl] = useState('');
  const [exemptionFormUrl, setExemptionFormUrl] = useState('');
  const [duesListUrl, setDuesListUrl] = useState(DEFAULT_DUES_LIST_URL);
  const [deadline, setDeadline] = useState('');
  const [previewAmount, setPreviewAmount] = useState(() => duesAmounts[0] ?? 0);
  const [selectedUnpaidIds, setSelectedUnpaidIds] = useState<string[]>(() => unpaidTargets.map((member) => member.id));
  const [previewMemberId, setPreviewMemberId] = useState(() => unpaidTargets[0]?.id ?? '');
  const [validationVisible, setValidationVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  const admin = session?.member;
  const adminPhoneNumber = admin?.phoneNumber?.trim() ?? '';
  const selectedAmount = duesAmounts.includes(previewAmount) ? previewAmount : (duesAmounts[0] ?? 0);
  const selectedUnpaidMembers = unpaidTargets.filter((member) => selectedUnpaidIds.includes(member.id));
  const previewMember =
    selectedUnpaidMembers.find((member) => member.id === previewMemberId) ?? selectedUnpaidMembers[0] ?? null;
  const allUnpaidSelected = unpaidTargets.length > 0 && selectedUnpaidMembers.length === unpaidTargets.length;
  const someUnpaidSelected = selectedUnpaidMembers.length > 0 && !allUnpaidSelected;
  const missingPaymentSlack = paymentTargets.filter(isSlackMissing);
  const missingUnpaidSlack = selectedUnpaidMembers.filter(isSlackMissing);
  const orderedPaymentTargets = [...paymentTargets].sort(slackMissingFirst);
  const orderedUnpaidTargets = [...unpaidTargets].sort(slackMissingFirst);
  const missingSlackMembers = type === 'payment' ? missingPaymentSlack : missingUnpaidSlack;
  const hasMissingSlack = missingSlackMembers.length > 0;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someUnpaidSelected;
  }, [someUnpaidSelected]);

  const finalMessage =
    type === 'payment'
      ? createDuesNotificationMessage({
          template: draft,
          semester,
          amount: selectedAmount,
          senderName: admin?.name ?? '',
          rulesUrl: withHttps(rulesUrl),
          exemptionFormUrl: withHttps(exemptionFormUrl),
          duesListUrl: withHttps(duesListUrl),
          deadline,
        })
      : previewMember
        ? createUnpaidNotificationMessage({
            template: draft,
            semester,
            member: previewMember,
            duesListUrl: withHttps(duesListUrl),
            managerPhoneNumber: adminPhoneNumber,
          })
        : draft;

  const errors: string[] = [];
  if (!draft.trim()) errors.push('최종 메시지를 입력해 주세요.');
  if (!isHttpUrl(duesListUrl)) errors.push('올바른 회비납부목록 URL을 입력해 주세요.');
  if (type === 'payment') {
    if (!admin?.name) errors.push('로그인한 관리자 정보를 확인할 수 없습니다.');
    if (paymentTargets.length === 0) errors.push('부과 금액이 있는 회비 대상자가 없습니다.');
    if (missingPaymentSlack.length > 0) {
      errors.push(`Slack ID가 없는 회원이 있습니다: ${missingPaymentSlack.map((member) => member.name).join(', ')}`);
    }
    if (!isValidDuesDate(deadline)) errors.push('유효한 납부 마감일을 yyyy-mm-dd 형식으로 입력해 주세요.');
    if (!isHttpUrl(rulesUrl)) errors.push('올바른 회칙 URL을 입력해 주세요.');
    if (!isHttpUrl(exemptionFormUrl)) errors.push('올바른 면제 신청서 URL을 입력해 주세요.');
  } else {
    if (selectedUnpaidMembers.length === 0) errors.push('알림을 전송할 미납 회원을 선택해 주세요.');
    if (missingUnpaidSlack.length > 0) {
      errors.push(`Slack ID가 없는 회원이 있습니다: ${missingUnpaidSlack.map((member) => member.name).join(', ')}`);
    }
    if (!adminPhoneNumber) errors.push('로그인한 관리자의 전화번호를 확인할 수 없습니다.');
    for (const token of ['{이름}', '{회비이름}', '{미납액}']) {
      if (!draft.includes(token)) errors.push(`수신자별 메시지를 만들려면 ${token} 항목이 필요합니다.`);
    }
  }

  function requestType(nextType: NoticeType) {
    if (nextType === type) return;
    if (draft !== templateFor(type)) {
      setPendingType(nextType);
      return;
    }
    setType(nextType);
    setDraft(templateFor(nextType));
    setValidationVisible(false);
  }

  function confirmTypeChange() {
    if (!pendingType) return;
    setType(pendingType);
    setDraft(templateFor(pendingType));
    setPendingType(null);
    setValidationVisible(false);
  }

  function toggleAllUnpaid() {
    setSelectedUnpaidIds(allUnpaidSelected ? [] : unpaidTargets.map((member) => member.id));
    setValidationVisible(false);
  }

  function toggleUnpaidMember(memberId: string) {
    setSelectedUnpaidIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
    setValidationVisible(false);
  }

  async function send() {
    setValidationVisible(true);
    if (errors.length > 0 || sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    try {
      const messages: SlackMessagePayload[] =
        type === 'payment'
          ? paymentTargets.map((member) => ({
              memberId: Number(member.id),
              message: createDuesNotificationMessage({
                template: draft,
                semester,
                amount: member.assessedAmount!,
                senderName: admin!.name,
                rulesUrl: withHttps(rulesUrl),
                exemptionFormUrl: withHttps(exemptionFormUrl),
                duesListUrl: withHttps(duesListUrl),
                deadline,
              }),
            }))
          : selectedUnpaidMembers.map((member) => ({
              memberId: Number(member.id),
              message: createUnpaidNotificationMessage({
                template: draft,
                semester,
                member,
                duesListUrl: withHttps(duesListUrl),
                managerPhoneNumber: adminPhoneNumber,
              }),
            }));
      const result = await sendDuesNotifications(semester.id, {
        type: type === 'payment' ? 'PAYMENT' : 'UNPAID',
        messages,
      });
      onClose();
      onResult(
        result.failed.length > 0
          ? `${result.sentCount}명에게 전송했고 ${result.failed.length}명은 실패했습니다.`
          : `${result.sentCount}명에게 Slack 알림을 전송했습니다.`,
        result.failed.length > 0 ? 'neutral' : 'success',
      );
    } catch {
      sendingRef.current = false;
      setIsSending(false);
      onResult('Slack 알림 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'neutral');
    }
  }

  return (
    <>
      <Modal
        eyebrow={semester.title}
        title="Slack 알림 작성"
        onClose={isSending ? () => undefined : onClose}
        width="900px"
        footer={
          <>
            {hasMissingSlack && (
              <span className="text-danger ml-auto text-right text-[11px] font-semibold">
                Slack ID가 없는 회원이 있습니다.
              </span>
            )}
            <Button className={hasMissingSlack ? '' : 'ml-auto'} disabled={isSending} onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" disabled={isSending || hasMissingSlack} onClick={send}>
              {isSending ? '전송 중…' : '전송'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5 px-6 py-5">
          <fieldset>
            <legend className="text-muted mb-2 text-[11px] font-bold">알림 종류</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ['payment', '회비 납부 안내'],
                  ['overdue', '미납자 납부 안내'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-xs font-semibold ${
                    type === value
                      ? 'border-primary-line bg-primary-soft text-primary-text'
                      : 'border-line bg-panel text-text'
                  }`}
                >
                  <input type="radio" checked={type === value} onChange={() => requestType(value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {type === 'payment' ? (
            <div className="flex flex-col gap-3">
              <section className="border-line bg-panel2 grid grid-cols-2 gap-3 rounded-[12px] border p-4">
                <InputField label="발신자">
                  <div className="border-line bg-sunken text-text rounded-[10px] border px-3 py-2.5 text-sm">
                    {admin?.name ?? '관리자 정보 확인 필요'}
                  </div>
                </InputField>
                <InputField label="납부 마감일">
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      className={INPUT_CLASS_COMPACT}
                      value={deadline}
                      onChange={(event) => {
                        setDeadline(formatDuesDateInput(event.target.value));
                        setValidationVisible(false);
                      }}
                      placeholder="yyyy-mm-dd"
                    />
                    {deadline.length === 10 && !isValidDuesDate(deadline) && (
                      <p className="text-danger mt-1 text-[10.5px]">유효한 날짜를 입력해 주세요.</p>
                    )}
                  </div>
                </InputField>
                <InputField label="회칙 URL">
                  <input
                    type="url"
                    className={INPUT_CLASS_COMPACT}
                    value={rulesUrl}
                    onChange={(event) => setRulesUrl(event.target.value)}
                    onBlur={() => setRulesUrl(withHttps(rulesUrl))}
                    placeholder="bcsdlab.com/…"
                  />
                </InputField>
                <InputField label="면제 신청서 URL">
                  <input
                    type="url"
                    className={INPUT_CLASS_COMPACT}
                    value={exemptionFormUrl}
                    onChange={(event) => setExemptionFormUrl(event.target.value)}
                    onBlur={() => setExemptionFormUrl(withHttps(exemptionFormUrl))}
                    placeholder="bcsdlab.com/…"
                  />
                </InputField>
                <InputField label="회비납부목록 URL">
                  <input
                    type="url"
                    className={INPUT_CLASS_COMPACT}
                    value={duesListUrl}
                    onChange={(event) => setDuesListUrl(event.target.value)}
                    onBlur={() => setDuesListUrl(withHttps(duesListUrl))}
                  />
                </InputField>
              </section>

              <section className="border-line overflow-hidden rounded-[12px] border">
                <div className="border-line bg-panel2 flex items-center border-b px-4 py-2.5">
                  <strong className="text-[12px]">전송 대상</strong>
                  <span className="text-faint ml-auto text-[11px]">
                    부과 금액이 0원보다 큰 회원 {paymentTargets.length}명
                  </span>
                </div>
                {paymentTargets.length === 0 ? (
                  <p className="text-muted px-4 py-6 text-left text-xs">현재 학기에 전송할 대상이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 p-3 text-left">
                    {orderedPaymentTargets.map((member) => (
                      <div
                        key={member.id}
                        className={`border-line bg-panel flex min-w-0 items-center gap-2 rounded-[9px] border px-3 py-2.5 ${isSlackMissing(member) ? 'col-span-full' : ''}`}
                      >
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                          {member.name} · {member.studentNumber}
                        </span>
                        <span className="text-muted flex-none text-[11px]">
                          {formatCurrency(member.assessedAmount ?? 0)}
                        </span>
                        <SlackStatus missing={isSlackMissing(member)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <section className="border-line bg-panel2 grid grid-cols-2 gap-3 rounded-[12px] border p-4">
                <InputField label="회비납부목록 URL">
                  <input
                    type="url"
                    className={INPUT_CLASS_COMPACT}
                    value={duesListUrl}
                    onChange={(event) => setDuesListUrl(event.target.value)}
                    onBlur={() => setDuesListUrl(withHttps(duesListUrl))}
                  />
                </InputField>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-muted text-[11px] font-semibold">담당 관리자</span>
                  <div className="border-line bg-sunken rounded-[10px] border px-3 py-2 text-[11.5px] leading-5">
                    <strong>{admin?.name ?? '관리자 정보 확인 필요'}</strong>
                    <span className="text-muted ml-2">{MANAGER_MENTION_TOKEN}</span>
                    <span className="text-muted ml-2">{adminPhoneNumber || '전화번호 없음'}</span>
                  </div>
                </div>
              </section>

              <section className="border-line overflow-hidden rounded-[12px] border">
                <label className="border-line bg-panel2 flex cursor-pointer items-center gap-2.5 border-b px-4 py-2.5">
                  <input ref={selectAllRef} type="checkbox" checked={allUnpaidSelected} onChange={toggleAllUnpaid} />
                  <strong className="text-[12px]">미납 회원 전체 선택</strong>
                  <span className="text-faint ml-auto text-[11px]">
                    {selectedUnpaidMembers.length}/{unpaidTargets.length}명 선택
                  </span>
                </label>
                {unpaidTargets.length === 0 ? (
                  <p className="text-muted px-4 py-6 text-center text-xs">현재 학기에 미납 대상이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 p-3 text-left">
                    {orderedUnpaidTargets.map((member) => (
                      <label
                        key={member.id}
                        className={`border-line bg-panel hover:bg-panel2 flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[9px] border px-3 py-2.5 ${isSlackMissing(member) ? 'col-span-full' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnpaidIds.includes(member.id)}
                          onChange={() => toggleUnpaidMember(member.id)}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                          {member.name} · {member.studentNumber}
                        </span>
                        <span className="text-danger text-[11px] font-semibold">
                          미납 {formatCurrency(member.unpaidAmount ?? 0)}
                        </span>
                        <SlackStatus missing={isSlackMissing(member)} />
                      </label>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          <section className="border-line overflow-hidden rounded-[12px] border">
            <div className="border-line bg-panel2 grid grid-cols-2 border-b">
              <div className="border-line border-r px-4 py-3">
                <div className="text-faint text-[10.5px]">전송 대상</div>
                <div className="mt-1 text-xs font-semibold">
                  {type === 'payment'
                    ? `${paymentTargets.length}명 자동 선택`
                    : `${selectedUnpaidMembers.length}/${unpaidTargets.length}명 선택`}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-faint text-[10.5px]">Slack 계정 확인</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-xs font-semibold ${hasMissingSlack ? 'text-danger' : ''}`}>
                    {hasMissingSlack ? `${missingSlackMembers.length}명 누락` : '모두 확인됨'}
                  </span>
                  {hasMissingSlack && (
                    <Button
                      className="ml-auto px-2.5 py-1 text-[11px]"
                      disabled={isSending}
                      onClick={() => setIsSlackIdModalOpen(true)}
                    >
                      Slack ID 입력
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="border-line overflow-hidden rounded-[12px] border">
            <div className="border-line bg-panel2 flex items-center border-b px-4 py-2.5">
              <strong className="text-[12px]">최종 메시지</strong>
              <div className="ml-auto flex items-center gap-2">
                {type === 'payment' && duesAmounts.length > 0 && (
                  <select
                    aria-label="회비 금액별 미리보기"
                    className="border-line bg-panel text-text h-8 rounded-[8px] border px-2.5 text-[11px] outline-none"
                    value={selectedAmount}
                    onChange={(event) => setPreviewAmount(Number(event.target.value))}
                  >
                    {duesAmounts.map((amount) => (
                      <option key={amount} value={amount}>
                        {formatCurrency(amount)} case
                      </option>
                    ))}
                  </select>
                )}
                {type === 'overdue' && selectedUnpaidMembers.length > 0 && (
                  <select
                    aria-label="미납 회원별 미리보기"
                    className="border-line bg-panel text-text h-8 rounded-[8px] border px-2.5 text-[11px] outline-none"
                    value={previewMember?.id ?? ''}
                    onChange={(event) => setPreviewMemberId(event.target.value)}
                  >
                    {selectedUnpaidMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} 미리보기
                      </option>
                    ))}
                  </select>
                )}
                <Button onClick={() => setEditingDraft(draft)}>수정</Button>
              </div>
            </div>
            <pre className="text-text m-0 px-4 py-3.5 font-sans text-[12px] leading-[1.75] whitespace-pre-wrap">
              {finalMessage}
            </pre>
          </section>

          {validationVisible && errors.length > 0 && (
            <div
              role="alert"
              className="border-danger-line bg-danger-soft text-danger rounded-[10px] border px-3.5 py-3"
            >
              <strong className="text-xs">전송 전에 다음 항목을 확인해 주세요.</strong>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px]">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {editingDraft !== null && (
        <Modal
          title="Slack 메시지 수정"
          onClose={() => setEditingDraft(null)}
          width="720px"
          footer={
            <>
              <Button className="ml-auto" onClick={() => setEditingDraft(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDraft(editingDraft);
                  setEditingDraft(null);
                  setValidationVisible(false);
                }}
              >
                저장
              </Button>
            </>
          }
        >
          <div className="px-6 py-5">
            <p className="text-faint mb-2 text-[11px]">
              중괄호로 표시된 데이터 항목은 최종 미리보기와 전송 시 현재 값으로 바뀝니다.
            </p>
            <textarea
              value={editingDraft}
              onChange={(event) => setEditingDraft(event.target.value)}
              className="border-line bg-panel2 text-text focus:border-primary-line min-h-[420px] w-full resize-y rounded-[10px] border p-3.5 font-sans text-[12.5px] leading-[1.75] outline-none"
            />
          </div>
        </Modal>
      )}

      {isSlackIdModalOpen && (
        <SlackIdInputModal members={missingSlackMembers} onClose={() => setIsSlackIdModalOpen(false)} />
      )}
      {pendingType && (
        <Modal
          title="알림 종류를 변경할까요?"
          onClose={() => setPendingType(null)}
          width="440px"
          footer={
            <>
              <Button className="ml-auto" onClick={() => setPendingType(null)}>
                취소
              </Button>
              <Button variant="primary" onClick={confirmTypeChange}>
                변경
              </Button>
            </>
          }
        >
          <p className="text-muted px-6 py-5 text-[13px] leading-[1.7]">
            알림 종류를 변경하면 현재 수정한 메시지가 기본 템플릿으로 초기화됩니다.
          </p>
        </Modal>
      )}
    </>
  );
}
