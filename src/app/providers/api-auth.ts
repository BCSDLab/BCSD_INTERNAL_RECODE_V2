import { getSession, setSession } from '@/entities/session';
import { configureApiAuth } from '@/shared/api/client';

configureApiAuth({
  getAccessToken: () => getSession()?.accessToken,
  onTokenRefreshed: (accessToken) => {
    const session = getSession();
    if (session) setSession({ ...session, accessToken });
  },
  onUnauthorized: () => setSession(null),
});
