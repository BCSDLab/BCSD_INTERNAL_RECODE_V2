import { createFileRoute } from '@tanstack/react-router';

import Layout from '@/app/layouts/exemptions-layout';
import { ExemptionManagementPage } from '@/pages/finance';
import { validateExemptionSearch } from '@/widgets/finance';
export const Route = createFileRoute('/_admin/ledger/exemptions')({
  validateSearch: validateExemptionSearch,
  component: () => (
    <Layout>
      <ExemptionManagementPage />
    </Layout>
  ),
});
