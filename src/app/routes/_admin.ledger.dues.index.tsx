import { createFileRoute } from '@tanstack/react-router';

import { SemesterDuesPage as Screen } from '@/pages/finance';
export const Route = createFileRoute('/_admin/ledger/dues/')({ component: Screen });
