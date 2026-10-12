import { createFileRoute } from '@tanstack/react-router';

import { LedgerPage as Screen } from '@/pages/finance';
export const Route = createFileRoute('/_admin/ledger/')({ component: Screen });
