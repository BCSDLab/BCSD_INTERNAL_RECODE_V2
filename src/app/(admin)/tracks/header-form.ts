/**
 * 헤더 3필드는 하나의 PUT으로 전체 교체되므로 폼 상태를 페이지가 들고 섹션에 내려준다.
 * 섹션이 페이지에서 타입을 직접 import하면 상대경로(../page)가 되어 eslint
 * no-restricted-imports에 걸리므로 타입만 여기로 뺀다.
 */
export interface HeaderFormValues {
  displayName: string;
  tagline: string;
}
