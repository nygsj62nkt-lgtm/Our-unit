import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Phone,
  CalendarDays,
  Palmtree,
  History,
  Send
} from 'lucide-react';
import {
  Duty,
  Leave,
  Person,
  PhoneDutySettings,
  PhoneShiftAssignment,
  ScheduleEvent,
  Task,
  UserProfile
} from '../types';
import {
  addDaysISO,
  dateFromISO,
  eventOccursOn,
  fmtDate,
  fmtShortDate,
  getInitials,
  leaveOccursOn,
  repeatLabel,
  resolvePhoneSlotsForDate,
  startOfWeekISO,
  todayISO
} from '../utils/dates';

interface PersonalViewProps {
  profile: UserProfile;
  person: Person | undefined;
  tasks: Task[];
  leaves: Leave[];
  events: ScheduleEvent[];
  duties: Duty[];
  phoneSettings: PhoneDutySettings;
  phoneAssignments: PhoneShiftAssignment[];
  onSelectTask: (t: Task) => void;
  onSelectLeave: (l: Leave) => void;
  onSelectEvent: (e: ScheduleEvent) => void;
}

export const PersonalView: React.FC<PersonalViewProps> = ({
  profile,
  person,
  tasks,
  leaves,
  events,
  duties,
  phoneSettings,
  phoneAssignments,
  onSelectTask,
  onSelectLeave,
  onSelectEvent
}) => {
  const [weekAnchor, setWeekAnchor] = useState(todayISO());
  const myId = profile.personId;

  const myTasks = useMemo(
    () => tasks.filter((t) => t.responsibleId === myId),
    [tasks, myId]
  );

  const pendingApprovalTasks = useMemo(
    () => myTasks.filter((t) => t.status === 'pending_approval'),
    [myTasks]
  );

  const activeTasks = useMemo(
    () => myTasks.filter((t) => t.status !== 'completed'),
    [myTasks]
  );

  const myLeaves = useMemo(
    () =>
      leaves
        .filter((l) => l.personId === myId)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [leaves, myId]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeekISO(weekAnchor);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  }, [weekAnchor]);

  const myUpcomingPhoneShifts = useMemo(() => {
    const today = todayISO();
    const list: Array<{
      date: string;
      shiftLabel: string;
      startTime: string;
      endTime: string;
      isRecurring?: boolean;
    }> = [];
    for (let i = 0; i < 14; i++) {
      const d = addDaysISO(today, i);
      const slots = resolvePhoneSlotsForDate(d, phoneSettings, phoneAssignments);
      for (const s of slots) {
        if (s.personId && s.personId === myId) {
          list.push({
            date: d,
            shiftLabel: s.shiftLabel,
            startTime: s.startTime,
            endTime: s.endTime,
            isRecurring: s.isRecurring
          });
        }
      }
    }
    return list;
  }, [myId, phoneSettings, phoneAssignments]);

  const activityHistory = useMemo(() => {
    const entries: Array<{ id: string; title: string; text: string; actor: string; at: string }> = [];
    for (const t of myTasks) {
      for (const a of t.audit || []) {
        entries.push({
          id: `${t.id}-${a.id}`,
          title: `משימה: ${t.title}`,
          text: a.text,
          actor: a.actor,
          at: a.at
        });
      }
    }
    for (const l of myLeaves) {
      for (const a of l.audit || []) {
        entries.push({
          id: `${l.id}-${a.id}`,
          title: `נוכחות (${l.type})`,
          text: a.text,
          actor: a.actor,
          at: a.at
        });
      }
    }
    return entries.slice(-15).reverse();
  }, [myTasks, myLeaves]);

  const displayName = person?.name || profile.displayName;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-l from-[#7047D7] to-[#5B35BC] text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white/80">האזור האישי שלי</div>
            <h1 className="text-xl font-black truncate">{displayName}</h1>
            <div className="text-xs text-white/85 mt-0.5">
              {profile.role === 'commander'
                ? 'מפקד/ת ביחידה'
                : person?.category === 'reserve'
                ? 'משרת/ת מילואים'
                : 'חייל/ת ביחידה'}
            </div>
          </div>
        </div>
        {!myId && (
          <span className="text-[10px] bg-amber-300 text-slate-900 font-extrabold px-2.5 py-1 rounded-xl shrink-0">
            ממתין לשיוך אישי
          </span>
        )}
      </div>

      {pendingApprovalTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <div className="font-black text-xs text-amber-900">
                {pendingApprovalTasks.length} משימות ממתינות לאישור מפקד
              </div>
              <div className="text-[11px] text-amber-700">
                הדיווח נשלח וממתין לבדיקה ואישור סופי
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
          <div className="text-2xl font-black text-[#7047D7]">{activeTasks.length}</div>
          <div className="text-[11px] font-bold text-slate-500 mt-0.5">משימות פעילות</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
          <div className="text-2xl font-black text-amber-600">{pendingApprovalTasks.length}</div>
          <div className="text-[11px] font-bold text-slate-500 mt-0.5">ממתינות לאישור</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
          <div className="text-2xl font-black text-emerald-600">{myUpcomingPhoneShifts.length}</div>
          <div className="text-[11px] font-bold text-slate-500 mt-0.5">כוננויות קרובות</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#7047D7]" />
            המשימות האישיות שלי
          </h2>
          <span className="text-xs font-bold text-slate-400">{myTasks.length} סה״כ</span>
        </div>

        {myTasks.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">אין משימות המשויכות אליך</div>
        ) : (
          <div className="space-y-2">
            {myTasks.map((t) => {
              const statusBadge =
                t.status === 'completed'
                  ? { label: 'הושלמה', cls: 'bg-[#DDF5E3] text-[#27824A]' }
                  : t.status === 'pending_approval'
                  ? { label: 'ממתינה לאישור מפקד', cls: 'bg-amber-100 text-amber-800' }
                  : t.status === 'in_progress'
                  ? { label: 'בביצוע', cls: 'bg-sky-100 text-sky-800' }
                  : { label: 'פתוחה', cls: 'bg-purple-50 text-[#7047D7]' };

              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="w-full bg-slate-50 hover:bg-purple-50/50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 text-right transition"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-800 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.kind === 'ongoing' ? 'משימה שוטפת' : `יעד: ${fmtDate(t.dueDate)}`}
                    </div>
                    {t.rejectionReason && t.status !== 'completed' && (
                      <div className="text-[11px] text-rose-600 font-bold mt-1">
                        הוחזר לתיקון: {t.rejectionReason}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl shrink-0 ${statusBadge.cls}`}
                  >
                    {statusBadge.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#7047D7]" />
            כוננויות הטלפון שלי (שבועיים קרובים)
          </h2>
        </div>

        {myUpcomingPhoneShifts.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">אין כוננויות טלפון קרובות</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myUpcomingPhoneShifts.map((s, idx) => (
              <div
                key={`${s.date}-${s.shiftLabel}-${idx}`}
                className="p-3 rounded-2xl bg-[#F7F3FF] border border-[#E5D8FF] flex items-center justify-between"
              >
                <div>
                  <div className="font-black text-xs text-slate-800">
                    {dateFromISO(s.date).toLocaleDateString('he-IL', { weekday: 'long' })} •{' '}
                    {fmtShortDate(s.date)}
                  </div>
                  <div className="text-xs font-bold text-[#7047D7] mt-0.5">
                    משמרת {s.shiftLabel} ({s.startTime}–{s.endTime})
                  </div>
                </div>
                {s.isRecurring && (
                  <span className="text-[10px] font-bold bg-white text-[#7047D7] px-2 py-0.5 rounded-lg">
                    חוזרת
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#7047D7]" />
            הלוח השבועי האישי שלי
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekAnchor(addDaysISO(weekAnchor, -7))}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border text-[11px] font-bold"
            >
              קודם
            </button>
            <button
              onClick={() => setWeekAnchor(todayISO())}
              className="px-2.5 py-1 rounded-lg bg-[#F6F0FF] text-[#7047D7] text-[11px] font-extrabold"
            >
              השבוע
            </button>
            <button
              onClick={() => setWeekAnchor(addDaysISO(weekAnchor, 7))}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border text-[11px] font-bold"
            >
              הבא
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {weekDays.map((day) => {
            const dayLeaves = myLeaves.filter((l) => leaveOccursOn(l, day));
            const dayPhones = resolvePhoneSlotsForDate(day, phoneSettings, phoneAssignments).filter(
              (s) => s.personId === myId
            );
            const dayEvents = events.filter(
              (e) =>
                eventOccursOn(e, day) &&
                (e.isUnitWide === true || (Boolean(myId) && (e.personIds || []).includes(myId)))
            );
            const dayDuties = duties.filter(
              (d) => d.active && d.personId === myId && d.startDate <= day && d.endDate >= day
            );

            const hasItems =
              dayLeaves.length > 0 ||
              dayPhones.length > 0 ||
              dayEvents.length > 0 ||
              dayDuties.length > 0;

            return (
              <div
                key={day}
                className={`p-3 rounded-2xl border ${
                  day === todayISO()
                    ? 'bg-[#FAF7FF] border-[#D8C5FF]'
                    : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs">
                    {dateFromISO(day).toLocaleDateString('he-IL', { weekday: 'long' })}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">{fmtShortDate(day)}</span>
                </div>

                {!hasItems ? (
                  <div className="text-[11px] text-slate-300">יום שגרה רגיל</div>
                ) : (
                  <div className="space-y-1">
                    {dayLeaves.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => onSelectLeave(l)}
                        className="text-xs font-bold bg-[#E0F5E5] text-[#277B47] px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        נוכחות: {l.type}
                        {l.type === 'הפניה' && l.referralTime ? ` • שעה ${l.referralTime}` : ''}
                      </div>
                    ))}
                    {dayPhones.map((p) => (
                      <div
                        key={p.slotKey}
                        className="text-xs font-bold bg-[#EEE1FF] text-[#7047D7] px-2.5 py-1.5 rounded-xl"
                      >
                        כונן טלפון ({p.shiftLabel}): {p.startTime}–{p.endTime}
                      </div>
                    ))}
                    {dayDuties.map((d) => (
                      <div
                        key={d.id}
                        className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1.5 rounded-xl"
                      >
                        {d.type}
                        {d.startTime ? ` (${d.startTime}–${d.endTime || ''})` : ''}
                      </div>
                    ))}
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => onSelectEvent(e)}
                        className="text-xs font-bold bg-sky-50 text-sky-800 px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        {e.time}–{e.endTime} • {e.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
        <h2 className="font-black text-sm flex items-center gap-2">
          <Palmtree className="w-4 h-4 text-[#277B47]" />
          הנוכחות והיסטוריית ההיעדרויות שלי
        </h2>

        {myLeaves.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">אין דיווחי נוכחות רשומים</div>
        ) : (
          <div className="space-y-2">
            {myLeaves.map((l) => {
              const isPast =
                l.status === 'cancelled' ||
                ((l.repeatFrequency || 'none') === 'none' && l.endDate < todayISO()) ||
                Boolean(l.repeatUntil && l.repeatUntil < todayISO());

              return (
                <button
                  key={l.id}
                  onClick={() => onSelectLeave(l)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-right ${
                    l.status === 'cancelled'
                      ? 'bg-slate-50 border-slate-200 opacity-65'
                      : isPast
                      ? 'bg-slate-50/80 border-slate-100'
                      : 'bg-[#F3FCF5] border-[#D3EED9]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">{l.type}</span>
                      {l.type === 'הפניה' && l.referralTime && (
                        <span className="text-[11px] font-black bg-purple-100 text-[#7047D7] px-2 py-0.5 rounded-lg">
                          שעה {l.referralTime}
                        </span>
                      )}
                      {l.repeatFrequency && l.repeatFrequency !== 'none' && (
                        <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-lg text-slate-600">
                          {repeatLabel(l.repeatFrequency)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {fmtDate(l.startDate)}
                      {l.endDate !== l.startDate ? ` – ${fmtDate(l.endDate)}` : ''}
                      {l.repeatUntil ? ` (עד ${fmtDate(l.repeatUntil)})` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl ${
                      l.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-700'
                        : isPast
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-[#E0F5E5] text-[#277B47]'
                    }`}
                  >
                    {l.status === 'cancelled' ? 'בוטל' : isPast ? 'הסתיים' : 'פעיל'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
        <h2 className="font-black text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-[#7047D7]" />
          היסטוריית פעילות אישית
        </h2>

        {activityHistory.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-3">אין פעילות מתועדת עדיין</div>
        ) : (
          <div className="space-y-2">
            {activityHistory.map((item) => (
              <div key={item.id} className="text-xs border-r-2 border-purple-200 pr-3 py-0.5">
                <div className="font-extrabold text-slate-700">{item.title}</div>
                <div className="text-slate-600">
                  <b>{item.actor}</b> {item.text}
                </div>
                <div className="text-[10px] text-slate-400">{item.at}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
