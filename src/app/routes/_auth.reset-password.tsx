import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordPage as Screen } from '@/pages/reset-password';
export const Route = createFileRoute('/_auth/reset-password')({
  component: Screen,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
});
