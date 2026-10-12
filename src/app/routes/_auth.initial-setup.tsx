import { createFileRoute } from '@tanstack/react-router';

import { InitialSetupPage as Screen } from '@/pages/initial-setup';
export const Route = createFileRoute('/_auth/initial-setup')({ component: Screen });
