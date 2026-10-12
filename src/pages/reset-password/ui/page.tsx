import { Suspense } from 'react';

import { AuthCard } from '@/shared/ui/auth/AuthCard';

import { ResetPasswordView } from './reset-password-view';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCard width={420} className="px-11 py-[52px]" />}>
      <ResetPasswordView />
    </Suspense>
  );
}
