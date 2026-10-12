import { createFileRoute } from '@tanstack/react-router';

import { LoginPage as Screen } from '@/pages/login';
export const Route = createFileRoute('/_auth/login')({ component: Screen });
