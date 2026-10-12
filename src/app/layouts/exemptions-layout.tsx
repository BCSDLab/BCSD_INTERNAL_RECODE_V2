import { type ReactNode } from 'react';

import { DuesShell } from '@/widgets/finance';

export default function ExemptionsLayout({ children }: { children: ReactNode }) {
  return <DuesShell>{children}</DuesShell>;
}
