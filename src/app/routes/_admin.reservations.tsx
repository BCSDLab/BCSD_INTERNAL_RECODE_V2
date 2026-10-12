import { createFileRoute } from '@tanstack/react-router';

import { ReservationsPage as Screen } from '@/pages/reservations';
export const Route = createFileRoute('/_admin/reservations')({ component: Screen });
