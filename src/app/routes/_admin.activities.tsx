import { createFileRoute } from '@tanstack/react-router';

import { ActivitiesPage as Screen, validateActivitySearch } from '@/pages/activities';
export const Route = createFileRoute('/_admin/activities')({
  validateSearch: validateActivitySearch,
  component: Screen,
});
