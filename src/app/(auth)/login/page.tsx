'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SubmitEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { LogoBadge } from '@/components/auth/LogoBadge';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { TextField } from '@/components/auth/TextField';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setPendingSetup } from '@/lib/auth/pending-session';
import { setSession } from '@/lib/auth/session-store';

export default function LoginPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await login({ studentNumber, password, rememberMe });
      if (response.status === 'PENDING_SETUP') {
        setPendingSetup({ accessToken: response.accessToken, member: response.member });
        router.push('/initial-setup');
        return;
      }
      setSession({ accessToken: response.accessToken, member: response.member });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard width={940} className="flex min-h-[600px] overflow-hidden">
      <div className="relative hidden w-2/5 flex-col justify-center overflow-hidden border-r border-white/6 bg-[#0d0f22] px-12 text-white sm:flex">
        <div className="absolute -top-[90px] -right-[90px] h-[280px] w-[280px] rounded-full border border-white/8" />
        <div className="absolute -bottom-[60px] -left-[60px] h-[180px] w-[180px] rounded-full border border-white/6" />
        <div className="relative">
          <LogoBadge size={112} />
          <div className="mb-3 text-[30px] font-bold tracking-tight">BCSD Internal</div>
          <div className="text-[14.5px] leading-[1.7] text-white/55">
            각자의 궤도를 그리며
            <br />
            함께 성장하는 공간
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-16 py-10">
        <div className="mb-1.5 text-[23px] font-bold text-white">로그인</div>
        <div className="mb-8 text-[13.5px] text-white/50">학번과 비밀번호로 로그인하세요</div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <TextField
            label="학번"
            type="text"
            inputMode="numeric"
            placeholder="학번 입력 (예: 2000123456)"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            required
          />
          <div>
            <TextField
              label="비밀번호"
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-[7px] text-[13px] text-white/55">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              로그인 상태 유지
            </label>
            <Link href="/reset-password" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
              비밀번호 찾기
            </Link>
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <PrimaryButton type="submit" disabled={submitting} className="mt-1">
            {submitting ? '로그인 중...' : '로그인'}
          </PrimaryButton>
        </form>

        <div className="mt-5 text-[12px] leading-[1.6] text-white/40">
          가입은 관리자가 직접 계정을 발급해요. 신규 계정 문의:{' '}
          <a href="#" className="font-semibold text-[var(--accent)] underline">
            관리자 연락처
          </a>
        </div>
      </div>
    </AuthCard>
  );
}
