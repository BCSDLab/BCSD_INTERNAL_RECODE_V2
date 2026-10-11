import { DuesUiProvider } from '@/components/dues/DuesUiProvider';

export default function LedgerLayout({ children }: LayoutProps<'/ledger'>) {
  return <DuesUiProvider>{children}</DuesUiProvider>;
}
