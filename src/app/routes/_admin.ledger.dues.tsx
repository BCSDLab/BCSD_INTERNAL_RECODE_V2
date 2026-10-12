import { createFileRoute, Outlet } from '@tanstack/react-router';

import Layout from '@/app/layouts/dues-layout';
import { validateDuesSearch } from '@/widgets/finance';
export const Route = createFileRoute('/_admin/ledger/dues')({
  validateSearch: validateDuesSearch,
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
