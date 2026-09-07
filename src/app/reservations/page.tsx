'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { cancelReservation, cancelReservationGroup, createReservation } from '@/api/reservation/api';
import { reservationKeys, reservationQueries } from '@/api/reservation/queries';
import { ApiError } from '@/api/client';
import type { BookingFormProps } from '@/app/reservations/components/BookingForm';
import { MyReservationsScreen } from '@/app/reservations/components/MyReservationsScreen';
import { ReservationDetailModal } from '@/app/reservations/components/modals/ReservationDetailModal';
import { ModalShell } from '@/app/reservations/components/modal-shell';
import { ReservationHeader } from '@/app/reservations/components/ReservationHeader';
import { RulesScreen } from '@/app/reservations/components/RulesScreen';
import { StatusScreen } from '@/app/reservations/components/StatusScreen';
import {
  buildCreateRequest,
  toDetailView,
  toMyReservationCard,
  toOccupancyRatioMap,
  toUiReservationFromDaily,
} from '@/app/reservations/reservation-adapter';
import { buildTimelineRows } from '@/app/reservations/reservation-logic';
import {
  addMonths,
  atMidnight,
  formatDateLabel,
  formatDuration,
  parseDateKey,
  startOfMonth,
  toDateKey,
  toMonthKey,
} from '@/app/reservations/time-utils';
import type { ReservationScreen } from '@/app/reservations/types';
import { useBookingForm } from '@/app/reservations/use-booking-form';
import { useSession } from '@/lib/auth/use-session';

export default function ReservationsPage() {
  const { session } = useSession();
  const loggedIn = !!session;
  const meInitial = session?.member.name.slice(0, 1) ?? '?';
  const queryClient = useQueryClient();

  const [now] = useState(() => new Date());
  const today = atMidnight(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [screen, setScreen] = useState<ReservationScreen>('status');
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [createResultMessage, setCreateResultMessage] = useState<string | null>(null);
  // "시간 변경" 흐름에서 새 예약이 실제로 만들어질 때까지 기존 예약을 남겨두기 위한 대상 id.
  // 사용자가 도중에 다른 날짜로 이동하면(selectDate) 의도가 취소된 것으로 보고 비운다 — 그 경우 기존 예약은 그대로 유지된다.
  const [replacingId, setReplacingId] = useState<number | null>(null);

  const selectedKey = toDateKey(selectedDate);
  const monthKey = toMonthKey(viewMonth);
  const isPastDay = selectedDate < today;

  const statusOccupancyQuery = useQuery(reservationQueries.monthlyOccupancy(monthKey));
  const mineOccupancyQuery = useQuery({ ...reservationQueries.myMonthlyOccupancy(monthKey), enabled: loggedIn });
  const dailyQuery = useQuery(reservationQueries.daily(selectedKey));
  const upcomingQuery = useQuery({ ...reservationQueries.myReservations('upcoming'), enabled: loggedIn });
  const pastQuery = useQuery({ ...reservationQueries.myReservations('past'), enabled: loggedIn });
  const detailQuery = useQuery({ ...reservationQueries.detail(detailId ?? 0), enabled: detailId != null });

  const statusRatio = statusOccupancyQuery.data ? toOccupancyRatioMap(statusOccupancyQuery.data) : new Map();
  const mineRatio = mineOccupancyQuery.data ? toOccupancyRatioMap(mineOccupancyQuery.data) : new Map();
  const dayReservations = (dailyQuery.data?.reservations ?? []).map((item) => toUiReservationFromDaily(item, selectedKey));
  const upcomingItems = upcomingQuery.data?.reservations ?? [];
  const pastItems = pastQuery.data?.reservations ?? [];
  const detailView = detailQuery.data ? toDetailView(detailQuery.data, new Date()) : null;

  const bookingForm = useBookingForm({ selectedDate, today, nowMinutes, dayReservations });

  function invalidateAfterMutation() {
    queryClient.invalidateQueries({ queryKey: reservationKeys.monthlyOccupancy(monthKey) });
    queryClient.invalidateQueries({ queryKey: reservationKeys.myMonthlyOccupancy(monthKey) });
    queryClient.invalidateQueries({ queryKey: reservationKeys.daily(selectedKey) });
    queryClient.invalidateQueries({ queryKey: reservationKeys.myReservations('upcoming') });
    queryClient.invalidateQueries({ queryKey: reservationKeys.myReservations('past') });
  }

  const createMutation = useMutation({ mutationFn: createReservation });
  const cancelMutation = useMutation({ mutationFn: cancelReservation });
  const cancelGroupMutation = useMutation({ mutationFn: cancelReservationGroup });

  function selectDate(date: Date) {
    setSelectedDate(date);
    bookingForm.reset();
    setCreateResultMessage(null);
    setReplacingId(null);
  }

  function goToday() {
    setViewMonth(startOfMonth(today));
    selectDate(today);
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
          setCreateResultMessage('새 예약은 확정됐지만 기존 예약 취소에는 실패했습니다. 내 예약에서 직접 취소해 주세요.');
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

  function handleTimeChange() {
    if (!detailView) return;
    // 기존 예약은 여기서 바로 취소하지 않는다 — 새 시간을 실제로 확정할 때(handleConfirm)까지 남겨둬서,
    // 사용자가 폼을 채우다 그냥 나가도 예약이 사라지지 않게 한다.
    const date = parseDateKey(detailView.dateKey);
    setViewMonth(startOfMonth(date));
    setSelectedDate(date);
    bookingForm.prefill(detailView.purpose, detailView.headcount);
    setCreateResultMessage(null);
    setReplacingId(detailView.id);
    setScreen('status');
    setDetailId(null);
  }

  const submitError = createMutation.error instanceof ApiError ? createMutation.error.message : createMutation.error ? '예약에 실패했습니다.' : null;
  const dailyFetchError =
    dailyQuery.error instanceof ApiError ? dailyQuery.error.message : dailyQuery.error ? '예약 현황을 불러오지 못했습니다.' : null;
  const mineError =
    upcomingQuery.error instanceof ApiError
      ? upcomingQuery.error.message
      : pastQuery.error instanceof ApiError
        ? pastQuery.error.message
        : upcomingQuery.error || pastQuery.error
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
    <div className="min-h-screen bg-gradient-to-b from-[#F6F2FB] via-[#EDF0F6] to-[#EBEEF4] px-6 pt-[34px] pb-[60px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="overflow-hidden rounded-[18px] border border-[#E8E3F0] bg-white shadow-[0_1px_2px_rgba(27,11,40,.05),0_18px_48px_-12px_rgba(27,11,40,.16)]">
          <ReservationHeader
            screen={screen}
            onScreenChange={setScreen}
            upcomingCount={upcomingItems.length}
            loggedIn={loggedIn}
            userName={session?.member.name ?? ''}
            meInitial={meInitial}
          />

          {screen === 'status' && (
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
              showForm={!isPastDay && loggedIn}
              showLoginPrompt={!isPastDay && !loggedIn}
              showPastNote={isPastDay}
              loading={dailyQuery.isLoading}
              errorMessage={submitError ?? dailyFetchError}
              createResultMessage={createResultMessage}
              bookingForm={bookingFormProps}
            />
          )}

          {screen === 'mine' && (
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
              loading={upcomingQuery.isLoading || pastQuery.isLoading}
              errorMessage={mineError}
            />
          )}

          {screen === 'rules' && <RulesScreen />}
        </div>
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
            <div className="p-8 text-center text-sm text-[#8895A7]">{detailError ?? '불러오는 중...'}</div>
          </ModalShell>
        ))}
    </div>
  );
}
