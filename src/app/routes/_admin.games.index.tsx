import { createFileRoute } from '@tanstack/react-router';

import { GamesPage as Screen } from '@/pages/games';
export const Route = createFileRoute('/_admin/games/')({ component: Screen });
