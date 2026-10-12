import { createFileRoute } from '@tanstack/react-router';

import { SemesterDuesDetailPage as Screen } from '@/pages/finance';
export const Route = createFileRoute('/_admin/ledger/dues/$semesterId')({ component: Screen });
