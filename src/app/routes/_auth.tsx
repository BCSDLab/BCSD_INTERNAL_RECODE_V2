import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthLayout as Layout } from '@/widgets/auth-shell';
export const Route = createFileRoute('/_auth')({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
