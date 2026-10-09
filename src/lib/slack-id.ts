/** BE(MemberSlackIdRequest)와 같은 형식 — U/W로 시작하는 영문 대문자·숫자 9~20자. */
const SLACK_ID_PATTERN = /^[UW][A-Z0-9]{8,19}$/;

export const SLACK_ID_ERROR_MESSAGE = 'U 또는 W로 시작하는 영문 대문자·숫자 Slack ID를 입력해 주세요.';

/** 입력칸 onChange용 — 영문을 즉시 대문자로 바꾼다. */
export function toSlackIdInput(value: string): string {
  return value.toUpperCase();
}

/** 저장용 — 앞뒤 공백과 멘션 표기(`<@`·`@`·`>`)를 떼고 대문자로 만든다. 빈 값이면 null. */
export function normalizeSlackId(value: string): string | null {
  const normalized = value.trim().replace(/^<?@/, '').replace(/>$/, '').trim().toUpperCase();
  return normalized || null;
}

/** 빈 값은 허용(삭제)한다. 값이 있으면 BE와 같은 형식이어야 한다. */
export function slackIdError(value: string): string | undefined {
  const normalized = normalizeSlackId(value);
  if (normalized === null) {
    return undefined;
  }
  return SLACK_ID_PATTERN.test(normalized) ? undefined : SLACK_ID_ERROR_MESSAGE;
}
