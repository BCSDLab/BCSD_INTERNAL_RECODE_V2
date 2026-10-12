# React · TanStack 사용 검토

검토일: 2026-10-12. React 19 / TanStack Query v5 / TanStack Router v1 기준.

## 유지할 구조

- FSD의 `entities/*/api/queries.ts`가 key와 `queryOptions`를 함께 제공한다. UI와 Router loader가 같은 옵션을 재사용한다.
- `main.tsx`에서 생성한 QueryClient를 Provider와 Router context에 동일하게 주입한다.
- 트랙 loader는 다음 상세 데이터를 확보한 후 이동한다. 편집 데이터에 이전 트랙의 placeholder를 넣지 않는다.
- Query용 lint 규칙과 FSD import 검사를 유지한다.

## 적용한 개선

| 발견한 문제                                                          | 변경                                                                                                           | 확인 방법                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 트랙 헤더·학습 항목 저장 후 캐시가 이전 값을 유지                    | entity의 `trackMutations` 옵션에 서버 응답 반영을 모음. 헤더는 상세와 목록을 함께 갱신하고, 변경된 필드만 병합 | 제목·탭 즉시 반영, 캐시 재방문, 다른 섹션 보존      |
| 같은 필드의 저장 요청이 겹치면 서버 반영 순서가 바뀔 수 있음         | 트랙 헤더·학습 항목, 활동 헤더별 `scope.id`로 요청 직렬화                                                      | 첫 응답 전 두 번째 요청이 나가지 않는지 확인        |
| 상태 updater 내부에서 자동 저장을 예약                               | 이벤트 처리에서 다음 상태 계산 → 상태 변경 → 저장 예약. updater는 순수한 계산으로 유지                         | 입력·저장·전환 브라우저 테스트                      |
| 학습 항목 수정 예약 후 삭제·정렬하면 옛 배열이 나중에 저장될 수 있음 | debounce에 `cancel`을 제공하고 즉시 저장 전에 예약 취소                                                        | 수정 직후 삭제해도 삭제 전 배열이 전송되지 않음     |
| 활동 카테고리 전환 시 폼·mutation·저장 타이머가 다른 ID를 공유       | 선택은 목록에서 파생하고 편집 컴포넌트를 category ID로 key 지정                                                | 이전 초안이 새 화면이나 저장 요청으로 넘어가지 않음 |
| nullable ID를 `as number`로 단언한 쿼리 함수                         | 활동 목록·상세 factory에서 `skipToken`으로 선택 전 요청 차단                                                   | 타입 검사 및 활동 화면 회귀 테스트                  |

폼은 서버 데이터로 최초 초기화하는 편집 초안으로 취급한다. 같은 항목의 백그라운드 갱신이 사용자의 입력을 덮어쓰지 않는다. 다른 항목으로 이동하면 편집기를 새로 만든다. 아직 실행되지 않은 이전 편집기의 자동 저장은 취소된다. 이동 전에 저장을 반드시 완료해야 한다면 별도로 flush/이탈 대기 UX를 설계해야 한다.

## 추가 검토 대상

- `pages/reservations/ui/page.tsx`: 화면에서 보지 않는 과거·예정 목록과 두 월별 점유 쿼리도 함께 구독한다. 화면별 컴포넌트 또는 쿼리 활성 조건으로 분리할 수 있다. 예약 생성 후에는 영향을 받은 월·날짜 전체를 기준으로 갱신 범위를 확인해야 한다.
- `pages/activities/ui/components/ActivityEditModal.tsx`: 여러 invalidate 호출의 완료를 기다리지 않는다. 모달 종료와 갱신 완료의 관계를 정하고, 필요한 경우 `Promise.all`을 반환해야 한다.
- `pages/home/ui/components/RecruitLinkSection.tsx`: 초기화 플래그로 서버 데이터를 폼에 복사한다. 서버 데이터가 준비된 뒤 편집기를 마운트하는 동일한 경계로 정리할 수 있다.
- `pages/tracks/ui/page.tsx`: index loader와 effect에 첫 트랙 이동 로직이 함께 있다. 빈 목록 진입 후 외부에서 트랙이 추가되는 경우까지 정리한 후 loader/invalidation 정책으로 통합할 수 있다.

조건부 렌더 중 같은 컴포넌트의 상태를 조정하는 패턴은 React가 허용한다. 전부 오류로 분류하지 않고, 파생 값이나 key를 쓰는 편이 더 단순한 부분부터 정리한다. `useEffect` 자체나 `enabled` 자체도 금지 대상이 아니다.

## 참고 자료

- [TkDodo — The Query Options API](https://tkdodo.eu/blog/the-query-options-api): query 정의를 UI와 loader에서 재사용하는 기준.
- [TkDodo — React Query and Forms](https://tkdodo.eu/blog/react-query-and-forms): 서버 상태와 사용자 초안의 수명 구분.
- [TkDodo — Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query): 저장 후 캐시 갱신과 UI 콜백의 책임 구분.
- [TanStack Query — Invalidations from Mutations](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations): 갱신 완료까지 pending을 유지하려면 Promise 반환.
- [TanStack Query — Mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations): 동일 scope의 mutation 직렬 처리.
- [TanStack Query — Disabling Queries](https://tanstack.com/query/v5/docs/framework/react/guides/disabling-queries): nullable 인자의 타입 안전한 skipToken 처리.
- [React — useState](https://react.dev/reference/react/useState): updater의 순수성, key를 이용한 상태 초기화.
- [React — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect): 파생 상태와 편집 컴포넌트 경계.
