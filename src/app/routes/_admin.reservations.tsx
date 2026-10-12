import { createFileRoute } from '@tanstack/react-router';

import { ReservationsPage as Screen, validateReservationSearch } from '@/pages/reservations';
export const Route = createFileRoute('/_admin/reservations')({
  validateSearch: validateReservationSearch,
  component: Screen,
});
