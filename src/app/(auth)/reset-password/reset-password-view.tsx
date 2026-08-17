'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type SubmitEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { LogoBadge } from '@/components/auth/LogoBadge';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { TextField } from '@/components/auth/TextField';
import { confirmPasswordReset, requestPasswordReset, validateResetToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthCard width={420} className="px-11 py-[52px]">
      {token ? <ResetConfirm token={token} /> : <ResetRequest />}
    </AuthCard>
  );
}

function ResetRequest() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <LogoBadge size={84} />
        <div className="mb-2.5 text-[19px] font-bold text-white">링크를 보냈어요</div>
        <div className="mb-7 text-[13.5px] leading-[1.6] text-white/50">
          {email} 주소로
          <br />
          재설정 링크를 발송했어요.
        </div>
        <Link href="/login" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <LogoBadge size={84} />
      <div className="mb-2 text-[19px] font-bold text-white">비밀번호 재설정</div>
      <div className="mb-7 text-center text-[13px] leading-[1.6] text-white/50">
        가입된 이메일 주소로
        <br />
        재설정 링크를 보내드려요
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-[22px]">
          <TextField
            label="이메일"
            type="email"
            placeholder="mail@bcsdlab.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <p className="mb-4 text-[13px] text-red-400">{error}</p>}

        <PrimaryButton type="submit" disabled={submitting} className="mb-[18px]">
          {submitting ? '전송 중...' : '재설정 링크 보내기'}
        </PrimaryButton>
      </form>

      <Link href="/login" className="text-[13px] font-semibold text-white/50 hover:underline">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}

type TokenState =
  { status: 'checking' } | { status: 'invalid'; message: string } | { status: 'valid'; studentNumberMasked: string };

function ResetConfirm({ token }: { token: string }) {
  const [tokenState, setTokenState] = useState<TokenState>({ status: 'checking' });
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    validateResetToken(token)
      .then((res) => setTokenState({ status: 'valid', studentNumberMasked: res.studentNumberMasked }))
      .catch((err) =>
        setTokenState({
          status: 'invalid',
          message: err instanceof ApiError ? err.message : '유효하지 않은 링크입니다.',
        }),
      );
  }, [token]);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, newPassword, newPasswordConfirm);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '재설정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <LogoBadge size={84} />
        <div className="mb-2.5 text-[19px] font-bold text-white">비밀번호가 변경됐어요</div>
        <div className="mb-7 text-[13.5px] leading-[1.6] text-white/50">새 비밀번호로 다시 로그인해주세요.</div>
        <Link href="/login" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  if (tokenState.status === 'checking') {
    return <p className="text-center text-[13.5px] text-white/50">링크를 확인하는 중...</p>;
  }

  if (tokenState.status === 'invalid') {
    return (
      <div className="flex flex-col items-center text-center">
        <LogoBadge size={84} />
        <div className="mb-2.5 text-[19px] font-bold text-white">링크를 사용할 수 없어요</div>
        <div className="mb-7 text-[13.5px] leading-[1.6] text-white/50">{tokenState.message}</div>
        <Link href="/reset-password" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
          재설정 링크 다시 받기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <LogoBadge size={84} />
      <div className="mb-2 text-[19px] font-bold text-white">새 비밀번호 설정</div>
      <div className="mb-7 text-center text-[13px] leading-[1.6] text-white/50">
        {tokenState.studentNumberMasked} 계정의
        <br />새 비밀번호를 입력해주세요
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[18px]">
        <TextField
          label="새 비밀번호"
          type="password"
          placeholder="8자 이상, 영문+숫자"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <TextField
          label="새 비밀번호 확인"
          type="password"
          placeholder="새 비밀번호를 다시 입력해주세요"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          required
        />

        {error && <p className="text-[13px] text-red-400">{error}</p>}

        <PrimaryButton type="submit" disabled={submitting} className="mt-1">
          {submitting ? '변경 중...' : '비밀번호 변경하기'}
        </PrimaryButton>
      </form>
    </div>
  );
}
