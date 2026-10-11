import { DuesShell } from '@/components/dues/DuesShell';

export default function DuesLayout({ children }: LayoutProps<'/ledger/dues'>) {
  return <DuesShell>{children}</DuesShell>;
}
