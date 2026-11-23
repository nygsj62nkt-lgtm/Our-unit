import React, { useMemo, useState } from 'react';
import {
  Phone,
  Clock3,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Repeat,
  Check,
  X
} from 'lucide-react';
import {
  DayOperatingConfig,
  Person,
  PhoneDutySettings,
  PhoneShiftAssignment,
  PhoneShiftRepeat,
  ResolvedPhoneSlot
} from '../types';
import {
  addDaysISO,
  dateFromISO,
  fmtDate,
  fmtShortDate,
  getCurrentAndNextPhoneDuty,
  nowText,
  resolvePhoneSlotsForDate,
  startOfWeekISO,
  todayISO,
  uid
} from '../utils/dates';

interface PhoneDutyProps {
  isCommander: boolean;
  myPersonId: string;
  currentUserName: string;
  people: Person[];
  settings: PhoneDutySettings;
  assignments: PhoneShiftAssignment[];
  onSaveAssignment: (a: PhoneShiftAssignment) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onSaveSettings: (s: PhoneDutySettings) => Promise<void>;
  onNotify: (text: string, entityId?: string) => void;
}

export const PhoneDutyHomeCard: React.FC<PhoneDutyProps> = ({
  isCommander,
  myPersonId,
  currentUserName,
  people,
  settings,
  assignments,
  onSaveAssignment,
  onDeleteAssignment,
  onSaveSettings,
  onNotify
}) => {
  const [weekAnchor, setWeekAnchor] = useState(todayISO());
  const [boardOpen, setBoardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [editingSlot, setEditingSlot] = useState<ResolvedPhoneSlot | null>(null);
  const [assignPersonId, setAssignPersonId] = useState('');
  const [assignRepeat, setAssignRepeat] = useState<PhoneShiftRepeat>('none');
  const [assignRepeatUntil, setAssignRepeatUntil] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignScope, setAssignScope] = useState<'single' | 'series'>('single');

  const { current, next } = useMemo(
    () => getCurrentAndNextPhoneDuty(settings, assignments),
    [settings, assignments]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeekISO(weekAnchor);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  }, [weekAnchor]);

  const activePeople = useMemo(() => people.filter((p) => p.active), [people]);

  const openSlotEditor = (slot: ResolvedPhoneSlot) => {
    if (!isCommander) return;
    setEditingSlot(slot);
    setAssignPersonId(slot.personId || activePeople[0]?.id || '');
    const existing = slot.assignmentId
      ? assignments.find((a) => a.id === slot.assignmentId)
      : undefined;
    setAssignRepeat(existing?.repeatFrequency || 'none');
    setAssignRepeatUntil(existing?.repeatUntil || '');
    setAssignNote(slot.note || '');
    setAssignScope(existing && existing.repeatFrequency !== 'none' ? 'single' : 'series');
  };

  const handleSaveSlot = async () => {
    if (!editingSlot || !isCommander) return;
    const person = activePeople.find((p) => p.id === assignPersonId);
    if (!person) return;
    const at = nowText();
    const existing = editingSlot.assignmentId
      ? assignments.find((a) => a.id === editingSlot.assignmentId)
      : undefined;

    if (existing && existing.repeatFrequency !== 'none' && assignScope === 'single') {
      const updated: PhoneShiftAssignment = {
        ...existing,
        overrides: {
          ...(existing.overrides || {}),
          [editingSlot.date]: {
            personId: person.id,
            personName: person.name,
            cancelled: false
          }
        },
        updatedBy: currentUserName,
        updatedAt: at
      };
      await onSaveAssignment(updated);
      onNotify(
        `${currentUserName} החליפ/ה כונן טלפון (${editingSlot.shiftLabel}, ${fmtShortDate(editingSlot.date)}) ל-${person.name}`,
        updated.id
      );
    } else if (existing) {
      const updated: PhoneShiftAssignment = {
        ...existing,
        personId: person.id,
        personName: person.name,
        repeatFrequency: assignRepeat,
        repeatUntil: assignRepeat !== 'none' ? assignRepeatUntil : '',
        note: assignNote,
        cancelled: false,
        updatedBy: currentUserName,
        updatedAt: at
      };
      await onSaveAssignment(updated);
      onNotify(
        `${currentUserName} עדכנ/ה כונן טלפון (${editingSlot.shiftLabel}, ${fmtShortDate(editingSlot.date)}) ל-${person.name}`,
        updated.id
      );
    } else {
      const created: PhoneShiftAssignment = {
        id: uid(),
        date: editingSlot.date,
        shiftId: editingSlot.shiftId,
        shiftLabel: editingSlot.shiftLabel,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        personId: person.id,
        personName: person.name,
        repeatFrequency: assignRepeat,
        repeatUntil: assignRepeat !== 'none' ? assignRepeatUntil : '',
        note: assignNote,
        createdBy: currentUserName,
        createdAt: at,
        updatedBy: currentUserName,
        updatedAt: at
      };
      await onSaveAssignment(created);
      onNotify(
        `${currentUserName} שיבצ/ה את ${person.name} לכוננות טלפון (${editingSlot.shiftLabel}, ${fmtShortDate(editingSlot.date)})`,
        created.id
      );
    }

    setEditingSlot(null);
  };

  const handleCancelSlot = async (mode: 'single' | 'series') => {
    if (!editingSlot || !editingSlot.assignmentId || !isCommander) return;
    const existing = assignments.find((a) => a.id === editingSlot.assignmentId);
    if (!existing) return;
    const at = nowText();

    if (existing.repeatFrequency !== 'none' && mode === 'single') {
      const excluded = Array.from(new Set([...(existing.excludedDates || []), editingSlot.date]));
      await onSaveAssignment({
        ...existing,
        excludedDates: excluded,
        updatedBy: currentUserName,
        updatedAt: at
      });
    } else {
      await onDeleteAssignment(existing.id);
    }

    onNotify(
      `${currentUserName} ביטל/ה כוננות טלפון (${editingSlot.shiftLabel}, ${fmtShortDate(editingSlot.date)})`
    );
    setEditingSlot(null);
  };

  const isMyCurrent = Boolean(current?.personId && current.personId === myPersonId);
  const isMyNext = Boolean(next?.personId && next.personId === myPersonId);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100/80 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-[#EEE1FF] text-[#7047D7] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-black text-sm text-slate-800">כונני טלפון</h3>
            <p className="text-[11px] text-slate-400">מעקב משמרות וכוננות יחידתית</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isCommander && (
            <button
              onClick={() => setSettingsOpen(true)}
              title="הגדרת שעות פעילות ומשמרות"
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-[#7047D7] border border-slate-100 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setBoardOpen((v) => !v)}
            className="text-xs font-extrabold text-[#7047D7] bg-[#F6F0FF] px-3 py-2 rounded-xl active:scale-[.98] transition"
          >
            {boardOpen ? 'סגור לוח' : 'לוח שבועי'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div
          onClick={() => current && isCommander && openSlotEditor(current)}
          className={`rounded-2xl p-3 border transition ${
            isMyCurrent
              ? 'bg-gradient-to-br from-[#7047D7] to-[#5B35BC] text-white border-[#7047D7] shadow-md'
              : 'bg-gradient-to-br from-[#F7F3FF] to-[#EFE8FF] text-slate-800 border-[#E5D8FF]'
          } ${current && isCommander ? 'cursor-pointer active:scale-[.99]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isMyCurrent ? 'bg-white/20 text-white' : 'bg-[#7047D7] text-white'
              }`}
            >
              כונן נוכחי
            </span>
            {isMyCurrent && (
              <span className="text-[10px] font-extrabold bg-amber-300 text-slate-900 px-2 py-0.5 rounded-full">
                המשמרת שלך
              </span>
            )}
          </div>
          {current ? (
            <div className="mt-2">
              <div className="font-black text-base leading-tight">
                {current.personName || 'טרם שובץ כונן'}
              </div>
              <div
                className={`text-xs mt-1 flex items-center gap-1.5 font-bold ${
                  isMyCurrent ? 'text-white/85' : 'text-slate-600'
                }`}
              >
                <Clock3 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {current.shiftLabel} • {current.startTime}–{current.endTime}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 font-bold">
              אין כונן פעיל כרגע (מחוץ לשעות הפעילות)
            </div>
          )}
        </div>

        <div
          onClick={() => next && isCommander && openSlotEditor(next)}
          className={`rounded-2xl p-3 border transition ${
            isMyNext
              ? 'bg-amber-50 border-amber-300 text-slate-900 ring-2 ring-amber-200'
              : 'bg-slate-50 border-slate-100 text-slate-800'
          } ${next && isCommander ? 'cursor-pointer active:scale-[.99]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              הכונן הבא
            </span>
            {isMyNext && (
              <span className="text-[10px] font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                הבא שלך
              </span>
            )}
          </div>
          {next ? (
            <div className="mt-2">
              <div className="font-black text-base leading-tight">
                {next.personName || 'טרם שובץ כונן'}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-bold">
                <Clock3 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {next.date === todayISO()
                    ? 'היום'
                    : dateFromISO(next.date).toLocaleDateString('he-IL', { weekday: 'short' })}{' '}
                  • {next.shiftLabel} ({next.startTime}–{next.endTime})
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400 font-bold">
              אין משמרות קרובות מוגדרות
            </div>
          )}
        </div>
      </div>

      {boardOpen && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setWeekAnchor(addDaysISO(weekAnchor, -7))}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border text-xs font-bold text-slate-600"
            >
              שבוע קודם
            </button>
            <button
              onClick={() => setWeekAnchor(todayISO())}
              className="px-3 py-1.5 rounded-xl bg-[#F6F0FF] text-xs font-extrabold text-[#7047D7]"
            >
              השבוע ({fmtShortDate(weekDays[0])}–{fmtShortDate(weekDays[6])})
            </button>
            <button
              onClick={() => setWeekAnchor(addDaysISO(weekAnchor, 7))}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border text-xs font-bold text-slate-600"
            >
              שבוע הבא
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {weekDays.map((day) => {
              const slots = resolvePhoneSlotsForDate(day, settings, assignments);
              const isToday = day === todayISO();
              const dayTitle = dateFromISO(day).toLocaleDateString('he-IL', { weekday: 'long' });

              return (
                <div
                  key={day}
                  className={`rounded-2xl p-3 border ${
                    isToday
                      ? 'bg-[#FAF7FF] border-[#D8C5FF]'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-800">{dayTitle}</span>
                      {isToday && (
                        <span className="text-[9px] font-black bg-[#7047D7] text-white px-1.5 py-0.5 rounded-md">
                          היום
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold">{fmtShortDate(day)}</span>
                  </div>

                  {slots.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-1.5">אין פעילות ביום זה</div>
                  ) : (
                    <div className="space-y-1.5">
                      {slots.map((slot) => {
                        const isMine = Boolean(slot.personId && slot.personId === myPersonId);
                        return (
                          <div
                            key={slot.slotKey}
                            onClick={() => isCommander && openSlotEditor(slot)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                              isMine
                                ? 'bg-[#7047D7] text-white border-[#7047D7] shadow-sm'
                                : slot.personName
                                ? 'bg-white border-slate-200/80 text-slate-800'
                                : 'bg-white/60 border-dashed border-slate-300 text-slate-500'
                            } ${isCommander ? 'cursor-pointer hover:border-[#7047D7]' : ''}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                    isMine
                                      ? 'bg-white/20 text-white'
                                      : 'bg-purple-50 text-[#7047D7]'
                                  }`}
                                >
                                  {slot.shiftLabel}
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    isMine ? 'text-white/90' : 'text-slate-500'
                                  }`}
                                >
                                  {slot.startTime}–{slot.endTime}
                                </span>
                                {slot.isRecurring && (
                                  <Repeat
                                    className={`w-3 h-3 shrink-0 ${
                                      isMine ? 'text-white/80' : 'text-[#7047D7]'
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="font-black text-xs mt-1 truncate">
                                {slot.personName || (isCommander ? '+ שיבוץ כונן' : 'לא שובץ')}
                              </div>
                            </div>

                            {isCommander && (
                              <span
                                className={`p-1.5 rounded-lg shrink-0 ${
                                  isMine
                                    ? 'bg-white/15 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingSlot && isCommander && (
        <div
          className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-[400px] bg-white rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-xl bg-slate-50 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h4 className="font-black text-base">שיבוץ כונן טלפון</h4>
                <p className="text-xs text-slate-400">
                  {fmtDate(editingSlot.date)} • {editingSlot.shiftLabel} ({editingSlot.startTime}–
                  {editingSlot.endTime})
                </p>
              </div>
              <span className="w-8" />
            </div>

            {activePeople.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 text-xs font-bold text-center">
                אין עדיין חיילים או מפקדים פעילים במערכת. יש להוסיף כוח אדם בלשונית אנשים.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1.5">
                    בחירת כונן/ית
                  </label>
                  <select
                    value={assignPersonId}
                    onChange={(e) => setAssignPersonId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"
                  >
                    {activePeople.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category === 'commander' ? 'מפקד/ת' : p.category === 'reserve' ? 'מילואים' : 'חייל/ת'})
                      </option>
                    ))}
                  </select>
                </div>

                {editingSlot.isRecurring && (
                  <div className="bg-[#F6F0FF] p-3 rounded-2xl space-y-2">
                    <div className="text-xs font-extrabold text-[#7047D7]">
                      זוהי כוננות חוזרת — מה ברצונך לעדכן?
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignScope('single')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold ${
                          assignScope === 'single'
                            ? 'bg-[#7047D7] text-white'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        רק לתאריך זה
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignScope('series')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold ${
                          assignScope === 'series'
                            ? 'bg-[#7047D7] text-white'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        לכל הסדרה
                      </button>
                    </div>
                  </div>
                )}

                {(!editingSlot.isRecurring || assignScope === 'series') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 mb-1.5">
                        תדירות כוננות
                      </label>
                      <select
                        value={assignRepeat}
                        onChange={(e) => setAssignRepeat(e.target.value as PhoneShiftRepeat)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"
                      >
                        <option value="none">חד־פעמית</option>
                        <option value="weekly">חוזרת כל שבוע (באותו יום ומשמרת)</option>
                        <option value="biweekly">חוזרת כל שבועיים</option>
                      </select>
                    </div>

                    {assignRepeat !== 'none' && (
                      <div>
                        <label className="block text-xs font-extrabold text-slate-600 mb-1.5">
                          תאריך סיום לחזרתיות (אופציונלי)
                        </label>
                        <input
                          type="date"
                          min={editingSlot.date}
                          value={assignRepeatUntil}
                          onChange={(e) => setAssignRepeatUntil(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1.5">
                    הערה (אופציונלי)
                  </label>
                  <input
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    placeholder="למשל: החלפה זמנית / מס׳ טלפון כונן"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
                  />
                </div>

                <button
                  onClick={handleSaveSlot}
                  className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  שמירת שיבוץ
                </button>

                {editingSlot.assignmentId && (
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelSlot('single')}
                      className="flex-1 bg-rose-50 text-rose-600 p-2.5 rounded-xl text-xs font-extrabold"
                    >
                      ביטול לתאריך זה
                    </button>
                    {editingSlot.isRecurring && (
                      <button
                        type="button"
                        onClick={() => handleCancelSlot('series')}
                        className="flex-1 bg-rose-100 text-rose-700 p-2.5 rounded-xl text-xs font-extrabold"
                      >
                        ביטול כל הסדרה
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {settingsOpen && isCommander && (
        <PhoneDutySettingsModal
          settings={settings}
          currentUserName={currentUserName}
          onClose={() => setSettingsOpen(false)}
          onSave={async (updated) => {
            await onSaveSettings(updated);
            onNotify(`${currentUserName} עדכנ/ה את שעות הפעילות ומשמרות כוננות הטלפון`);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
};

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function PhoneDutySettingsModal({
  settings,
  currentUserName,
  onClose,
  onSave
}: {
  settings: PhoneDutySettings;
  currentUserName: string;
  onClose: () => void;
  onSave: (s: PhoneDutySettings) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PhoneDutySettings>(() => JSON.parse(JSON.stringify(settings)));
  const [selectedDow, setSelectedDow] = useState<number>(0);

  const dayCfg: DayOperatingConfig = draft.days[selectedDow];

  const updateDay = (patch: Partial<DayOperatingConfig>) => {
    setDraft((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [selectedDow]: {
          ...prev.days[selectedDow],
          ...patch
        }
      }
    }));
  };

  const updateShift = (idx: number, field: 'label' | 'startTime' | 'endTime', val: string) => {
    const nextShifts = dayCfg.shifts.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    updateDay({ shifts: nextShifts });
  };

  const addShift = () => {
    updateDay({
      shifts: [
        ...dayCfg.shifts,
        {
          id: `shift-${uid()}`,
          label: dayCfg.shifts.length === 0 ? 'בוקר' : dayCfg.shifts.length === 1 ? 'ערב' : 'משמרת נוספת',
          startTime: dayCfg.openTime,
          endTime: dayCfg.closeTime
        }
      ]
    });
  };

  const removeShift = (idx: number) => {
    updateDay({ shifts: dayCfg.shifts.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    await onSave({
      ...draft,
      updatedBy: currentUserName,
      updatedAt: nowText()
    });
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-50 text-slate-400">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h4 className="font-black text-base">שעות פעילות ומשמרות כונן</h4>
            <p className="text-[11px] text-slate-400">
              משמרות מחוץ לשעות הפעילות לא יוצגו בלוח
            </p>
          </div>
          <span className="w-8" />
        </div>

        <div className="grid grid-cols-7 gap-1 bg-slate-100 p-1 rounded-2xl">
          {DAY_NAMES.map((name, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDow(idx)}
              className={`py-2 rounded-xl text-xs font-extrabold transition ${
                selectedDow === idx
                  ? 'bg-[#7047D7] text-white shadow-sm'
                  : draft.days[idx]?.enabled
                  ? 'text-slate-700 hover:bg-white/70'
                  : 'text-slate-400'
              }`}
            >
              {name.slice(0, 2)}׳
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm">יום {DAY_NAMES[selectedDow]}</span>
            <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
              <input
                type="checkbox"
                checked={dayCfg.enabled}
                onChange={(e) => updateDay({ enabled: e.target.checked })}
                className="w-4 h-4 accent-[#7047D7]"
              />
              יום פעילות פעיל
            </label>
          </div>

          {dayCfg.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    תחילת פעילות
                  </label>
                  <input
                    type="time"
                    value={dayCfg.openTime}
                    onChange={(e) => updateDay({ openTime: e.target.value })}
                    className="w-full p-2.5 bg-white border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    סיום פעילות
                  </label>
                  <input
                    type="time"
                    value={dayCfg.closeTime}
                    onChange={(e) => updateDay({ closeTime: e.target.value })}
                    className="w-full p-2.5 bg-white border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">משמרות ביום זה</span>
                  <button
                    type="button"
                    onClick={addShift}
                    className="text-xs font-extrabold text-[#7047D7] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הוסף משמרת
                  </button>
                </div>

                {dayCfg.shifts.map((sh, idx) => (
                  <div
                    key={sh.id}
                    className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={sh.label}
                        onChange={(e) => updateShift(idx, 'label', e.target.value)}
                        placeholder="שם משמרת (למשל בוקר)"
                        className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeShift(idx)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={sh.startTime}
                        onChange={(e) => updateShift(idx, 'startTime', e.target.value)}
                        className="p-2 bg-slate-50 border rounded-lg text-xs font-bold"
                      />
                      <input
                        type="time"
                        value={sh.endTime}
                        onChange={(e) => updateShift(idx, 'endTime', e.target.value)}
                        className="p-2 bg-slate-50 border rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-black text-sm shadow-md"
        >
          שמירת הגדרות שעות ומשמרות
        </button>
      </div>
    </div>
  );
}
