/**
 * member-picker-modal·MembersSection·MentorSection·BasicInfoTab 네 곳이 사진 없을 때
 * fallback을 각자 다르게 그리고 있었다 — 어떤 곳은 빈 회색 원, 어떤 곳은 빈 보라 원.
 * 인명부 메인 테이블(MemberTable)만 이름 첫 글자를 보여줘서 그 화면만 사진 없는 회원을
 * 구분할 수 있었다. 전부 이니셜 방식으로 통일한다.
 *
 * size: sm(22px, 명부 검색 후보 행) / md(26px, 참여 멤버·멘토 행) / lg(34px, 인명부 테이블) /
 * xl(64px, 내 정보 수정 프로필 카드)
 */
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-[22px] w-[22px] text-[10px]',
  md: 'h-[26px] w-[26px] text-[11px]',
  lg: 'h-[34px] w-[34px] text-xs',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <span className={`flex-none overflow-hidden rounded-full ${SIZE_CLASS[size]} ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="bg-primary text-on-primary flex h-full w-full items-center justify-center font-semibold">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
