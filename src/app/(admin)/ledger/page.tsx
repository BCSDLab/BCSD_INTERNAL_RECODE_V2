import type { Metadata } from 'next';
import { LedgerPageClient } from '@/components/ledger/LedgerPageClient';

export const metadata: Metadata = {
  title: '장부 관리 | BCSD Internal',
};

export default function LedgerPage() {
  return <LedgerPageClient />;
}
