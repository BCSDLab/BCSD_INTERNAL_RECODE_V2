import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import {
  cancelReservation,
  cancelReservationGroup,
  createReservation,
  reservationKeys,
  reservationQueries,
} from '@/entities/reservation';
import { ApiError } from '@/shared/api/client';
import { confirmDiscardChanges, useDraftGuard } from '@/shared/lib/router/use-draft-guard';
import { PageHeader } from '@/shared/ui/page-header';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/shared/ui/tabs';

import {
  addMonths,
  atMidnight,
  formatDateLabel,
  formatDuration,
  parseDateKey,
  startOfMonth,
  toDateKey,
  toMonthKey,
} from '../lib/time-utils';
import {
  buildCreateRequest,
  toDetailView,
  toMyReservationCard,
  toOccupancyRatioMap,
  toUiReservationFromDaily,
} from '../model/reservation-adapter';
import { buildTimelineRows } from '../model/reservation-logic';
import { type ReservationScreen } from '../model/types';
import { useBookingForm } from '../model/use-booking-form';
import { type BookingFormProps } from './components/BookingForm';
import { ModalShell } from './components/modal-shell';
import { ReservationDetailModal } from './components/modals/ReservationDetailModal';
import { MyReservationsScreen } from './components/MyReservationsScreen';
import { RulesScreen } from './components/RulesScreen';
import { StatusScreen } from './components/StatusScreen';

