import { DuesShell } from '@/widgets/finance';

export default function DuesLayout({ children }: { children: React.ReactNode }) {
  return <DuesShell>{children}</DuesShell>;
}
