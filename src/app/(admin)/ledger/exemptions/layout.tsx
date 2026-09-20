import { DuesShell } from '@/components/dues/DuesShell';
import type { ReactNode } from 'react';

export default function ExemptionsLayout({ children }: { children: ReactNode }) {
  return <DuesShell>{children}</DuesShell>;
}
