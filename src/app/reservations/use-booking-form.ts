'use client';

import { useState } from 'react';
import { generateOccurrences, formatRange, repeatSummaryLabel, validateSlot } from '@/app/reservations/reservation-logic';
import { formatDuration, mondayIndex } from '@/app/reservations/time-utils';
import type { RepeatFrequency, RepeatWeeks, Reservation } from '@/app/reservations/types';

interface UseBookingFormArgs {
  selectedDate: Date;
  today: Date;
  nowMinutes: number;
  dayReservations: Reservation[];
}

export function useBookingForm({ selectedDate, today, nowMinutes, dayReservations }: UseBookingFormArgs) {
  const [range, setRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [purpose, setPurpose] = useState('');
  const [headcount, setHeadcount] = useState('6');
  const [repeatOn, setRepeatOn] = useState(false);
  const [freq, setFreq] = useState<RepeatFrequency>('매주');
  const [customWeekdays, setCustomWeekdays] = useState<number[] | null>(null);
  const [weeks, setWeeks] = useState<RepeatWeeks>(4);
  const [agree, setAgree] = useState(false);

  const effectiveStart = range.start ?? 840;
  const effectiveEnd = range.end ?? effectiveStart + 30;

  function handleSetStart(value: number) {
    setRange((prev) => ({
      start: value,
      end: prev.end == null || prev.end <= value ? value + 30 : prev.end,
    }));
  }

  function handleSetEnd(value: number) {
    setRange((prev) => {
      const start = prev.start ?? 840;
      return { start: prev.start, end: value <= start ? start + 30 : value };
    });
  }

  const pickedWeekdays = customWeekdays ?? [mondayIndex(selectedDate)];

  function handleToggleWeekday(index: number) {
    setCustomWeekdays((prev) => {
      const base = prev ?? [mondayIndex(selectedDate)];
      return base.includes(index) ? base.filter((x) => x !== index) : [...base, index];
    });
  }

  const validation = validateSlot({
    date: selectedDate,
    today,
    nowMinutes,
    start: effectiveStart,
    end: effectiveEnd,
    dayReservations,
    repeat: repeatOn,
  });

  const occurrences = repeatOn
    ? generateOccurrences({
        startDate: selectedDate,
        freq,
        weekdays: pickedWeekdays,
        weeks,
        start: effectiveStart,
        end: effectiveEnd,
      })
    : [];
  const summaryLabel = repeatSummaryLabel(freq, weeks, occurrences);

  const confirmLabel = !validation.valid
    ? '시간을 다시 골라 주세요'
    : repeatOn
      ? `${occurrences.length}회 반복 예약 확정`
      : `${formatRange(effectiveStart, effectiveEnd)} 예약 확정`;
  const quotaNote = validation.valid
    ? `1인 하루 최대 3시간 중 ${formatDuration(effectiveEnd - effectiveStart)}`
    : '1인 하루 최대 3시간';

  function reset() {
    setRange({ start: null, end: null });
    setCustomWeekdays(null);
    setPurpose('');
    setHeadcount('6');
    setRepeatOn(false);
    setAgree(false);
  }

  /** "시간 변경" 흐름 전용 — 시간 선택은 비워두고 목적/인원만 옮겨 담는다. */
  function prefill(nextPurpose: string, nextHeadcount: number) {
    setRange({ start: null, end: null });
    setCustomWeekdays(null);
    setPurpose(nextPurpose);
    setHeadcount(String(nextHeadcount));
  }

  return {
    effectiveStart,
    effectiveEnd,
    handleSetStart,
    handleSetEnd,
    purpose,
    setPurpose,
    headcount,
    setHeadcount,
    repeatOn,
    setRepeatOn,
    freq,
    setFreq,
    pickedWeekdays,
    handleToggleWeekday,
    weeks,
    setWeeks,
    agree,
    setAgree,
    validation,
    occurrences,
    summaryLabel,
    confirmLabel,
    quotaNote,
    reset,
    prefill,
  };
}
