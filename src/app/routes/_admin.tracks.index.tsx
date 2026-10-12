import { createFileRoute } from '@tanstack/react-router';

import { TracksPage as Screen } from '@/pages/tracks';
export const Route = createFileRoute('/_admin/tracks/')({ component: Screen });
