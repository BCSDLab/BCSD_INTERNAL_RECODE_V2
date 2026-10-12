import { DuesUiProvider } from '@/widgets/finance';

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <DuesUiProvider>{children}</DuesUiProvider>;
}
