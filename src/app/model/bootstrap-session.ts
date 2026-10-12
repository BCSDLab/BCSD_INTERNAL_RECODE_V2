import {
  getMe,
  reissue,
  getSessionStatus,
  setSession,
  isLedgerPreviewPath,
  LEDGER_PREVIEW_SESSION,
} from '@/entities/session';

let bootstrapPromise: Promise<void> | undefined;
let previewSessionActive = false;

/** All protected routes await the same initial session restoration. */
export function bootstrapSession(pathname: string): Promise<void> {
  if (isLedgerPreviewPath(pathname)) {
    previewSessionActive = true;
    setSession(LEDGER_PREVIEW_SESSION);
    return Promise.resolve();
  }
  if (previewSessionActive) {
    previewSessionActive = false;
    bootstrapPromise = undefined;
  } else if (getSessionStatus() === 'ready') {
    return Promise.resolve();
  }
  if (!bootstrapPromise) {
    bootstrapPromise = reissue()
      .then(async (token) => {
        const member = await getMe(token.accessToken);
        setSession({ accessToken: token.accessToken, member });
      })
      .catch(() => {
        setSession(null);
      });
  }
  return bootstrapPromise;
}
