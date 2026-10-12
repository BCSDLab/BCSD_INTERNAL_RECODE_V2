import { createFileRoute, Outlet } from '@tanstack/react-router';

import Layout from '@/app/layouts/ledger-layout';
export const Route = createFileRoute('/_admin/ledger')({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
