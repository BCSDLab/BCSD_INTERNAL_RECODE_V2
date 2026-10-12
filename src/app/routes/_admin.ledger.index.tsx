import { createFileRoute } from '@tanstack/react-router';

import { LedgerPage as Screen } from '@/pages/finance';
import { validateLedgerSearch } from '@/widgets/finance';
export const Route = createFileRoute('/_admin/ledger/')({ validateSearch: validateLedgerSearch, component: Screen });
