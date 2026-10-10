import { queryOptions, type QueryClient } from '@tanstack/react-query';
import {
  getExemptionReasons,
  getExemptions,
  getSemesterCreatable,
  getSemesterDues,
  getSemesters,
  previewExemption,
} from './api';
import { toExemption, toMemberDues, toSemesterSummary } from './mappers';
import type { ExemptionPreviewRequest, SemesterId } from './types';

export const duesKeys = {
  /** 장부 연결·면제 변경은 학기 집계를 모두 바꾼다 — 변경 뒤에는 이 접두사로 통째로 무효화한다. */
  all: () => ['dues'] as const,
  semesters: () => ['dues', 'semesters'] as const,
  semesterCreatable: () => ['dues', 'semester-creatable'] as const,
  semester: (semesterId: SemesterId) => ['dues', 'semester', semesterId] as const,
  exemptions: () => ['dues', 'exemptions'] as const,
  exemptionReasons: () => ['dues', 'exemption-reasons'] as const,
  exemptionPreview: (semesterId: SemesterId, body: ExemptionPreviewRequest) =>
    ['dues', 'exemption-preview', semesterId, body] as const,
};

export const duesQueries = {
  semesters: () =>
    queryOptions({
      queryKey: duesKeys.semesters(),
      queryFn: async () => (await getSemesters()).semesters.map(toSemesterSummary),
    }),
  semesterCreatable: () =>
    queryOptions({ queryKey: duesKeys.semesterCreatable(), queryFn: () => getSemesterCreatable() }),
  semester: (semesterId: SemesterId) =>
    queryOptions({
      queryKey: duesKeys.semester(semesterId),
      queryFn: async () => {
        const response = await getSemesterDues(semesterId);
        return { semester: toSemesterSummary(response.semester), members: response.members.map(toMemberDues) };
      },
    }),
  exemptions: () =>
    queryOptions({
      queryKey: duesKeys.exemptions(),
      queryFn: async () => (await getExemptions()).exemptions.map(toExemption),
    }),
  exemptionReasons: () =>
    queryOptions({
      queryKey: duesKeys.exemptionReasons(),
      queryFn: async () => (await getExemptionReasons()).reasons,
    }),
  exemptionPreview: (semesterId: SemesterId, body: ExemptionPreviewRequest) =>
    queryOptions({
      queryKey: duesKeys.exemptionPreview(semesterId, body),
      queryFn: async () => {
        const response = await previewExemption(semesterId, body);
        return { before: toMemberDues(response.before), after: toMemberDues(response.after) };
      },
    }),
};

/** 장부와 회비는 서로의 집계를 바꾼다. 어느 쪽을 바꾸든 둘 다 다시 받는다. */
export function invalidateLedgerAndDues(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ledger'] }),
    queryClient.invalidateQueries({ queryKey: duesKeys.all() }),
  ]);
}
