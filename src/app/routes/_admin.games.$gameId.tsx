import { createFileRoute } from '@tanstack/react-router';

import { GameEditPage as Screen } from '@/pages/games';
export const Route = createFileRoute('/_admin/games/$gameId')({ component: Screen });
