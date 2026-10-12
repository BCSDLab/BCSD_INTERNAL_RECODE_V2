import { createFileRoute } from '@tanstack/react-router';

import { EmptySemesterDuesPage as Screen } from '@/pages/finance';
export const Route = createFileRoute('/_admin/ledger/dues/empty')({ component: Screen });
