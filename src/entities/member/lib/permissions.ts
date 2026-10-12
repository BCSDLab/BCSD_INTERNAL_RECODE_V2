import { type MemberSummary } from '../model/identity';

export function canManageGames(member: MemberSummary | undefined): boolean {
  if (!member) return false;
  if (member.role === 'ADMIN') return true;
  return member.track === 'GAME' && (member.memberType === 'MENTOR' || member.memberType === 'REGULAR');
}

export function canManageTrack(member: MemberSummary | undefined, trackCode: string | undefined): boolean {
  if (!member || !trackCode) return false;
  if (member.role === 'ADMIN') return true;
  return member.track === trackCode && (member.memberType === 'MENTOR' || member.memberType === 'REGULAR');
}
