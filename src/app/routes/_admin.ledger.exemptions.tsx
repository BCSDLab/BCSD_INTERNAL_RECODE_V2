import { createFileRoute, Outlet } from '@tanstack/react-router';

import Layout from '@/app/layouts/exemptions-layout';
export const Route = createFileRoute('/_admin/ledger/exemptions')({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
