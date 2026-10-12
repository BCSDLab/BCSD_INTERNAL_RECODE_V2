import { createFileRoute } from '@tanstack/react-router';

import { MembersPage as Screen } from '@/pages/members';
export const Route = createFileRoute('/_admin/members')({ component: Screen });
