import { createFileRoute } from '@tanstack/react-router';

import { TrackPageEditPage as Screen } from '@/pages/tracks';
export const Route = createFileRoute('/_admin/tracks/$trackPageId')({ component: Screen });
