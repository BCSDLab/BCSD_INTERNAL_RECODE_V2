import { queryOptions } from '@tanstack/react-query';
import { getMe } from './api';

export const authKeys = {
  me: () => ['auth', 'me'] as const,
};

export const authQueries = {
  me: (accessToken: string) => queryOptions({ queryKey: authKeys.me(), queryFn: () => getMe(accessToken) }),
};
