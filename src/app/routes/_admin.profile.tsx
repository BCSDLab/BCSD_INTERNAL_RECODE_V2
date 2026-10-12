import { createFileRoute } from '@tanstack/react-router';

import { ProfilePage as Screen } from '@/pages/profile';
export const Route = createFileRoute('/_admin/profile')({ component: Screen });
