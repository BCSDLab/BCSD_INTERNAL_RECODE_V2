'use client';

import { useState } from 'react';
import type { BookingFormProps } from '@/components/reservations/BookingForm';
import { ReservationDetailModal } from '@/components/reservations/modals/ReservationDetailModal';
import { MyReservationsScreen } from '@/components/reservations/MyReservationsScreen';
import { buildCreateRequest, toMyReservationCard } from '@/components/reservations/reservation-adapter';
import { buildTimelineRows } from '@/components/reservations/reservation-logic';
import { ReservationHeader } from '@/components/reservations/ReservationHeader';
import { RulesScreen } from '@/components/reservations/RulesScreen';
import { StatusScreen } from '@/components/reservations/StatusScreen';
import {
  addMonths,
  atMidnight,
  formatDateLabel,
  formatDuration,
  parseDateKey,
  startOfMonth,
  toDateKey,
} from '@/components/reservations/time-utils';
import type { ReservationScreen } from '@/components/reservations/types';
import { useBookingForm } from '@/components/reservations/use-booking-form';
import { useDailyReservations } from '@/components/reservations/use-daily-reservations';
import { useMonthlyOccupancy } from '@/components/reservations/use-monthly-occupancy';
import { useMyReservations } from '@/components/reservations/use-my-reservations';
import { useReservationDetail } from '@/components/reservations/use-reservation-detail';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api/client';
import { cancelReservation, cancelReservationGroup, createReservation } from '@/lib/api/reservations';
import { useSession } from '@/lib/auth/use-session';

export default function ReservationsPage() {
  const { session } = useSession();
  const loggedIn = !!session;
  const meInitial = session?.member.name.slice(0, 1) ?? '?';

  const [now] = useState(() => new Date());
  const today = atMidnight(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [screen, setScreen] = useState<ReservationScreen>('status');
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createResultMessage, setCreateResultMessage] = useState<string | null>(null);
  // "시간 변경" 흐름에서 새 예약이 실제로 만들어질 때까지 기존 예약을 남겨두기 위한 대상 id.
  // 사용자가 도중에 다른 날짜로 이동하면(selectDate) 의도가 취소된 것으로 보고 비운다 — 그 경우 기존 예약은 그대로 유지된다.
  const [replacingId, setReplacingId] = useState<number | null>(null);

  const selectedKey = toDateKey(selectedDate);
  const isPastDay = selectedDate < today;

  const { statusRatio, mineRatio, refresh: refreshOccupancy } = useMonthlyOccupancy(viewMonth, loggedIn);
  const { dayReservations, loading: dailyLoading, error: dailyFetchError, refresh: refreshDaily } = useDailyReservations(selectedDate);
  const { upcomingItems, pastItems, loading: mineLoading, error: mineError, refresh: refreshMine } = useMyReservations(loggedIn);
  const { detailView, error: detailError, setError: setDetailError } = useReservationDetail(detailId);
  const bookingForm = useBookingForm({ selectedDate, today, nowMinutes, dayReservations });

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

  async function refreshAfterMutation() {
    await Promise.all([refreshOccupancy(), refreshMine()]);
  }

  async function handleConfirm() {
    if (!bookingForm.validation.valid || !bookingForm.agree || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
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
      const response = await createReservation(body);

      if (replacingId != null && response.created.length > 0) {
        try {
          await cancelReservation(replacingId);
        } catch {
          setSubmitError('새 예약은 확정됐지만 기존 예약 취소에는 실패했습니다. 내 예약에서 직접 취소해 주세요.');
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
      await refreshDaily();
      await refreshAfterMutation();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : '예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
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
    valid: bookingForm.validation.valid && !submitting,
    confirmLabel: submitting ? '처리 중...' : bookingForm.confirmLabel,
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
      await cancelReservation(detailView.id);
      setDetailId(null);
      await refreshDaily();
      await refreshAfterMutation();
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : '취소에 실패했습니다.');
    }
  }

  async function handleCancelGroup() {
    if (!detailView?.repeatGroupId) return;
    try {
      await cancelReservationGroup(detailView.repeatGroupId);
      setDetailId(null);
      await refreshDaily();
      await refreshAfterMutation();
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : '그룹 취소에 실패했습니다.');
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
              loading={dailyLoading}
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
              loading={mineLoading}
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
          <Modal onClose={closeDetail} maxWidth={472}>
            <div className="p-8 text-center text-sm text-[#8895A7]">{detailError ?? '불러오는 중...'}</div>
          </Modal>
        ))}
    </div>
  );
}
