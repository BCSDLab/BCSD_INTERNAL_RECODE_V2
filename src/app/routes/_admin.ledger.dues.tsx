import { createFileRoute, Outlet } from '@tanstack/react-router';

import Layout from '@/app/layouts/dues-layout';
export const Route = createFileRoute('/_admin/ledger/dues')({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