const SCREEN_TABS: { key: ReservationScreen; label: string }[] = [
  { key: 'status', label: '예약 현황' },
  { key: 'mine', label: '내 예약' },
  { key: 'rules', label: '이용 규칙' },
];

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const [now] = useState(() => new Date());
  const today = atMidnight(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const search = useSearch({ from: '/_admin/reservations' });
  const navigate = useNavigate({ from: '/reservations' });
  const screen = search.screen ?? 'status';
  const selectedDate = search.date ? parseDateKey(search.date) : today;
  const viewMonth = search.month ? parseDateKey(`${search.month}-01`) : startOfMonth(selectedDate);
  const tab = search.tab ?? 'upcoming';
  const detailId = search.detailId ?? null;
  function updateSearch(patch: Partial<typeof search>) {
    return navigate({ search: (prev) => ({ ...prev, ...patch }), resetScroll: false });
  }
  const setScreen = (nextScreen: ReservationScreen) => {
    void updateSearch({ screen: nextScreen });
  };
  const setTab = (nextTab: 'upcoming' | 'past') => {
    void updateSearch({ tab: nextTab });
  };
  const setDetailId = (nextId: number | null) => {
    void updateSearch({ detailId: nextId ?? undefined });
  };
  const setViewMonth = (update: (month: Date) => Date) => {
    void updateSearch({ month: toMonthKey(update(viewMonth)) });
  };
  const [createResultMessage, setCreateResultMessage] = useState<string | null>(null);
  // "시간 변경" 흐름에서 새 예약이 실제로 만들어질 때까지 기존 예약을 남겨두기 위한 대상 id.
  // 사용자가 도중에 다른 날짜로 이동하면(selectDate) 의도가 취소된 것으로 보고 비운다 — 그 경우 기존 예약은 그대로 유지된다.
  const [replacingId, setReplacingId] = useState<number | null>(null);

  const selectedKey = toDateKey(selectedDate);
  const monthKey = toMonthKey(viewMonth);
  const isPastDay = selectedDate < today;

  const statusOccupancyQuery = useQuery({
    ...reservationQueries.monthlyOccupancy(monthKey),
    enabled: screen === 'status',
  });
  const mineOccupancyQuery = useQuery({
    ...reservationQueries.myMonthlyOccupancy(monthKey),
    enabled: screen === 'mine',
  });
  const dailyQuery = useQuery({ ...reservationQueries.daily(selectedKey), enabled: screen === 'status' });
  const upcomingQuery = useQuery({ ...reservationQueries.myReservations('upcoming'), enabled: screen !== 'rules' });
  const pastQuery = useQuery({
    ...reservationQueries.myReservations('past'),
    enabled: screen === 'mine' && tab === 'past',
  });
  const detailQuery = useQuery({ ...reservationQueries.detail(detailId ?? 0), enabled: detailId != null });

  const statusRatio = statusOccupancyQuery.data ? toOccupancyRatioMap(statusOccupancyQuery.data) : new Map();
  const mineRatio = mineOccupancyQuery.data ? toOccupancyRatioMap(mineOccupancyQuery.data) : new Map();
  const dayReservations = (dailyQuery.data?.reservations ?? []).map((item) =>
    toUiReservationFromDaily(item, selectedKey),
  );
  const upcomingItems = upcomingQuery.data?.reservations ?? [];
  const pastItems = pastQuery.data?.reservations ?? [];
  const detailView = detailQuery.data ? toDetailView(detailQuery.data, new Date()) : null;

  const bookingForm = useBookingForm({ selectedDate, today, nowMinutes, dayReservations });
  const { reset: resetBookingForm, prefill: prefillBookingForm } = bookingForm;
  const previousDate = useRef(selectedKey);
  const pendingReplacement = useRef<{ date: string; id: number; purpose: string; headcount: number } | null>(null);
  useDraftGuard(
    bookingForm.dirty || replacingId !== null,
    ({ current, next }) =>
      current.pathname !== next.pathname || ('date' in next.search ? next.search.date : undefined) !== search.date,
  );
  useEffect(() => {
    if (previousDate.current === selectedKey) return;
    previousDate.current = selectedKey;
    resetBookingForm();
    setCreateResultMessage(null);
    setReplacingId(null);
    const pending = pendingReplacement.current;
    if (pending?.date === selectedKey) {
      prefillBookingForm(pending.purpose, pending.headcount);
      setReplacingId(pending.id);
    }
    pendingReplacement.current = null;
  }, [selectedKey, resetBookingForm, prefillBookingForm]);

  function invalidateAfterMutation() {
    void queryClient.invalidateQueries({ queryKey: reservationKeys.all() });
  }

  const createMutation = useMutation({ mutationFn: createReservation });
  const cancelMutation = useMutation({ mutationFn: cancelReservation });
  const cancelGroupMutation = useMutation({ mutationFn: cancelReservationGroup });

  function selectDate(date: Date) {
    void updateSearch({ date: toDateKey(date) });
  }

  function goToday() {
    void updateSearch({ month: toMonthKey(today), date: toDateKey(today) });
  }

  async function handleConfirm() {
    if (!bookingForm.validation.valid || !bookingForm.agree || createMutation.isPending) return;
    const lastOccurrenceKey = bookingForm.occurrences[bookingForm.occurrences.length - 1]?.dateKey;
    const body = buildCreateRequest({
      selectedDate,
      start: bookingForm.effectiveStart,
      end: bookingForm.effectiveEnd,
      purpose: bookingForm.purpose.trim() || '사용 목적 없음',
      headcount: Math.max(1, parseInt(bookingForm.headcount, 10) || 1),
      repeat: bookingForm.repeatOn
        ? {
            freq: bookingForm.freq,
            weekdays: bookingForm.pickedWeekdays,
            endDate: lastOccurrenceKey ? parseDateKey(lastOccurrenceKey) : selectedDate,
          }
        : null,
    });

    try {
      const response = await createMutation.mutateAsync(body);

      if (replacingId != null && response.created.length > 0) {
        try {
          await cancelMutation.mutateAsync(replacingId);
        } catch {
          setCreateResultMessage(
            '새 예약은 확정됐지만 기존 예약 취소에는 실패했습니다. 내 예약에서 직접 취소해 주세요.',
          );
        }
        setReplacingId(null);
      }

      setCreateResultMessage(
        bookingForm.repeatOn
          ? `${response.created.length}회 생성됨${response.skipped.length ? ` · ${response.skipped.length}회는 겹치거나 한도 초과로 건너뜀` : ''}`
          : response.created.length > 0
            ? '예약이 확정되었습니다.'
            : '예약을 만들지 못했습니다.',
      );
      bookingForm.reset();
      invalidateAfterMutation();
    } catch {
      // createMutation.error가 배너로 표시된다.
    }
  }

  const daySummary = (() => {
    const bookedMinutes = dayReservations.reduce((sum, r) => sum + (r.end - r.start), 0);
    return dayReservations.length > 0
      ? `예약 ${dayReservations.length}건 · 남은 시간 ${formatDuration(1440 - bookedMinutes)}`
      : '예약 없음 · 00:00부터 24:00까지 모두 비어 있습니다';
  })();

  const bookingFormProps: BookingFormProps = {
    centerTrigger: selectedKey,
    start: bookingForm.effectiveStart,
    end: bookingForm.effectiveEnd,
    onSetStart: bookingForm.handleSetStart,
    onSetEnd: bookingForm.handleSetEnd,
    warning: bookingForm.validation.warning,
    purpose: bookingForm.purpose,
    onPurposeChange: bookingForm.setPurpose,
    headcount: bookingForm.headcount,
    onHeadcountChange: bookingForm.setHeadcount,
    repeatOn: bookingForm.repeatOn,
    onToggleRepeat: () => bookingForm.setRepeatOn((v) => !v),
    freq: bookingForm.freq,
    onFreqChange: bookingForm.setFreq,
    weekdays: bookingForm.pickedWeekdays,
    onToggleWeekday: bookingForm.handleToggleWeekday,
    weeks: bookingForm.weeks,
    onWeeksChange: bookingForm.setWeeks,
    occurrences: bookingForm.occurrences,
    summaryLabel: bookingForm.summaryLabel,
    agree: bookingForm.agree,
    onToggleAgree: () => bookingForm.setAgree((v) => !v),
    onOpenRules: () => setScreen('rules'),
    valid: bookingForm.validation.valid && !createMutation.isPending,
    confirmLabel: createMutation.isPending ? '처리 중...' : bookingForm.confirmLabel,
    quotaNote: bookingForm.quotaNote,
    onConfirm: handleConfirm,
  };

  const upcomingCards = upcomingItems.map((item) => toMyReservationCard(item, false, setDetailId));
  const pastCards = pastItems.map((item) => toMyReservationCard(item, true, setDetailId));

  function closeDetail() {
    setDetailId(null);
  }

  async function handleCancel() {
    if (!detailView) return;
    try {
      await cancelMutation.mutateAsync(detailView.id);
      setDetailId(null);
      invalidateAfterMutation();
    } catch {
      // cancelMutation.error가 모달에 표시된다.
    }
  }

  async function handleCancelGroup() {
    if (!detailView?.repeatGroupId) return;
    try {
      await cancelGroupMutation.mutateAsync(detailView.repeatGroupId);
      setDetailId(null);
      invalidateAfterMutation();
    } catch {
      // cancelGroupMutation.error가 모달에 표시된다.
    }
  }

  async function handleTimeChange() {
    if (!detailView || ((bookingForm.dirty || replacingId !== null) && !confirmDiscardChanges())) return;
    const pending = {
      date: detailView.dateKey,
      id: detailView.id,
      purpose: detailView.purpose,
      headcount: detailView.headcount,
    };
    pendingReplacement.current = pending;
    await navigate({
      search: (prev) => ({
        ...prev,
        month: pending.date.slice(0, 7),
        date: pending.date,
        screen: 'status',
        detailId: undefined,
      }),
      resetScroll: false,
      ignoreBlocker: true,
    });
    if (selectedKey === pending.date) {
      bookingForm.prefill(pending.purpose, pending.headcount);
      setReplacingId(pending.id);
      pendingReplacement.current = null;
    }
    setCreateResultMessage(null);
  }

  const submitError =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error
        ? '예약에 실패했습니다.'
        : null;
  const dailyFetchError =
    dailyQuery.error instanceof ApiError
      ? dailyQuery.error.message
      : dailyQuery.error
        ? '예약 현황을 불러오지 못했습니다.'
        : null;
  const selectedMineError = tab === 'upcoming' ? upcomingQuery.error : pastQuery.error;
  const mineError =
    selectedMineError instanceof ApiError
      ? selectedMineError.message
      : selectedMineError
        ? '내 예약을 불러오지 못했습니다.'
        : null;
  const detailError =
    cancelMutation.error instanceof ApiError
      ? cancelMutation.error.message
      : cancelGroupMutation.error instanceof ApiError
        ? cancelGroupMutation.error.message
        : cancelMutation.error || cancelGroupMutation.error
          ? '처리에 실패했습니다.'
          : detailQuery.error instanceof ApiError
            ? detailQuery.error.message
            : detailQuery.error
              ? '예약 상세를 불러오지 못했습니다.'
              : null;

  return (
    <>
      <PageHeader crumb="홈페이지 / 동아리방 예약" title="동아리방 예약" />

      <div className="w-full px-8 pt-6 pb-10">
        <Tabs value={screen} onValueChange={setScreen}>
          <TabsList className="mb-5">
            {SCREEN_TABS.map((item) => (
              <TabsTab key={item.key} value={item.key}>
                {item.label}
                {item.key === 'mine' && upcomingItems.length > 0 && (
                  <span className="text-faint ml-1.5 text-[11px]">{upcomingItems.length}</span>
                )}
              </TabsTab>
            ))}
          </TabsList>

          <div className="border-line bg-panel overflow-hidden rounded-2xl border">
            <TabsPanel value="status">
              <StatusScreen
                viewMonth={viewMonth}
                selectedDate={selectedDate}
                today={today}
                onSelectDate={selectDate}
                onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
                onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
                onToday={goToday}
                ratioByDateKey={statusRatio}
                dateLabel={formatDateLabel(selectedDate)}
                daySummary={daySummary}
                timelineRows={buildTimelineRows(dayReservations)}
                onSelectMine={(id) => setDetailId(id)}
                showForm={!isPastDay}
                showPastNote={isPastDay}
                loading={dailyQuery.isLoading}
                errorMessage={submitError ?? dailyFetchError}
                createResultMessage={createResultMessage}
                bookingForm={bookingFormProps}
              />
            </TabsPanel>

            <TabsPanel value="mine">
              <MyReservationsScreen
                viewMonth={viewMonth}
                selectedDate={selectedDate}
                today={today}
                onSelectDate={selectDate}
                onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
                onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
                ratioByDateKey={mineRatio}
                tab={tab}
                onTabChange={setTab}
                upcomingCards={upcomingCards}
                pastCards={pastCards}
                loading={tab === 'upcoming' ? upcomingQuery.isLoading : pastQuery.isLoading}
                errorMessage={mineError}
              />
            </TabsPanel>

            <TabsPanel value="rules">
              <RulesScreen />
            </TabsPanel>
          </div>
        </Tabs>
      </div>

      {detailId != null &&
        (detailView ? (
          <ReservationDetailModal
            detail={detailView}
            errorMessage={detailError}
            onClose={closeDetail}
            onCancel={handleCancel}
            onCancelGroup={handleCancelGroup}
            onTimeChange={handleTimeChange}
          />
        ) : (
          <ModalShell onClose={closeDetail} maxWidth={472}>
            <div className="text-muted p-8 text-center text-sm">{detailError ?? '불러오는 중...'}</div>
          </ModalShell>
        ))}
    </>
  );
}
