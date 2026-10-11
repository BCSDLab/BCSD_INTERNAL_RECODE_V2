import type { Metadata } from 'next';
import { ExemptionManagementView } from '@/components/dues/ExemptionManagementView';

export const metadata: Metadata = {
  title: '면제 사유 관리 | BCSD Internal',
};

export default function ExemptionManagementPage() {
  return <ExemptionManagementView />;
}
