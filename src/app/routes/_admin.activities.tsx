import { createFileRoute } from '@tanstack/react-router';

import { ActivitiesPage as Screen } from '@/pages/activities';
export const Route = createFileRoute('/_admin/activities')({ component: Screen });
