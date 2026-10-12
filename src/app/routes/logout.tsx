import { createFileRoute } from '@tanstack/react-router';

import { LogoutPage as Screen } from '@/pages/logout';
export const Route = createFileRoute('/logout')({ component: Screen });
