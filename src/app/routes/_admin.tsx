import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { bootstrapSession } from '@/app/model/bootstrap-session';
import { getSession } from '@/entities/session';
import { AdminLayout as Layout } from '@/widgets/admin-shell';
export const Route = createFileRoute('/_admin')({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  beforeLoad: async ({ location }) => {
    await bootstrapSession(location.pathname);
    if (!getSession()) throw redirect({ to: '/login' });
  },
});
