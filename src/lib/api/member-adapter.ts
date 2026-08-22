import type { Member } from '@/components/members/types';
import type {
  AdminMemberCreateRequest,
  AdminMemberProfileUpdateRequest,
  MemberDirectoryItem,
  MemberRole,
  Track as ApiTrack,
  MemberType as ApiMemberType,
} from '@/lib/api/types';
import { ACADEMIC_STATUS_BY_LABEL, ACADEMIC_STATUS_LABELS } from '@/lib/member-labels';

function stripGithubHandle(github: string): string | null {
  const trimmed = github.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

export function toUiMember(dto: MemberDirectoryItem): Member {
  return {
    id: dto.id,
    gen: dto.generation,
    track: dto.track.toLowerCase() as Member['track'],
    grade: dto.memberType.toLowerCase() as Member['grade'],
    enroll: (ACADEMIC_STATUS_LABELS[dto.academicStatus] ?? '재학') as Member['enroll'],
    name: dto.name,
    org: dto.university,
    dept: dto.department,
    sid: dto.studentNumber,
    phone: dto.phoneNumber ?? '',
    email: dto.email,
    role: dto.position ?? '—',
    github: dto.githubId ? `@${dto.githubId}` : '',
    birth: dto.birthDate ?? '',
    paid: dto.duesRequired ? 'O' : 'X',
    perm: dto.role === 'ADMIN' ? '관리자' : '일반',
    active: dto.active,
  };
}

export function toProfileUpdateRequest(member: Member): AdminMemberProfileUpdateRequest {
  return {
    name: member.name,
    track: member.track.toUpperCase() as ApiTrack,
    memberType: member.grade.toUpperCase() as ApiMemberType,
    generation: member.gen,
    university: member.org,
    department: member.dept,
    position: member.role === '—' ? null : member.role,
    birthDate: member.birth || null,
    duesRequired: member.paid === 'O',
    email: member.email,
    phoneNumber: member.phone || null,
    githubId: stripGithubHandle(member.github),
  };
}

export function toCreateRequest(member: Member): AdminMemberCreateRequest {
  return {
    name: member.name,
    studentNumber: member.sid,
    track: member.track.toUpperCase() as ApiTrack,
    memberType: member.grade.toUpperCase() as ApiMemberType,
    generation: member.gen,
    university: member.org,
    department: member.dept,
    academicStatus: ACADEMIC_STATUS_BY_LABEL[member.enroll],
    active: member.active,
    email: member.email,
    phoneNumber: member.phone || undefined,
    githubId: stripGithubHandle(member.github) ?? undefined,
  };
}

export function permToRole(perm: Member['perm']): MemberRole {
  return perm === '관리자' ? 'ADMIN' : 'MEMBER';
}
