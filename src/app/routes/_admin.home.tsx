import { createFileRoute } from '@tanstack/react-router';

import { HomePage as Screen } from '@/pages/home';
export const Route = createFileRoute('/_admin/home')({ component: Screen });
