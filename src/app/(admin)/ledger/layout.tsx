import { AppDataProvider } from '@/components/app-data/AppDataProvider';

export default function LedgerLayout({ children }: LayoutProps<'/ledger'>) {
  return <AppDataProvider>{children}</AppDataProvider>;
}
