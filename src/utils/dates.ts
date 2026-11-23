import {
  DayOperatingConfig,
  Leave,
  PhoneDutySettings,
  PhoneShiftAssignment,
  RepeatFrequency,
  ResolvedPhoneSlot,
  ScheduleEvent
} from '../types';

export const nowText = () =>
  new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const currentHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const isoFromDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const dateFromISO = (iso: string) => new Date(`${iso}T12:00:00`);

export const fmtDate = (iso: string) =>
  iso ? dateFromISO(iso).toLocaleDateString('he-IL') : '';

export const fmtShortDate = (iso: string) =>
  iso ? dateFromISO(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) : '';

export const addDaysISO = (iso: string, days: number) => {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
};

export const startOfWeekISO = (iso: string) => {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() - d.getDay());
  return isoFromDate(d);
};

export const addOneHour = (time: string) => {
  const [h, m] = (time || '08:00').split(':').map(Number);
  const total = (h * 60 + m + 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const timeToMinutes = (t: string): number => {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (mins: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const getInitials = (name: string): string => {
  const clean = (name || '').trim();
  if (!clean) return 'יח';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ''}${parts[1][0] || ''}`;
};

export const repeatLabel = (freq?: RepeatFrequency | string): string => {
  switch (freq) {
    case 'daily':
      return 'כל יום';
    case 'weekly':
      return 'כל שבוע';
    case 'biweekly':
      return 'כל שבועיים';
    case 'monthly':
      return 'כל חודש';
    default:
      return 'חד־פעמי';
  }
};

export const eventOccursOn = (e: ScheduleEvent, date: string): boolean => {
  if (date < e.date) return false;
  if (e.repeatUntil && date > e.repeatUntil) return false;
  const freq = e.repeatFrequency || 'none';
  if (freq === 'none') return e.date === date;
  const start = dateFromISO(e.date);
  const target = dateFromISO(date);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  if (freq === 'daily') return days >= 0;
  if (freq === 'weekly') return days >= 0 && days % 7 === 0;
  if (freq === 'biweekly') return days >= 0 && days % 14 === 0;
  return target.getDate() === start.getDate();
};

export const leaveOccursOn = (l: Leave, date: string): boolean => {
  if (l.status === 'cancelled') return false;
  if (l.excludedDates && l.excludedDates.includes(date)) return false;

  const freq = l.repeatFrequency || 'none';
  if (freq === 'none') {
    return l.startDate <= date && l.endDate >= date;
  }

  if (date < l.startDate) return false;
  if (l.repeatUntil && date > l.repeatUntil) return false;

  const spanDays = Math.max(
    0,
    Math.round((dateFromISO(l.endDate).getTime() - dateFromISO(l.startDate).getTime()) / 86400000)
  );
  const start = dateFromISO(l.startDate);
  const target = dateFromISO(date);
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000);

  if (diffDays < 0) return false;

  if (freq === 'daily') return true;
  if (freq === 'weekly') {
    const mod = diffDays % 7;
    return mod >= 0 && mod <= Math.min(spanDays, 6);
  }
  if (freq === 'biweekly') {
    const mod = diffDays % 14;
    return mod >= 0 && mod <= Math.min(spanDays, 13);
  }
  if (freq === 'monthly') {
    const dayDiff = target.getDate() - start.getDate();
    return dayDiff >= 0 && dayDiff <= spanDays;
  }
  return false;
};

export const DEFAULT_PHONE_DUTY_SETTINGS: PhoneDutySettings = {
  days: {
    0: {
      dayOfWeek: 0,
      enabled: true,
      openTime: '12:00',
      closeTime: '21:00',
      shifts: [
        { id: 'morning', label: 'בוקר', startTime: '12:00', endTime: '16:00' },
        { id: 'evening', label: 'ערב', startTime: '16:00', endTime: '21:00' }
      ]
    },
    1: {
      dayOfWeek: 1,
      enabled: true,
      openTime: '09:00',
      closeTime: '21:00',
      shifts: [
        { id: 'morning', label: 'בוקר', startTime: '09:00', endTime: '16:00' },
        { id: 'evening', label: 'ערב', startTime: '16:00', endTime: '21:00' }
      ]
    },
    2: {
      dayOfWeek: 2,
      enabled: true,
      openTime: '09:00',
      closeTime: '21:00',
      shifts: [
        { id: 'morning', label: 'בוקר', startTime: '09:00', endTime: '16:00' },
        { id: 'evening', label: 'ערב', startTime: '16:00', endTime: '21:00' }
      ]
    },
    3: {
      dayOfWeek: 3,
      enabled: true,
      openTime: '09:00',
      closeTime: '21:00',
      shifts: [
        { id: 'morning', label: 'בוקר', startTime: '09:00', endTime: '16:00' },
        { id: 'evening', label: 'ערב', startTime: '16:00', endTime: '21:00' }
      ]
    },
    4: {
      dayOfWeek: 4,
      enabled: true,
      openTime: '09:00',
      closeTime: '13:00',
      shifts: [
        { id: 'morning', label: 'בוקר', startTime: '09:00', endTime: '13:00' }
      ]
    },
    5: {
      dayOfWeek: 5,
      enabled: false,
      openTime: '09:00',
      closeTime: '13:00',
      shifts: []
    },
    6: {
      dayOfWeek: 6,
      enabled: false,
      openTime: '18:00',
      closeTime: '21:00',
      shifts: []
    }
  }
};

export const getEffectiveShiftsForDay = (
  date: string,
  settings: PhoneDutySettings
): { config: DayOperatingConfig; shifts: { id: string; label: string; startTime: string; endTime: string }[] } => {
  const dow = dateFromISO(date).getDay();
  const cfg = settings.days[dow] || DEFAULT_PHONE_DUTY_SETTINGS.days[dow];
  if (!cfg || !cfg.enabled) {
    return { config: cfg, shifts: [] };
  }
  const openMin = timeToMinutes(cfg.openTime);
  const closeMin = timeToMinutes(cfg.closeTime);
  if (closeMin <= openMin) {
    return { config: cfg, shifts: [] };
  }
  const validShifts = (cfg.shifts || [])
    .map((s) => {
      const sStart = Math.max(openMin, timeToMinutes(s.startTime));
      const sEnd = Math.min(closeMin, timeToMinutes(s.endTime));
      if (sEnd <= sStart) return null;
      return {
        id: s.id,
        label: s.label,
        startTime: minutesToTime(sStart),
        endTime: minutesToTime(sEnd)
      };
    })
    .filter((x): x is { id: string; label: string; startTime: string; endTime: string } => x !== null)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return { config: cfg, shifts: validShifts };
};

export const shiftAssignmentMatchesDate = (a: PhoneShiftAssignment, date: string): boolean => {
  if (a.cancelled) return false;
  if (a.excludedDates && a.excludedDates.includes(date)) return false;
  if (a.overrides?.[date]?.cancelled) return false;
  if (date < a.date) return false;
  if (a.repeatUntil && date > a.repeatUntil) return false;

  const freq = a.repeatFrequency || 'none';
  if (freq === 'none') return a.date === date;

  const diffDays = Math.round(
    (dateFromISO(date).getTime() - dateFromISO(a.date).getTime()) / 86400000
  );
  if (diffDays < 0) return false;
  if (freq === 'weekly') return diffDays % 7 === 0;
  if (freq === 'biweekly') return diffDays % 14 === 0;
  return false;
};

export const resolvePhoneSlotsForDate = (
  date: string,
  settings: PhoneDutySettings,
  assignments: PhoneShiftAssignment[]
): ResolvedPhoneSlot[] => {
  const { config, shifts } = getEffectiveShiftsForDay(date, settings);
  if (!config || !config.enabled || shifts.length === 0) return [];

  const openMin = timeToMinutes(config.openTime);
  const closeMin = timeToMinutes(config.closeTime);

  const matchingAssignments = assignments.filter((a) => shiftAssignmentMatchesDate(a, date));

  return shifts.map((shift) => {
    const exactMatch =
      matchingAssignments.find((a) => a.shiftId === shift.id && (a.repeatFrequency || 'none') === 'none') ||
      matchingAssignments.find((a) => a.shiftId === shift.id);

    const ov = exactMatch?.overrides?.[date];
    const rawStart = ov?.startTime || exactMatch?.startTime || shift.startTime;
    const rawEnd = ov?.endTime || exactMatch?.endTime || shift.endTime;
    const clampedStart = minutesToTime(Math.max(openMin, timeToMinutes(rawStart)));
    const clampedEnd = minutesToTime(Math.min(closeMin, timeToMinutes(rawEnd)));

    return {
      slotKey: `${date}_${shift.id}`,
      date,
      shiftId: shift.id,
      shiftLabel: ov?.shiftLabel || exactMatch?.shiftLabel || shift.label,
      startTime: clampedStart,
      endTime: clampedEnd,
      assignmentId: exactMatch?.id,
      personId: ov?.personId || exactMatch?.personId,
      personName: ov?.personName || exactMatch?.personName,
      isRecurring: Boolean(exactMatch && exactMatch.repeatFrequency && exactMatch.repeatFrequency !== 'none'),
      note: exactMatch?.note
    };
  });
};

export const getCurrentAndNextPhoneDuty = (
  settings: PhoneDutySettings,
  assignments: PhoneShiftAssignment[]
): { current: ResolvedPhoneSlot | null; next: ResolvedPhoneSlot | null } => {
  const today = todayISO();
  const nowMin = timeToMinutes(currentHHMM());

  const upcomingSlots: ResolvedPhoneSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const d = addDaysISO(today, i);
    const daySlots = resolvePhoneSlotsForDate(d, settings, assignments);
    for (const slot of daySlots) {
      if (i === 0) {
        if (timeToMinutes(slot.endTime) > nowMin) {
          upcomingSlots.push(slot);
        }
      } else {
        upcomingSlots.push(slot);
      }
    }
  }

  let current: ResolvedPhoneSlot | null = null;
  let next: ResolvedPhoneSlot | null = null;

  for (const slot of upcomingSlots) {
    if (
      slot.date === today &&
      timeToMinutes(slot.startTime) <= nowMin &&
      timeToMinutes(slot.endTime) > nowMin
    ) {
      current = slot;
    } else if (!next) {
      next = slot;
      if (current || slot.date > today || timeToMinutes(slot.startTime) > nowMin) {
        break;
      }
    }
  }

  return { current, next };
};
