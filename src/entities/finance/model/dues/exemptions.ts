export interface ExemptionPeriod {
  id: string;
  memberId: string;
  reason: string;
  note: string;
  startMonth: string;
  endMonth: string | null;
}

export interface ExemptionDraft {
  memberId: string;
  reason: string;
  note: string;
  startMonth: string;
  endMonth: string | null;
}

export function monthIsInExemption(month: string, exemption: ExemptionPeriod) {
  return month >= exemption.startMonth && (exemption.endMonth === null || month <= exemption.endMonth);
}
