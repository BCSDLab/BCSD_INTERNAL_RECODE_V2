import { createFileRoute } from '@tanstack/react-router';

import { GameEditPage as Screen, validateGameSearch } from '@/pages/games';
export const Route = createFileRoute('/_admin/games/$gameId')({
  validateSearch: validateGameSearch,
  component: Screen,
});
