import React, { useEffect, useState } from 'react';
import {
  Home, CheckSquare, Plus, Calendar, CalendarDays, Bell,
  ChevronRight, ChevronLeft, Users, Crown, AlertCircle, Palmtree, X, Check,
  Pencil, Sparkles, UserRound, MessageCircle, Trash2, Save,
  Clock3, ShieldCheck, Send, RotateCcw, DatabaseBackup, Repeat, UserCheck
} from 'lucide-react';
import {
  Category,
  Comment,
  Audit,
  Duty,
  DutyType,
  Leave,
  LeaveType,
  ManagementMessage,
  NotificationItem,
  Person,
  PhoneDutySettings,
  PhoneShiftAssignment,
  RepeatFrequency,
  ScheduleEvent,
  Tab,
  Task,
  TaskKind,
  TaskStatus,
  UserProfile,
  UserRole
} from './types';
import {
  addDaysISO,
  addOneHour,
  dateFromISO,
  DEFAULT_PHONE_DUTY_SETTINGS,
  eventOccursOn,
  fmtDate,
  getInitials,
  leaveOccursOn,
  nowText,
  repeatLabel,
  resolvePhoneSlotsForDate,
  startOfWeekISO,
  todayISO,
  uid
} from './utils/dates';
import {
  auth,
  collection,
  createSafetyBackup,
  db,
  deleteEventDoc,
  deletePhoneShiftDoc,
  deleteTaskDoc,
  doc,
  migrateLegacyAppStateSafely,
  onAuthStateChanged,
  onSnapshot,
  query,
  resolveOrBootstrapUserProfile,
  saveBannerMessageDoc,
  saveDutyDoc,
  saveEventDoc,
  saveLeaveDoc,
  saveManagementMessageDoc,
  saveNotificationDoc,
  savePersonDoc,
  savePhoneDutySettingsDoc,
  savePhoneShiftDoc,
  saveTaskDoc,
  saveUserProfileDoc,
  setupPushNotifications,
  signInWithEmailAndPassword,
  signOut,
  triggerPushEvent,
  where,
  type User
} from './services/firebase';
import { PhoneDutyHomeCard } from './components/PhoneDutySection';
import { PersonalView } from './components/PersonalView';

function InitialBadge({ name, size = 'md', highlight = false }: { name: string; size?: 'sm' | 'md' | 'lg'; highlight?: boolean }) {
  const dims =
    size === 'sm'
      ? 'w-8 h-8 text-xs rounded-xl'
      : size === 'lg'
      ? 'w-16 h-16 text-xl rounded-3xl'
      : 'w-10 h-10 text-sm rounded-2xl';
  return (
    <div
      className={`${dims} ${
        highlight
          ? 'bg-[#7047D7] text-white'
          : 'bg-[#EEE1FF] text-[#7047D7]'
      } font-black flex items-center justify-center shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
}

function AppCore() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [syncReady, setSyncReady] = useState(false);

  const [pushStatus, setPushStatus] = useState<'idle' | 'working' | 'enabled' | 'unsupported' | 'denied' | 'error'>('idle');
  const [pushError, setPushError] = useState('');
  const [pushStage, setPushStage] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'pending_approval' | 'ongoing' | 'overdue' | 'done'>('all');
  const [leaveTab, setLeaveTab] = useState<Category>('soldier');
  const [leaveHistoryFilter, setLeaveHistoryFilter] = useState<'all' | 'active' | 'ended'>('all');

  const [people, setPeople] = useState<Person[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [managementMessages, setManagementMessages] = useState<ManagementMessage[]>([]);
  const [phoneSettings, setPhoneSettings] = useState<PhoneDutySettings>(DEFAULT_PHONE_DUTY_SETTINGS);
  const [phoneAssignments, setPhoneAssignments] = useState<PhoneShiftAssignment[]>([]);
  const [bannerMessage, setBannerMessage] = useState('יום טוב ומנצח! ✨');

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const [quickAdd, setQuickAdd] = useState(false);
  const [formType, setFormType] = useState<'task' | 'leave' | 'event' | 'person' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [scheduleView, setScheduleView] = useState<'day' | 'week'>('day');
  const [leaveSelectedDay, setLeaveSelectedDay] = useState(todayISO());
  const [leaveMonth, setLeaveMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [tempBannerInput, setTempBannerInput] = useState('');

  const [managementChatOpen, setManagementChatOpen] = useState(false);
  const [managementText, setManagementText] = useState('');

  const [dutyFormOpen, setDutyFormOpen] = useState(false);
  const [dutyPersonId, setDutyPersonId] = useState('');
  const [dutyType, setDutyType] = useState<DutyType>('תורנות');
  const [dutyStartDate, setDutyStartDate] = useState(todayISO());
  const [dutyEndDate, setDutyEndDate] = useState(todayISO());
  const [dutyStartTime, setDutyStartTime] = useState('');
  const [dutyEndTime, setDutyEndTime] = useState('');
  const [dutyNote, setDutyNote] = useState('');

  const [adminToolsOpen, setAdminToolsOpen] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [legacyNeedsMigration, setLegacyNeedsMigration] = useState(false);

  const isCommander = userProfile?.role === 'commander';
  const isSergeant = userProfile?.role === 'sergeant';
  const canViewAllPresence = isCommander || isSergeant;
  const canCreateTasks = isCommander || isSergeant;
  const myPersonId = userProfile?.personId || '';
  const currentUserName = userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'משתמש/ת';

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const prof = await resolveOrBootstrapUserProfile(user);
          setUserProfile(prof);
        } catch (err) {
          console.error('Failed to resolve user profile', err);
          setLoginError('שגיאה בטעינת פרופיל המשתמש.');
        }
      } else {
        setUserProfile(null);
      }
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authUser || !userProfile || !userProfile.active || ((userProfile.role === 'soldier' || userProfile.role === 'sergeant') && !userProfile.personId)) {
      setSyncReady(false);
      return;
    }

    const safetyTimer = window.setTimeout(() => setSyncReady(true), 4500);
    const unsubs: Array<() => void> = [];
    const roleIsCommander = userProfile.role === 'commander';
    const roleIsSergeant = userProfile.role === 'sergeant';
    const personId = userProfile.personId;

    unsubs.push(
      onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      })
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'people'),
        (snap) => {
          const list = snap.docs.map((d) => {
            const raw = { ...(d.data() as Person), id: d.id };
            if (roleIsCommander || d.id === personId) return raw;
            return {
              id: raw.id,
              name: raw.name,
              category: raw.category,
              role: raw.role,
              notes: '',
              avatarUrl: raw.avatarUrl,
              active: raw.active
            } as Person;
          });
          setPeople(list);
          setSyncReady(true);
        },
        (err) => {
          console.error('People listener error', err);
          setSyncReady(true);
        }
      )
    );

    if (roleIsCommander) {
      unsubs.push(
        onSnapshot(
          collection(db, 'tasks'),
          (snap) => {
            const list = snap.docs.map((d) => ({ ...(d.data() as Task), id: d.id }));
            setTasks(list);
          },
          (err) => console.error('Tasks listener error', err)
        )
      );
    } else if (!roleIsSergeant) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'tasks'), where('responsibleId', '==', personId || '__unassigned__')),
          (snap) => {
            const list = snap.docs.map((d) => ({ ...(d.data() as Task), id: d.id }));
            setTasks(list);
          },
          (err) => console.error('Tasks listener error', err)
        )
      );
    }

    const leavesQuery = (roleIsCommander || roleIsSergeant)
      ? collection(db, 'leaves')
      : query(collection(db, 'leaves'), where('personId', '==', personId || '__unassigned__'));

    unsubs.push(
      onSnapshot(
        leavesQuery,
        (snap) => {
          const list = snap.docs.map((d) => ({ ...(d.data() as Leave), id: d.id }));
          setLeaves(list);
        },
        (err) => console.error('Leaves listener error', err)
      )
    );

    const eventsQuery = roleIsCommander
      ? collection(db, 'events')
      : query(collection(db, 'events'), where('personIds', 'array-contains', personId || '__unassigned__'));

    unsubs.push(
      onSnapshot(
        eventsQuery,
        (snap) => {
          const list = snap.docs.map((d) => ({ ...(d.data() as ScheduleEvent), id: d.id }));
          setEvents(list);
        },
        (err) => console.error('Events listener error', err)
      )
    );

    const dutiesQuery = roleIsCommander
      ? collection(db, 'duties')
      : query(collection(db, 'duties'), where('personId', '==', personId || '__unassigned__'));

    unsubs.push(
      onSnapshot(
        dutiesQuery,
        (snap) => {
          const list = snap.docs.map((d) => ({ ...(d.data() as Duty), id: d.id }));
          setDuties(list);
        },
        (err) => console.error('Duties listener error', err)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'phoneDuty'),
        (snap) => {
          if (snap.exists()) {
            setPhoneSettings(snap.data() as PhoneDutySettings);
          } else {
            setPhoneSettings(DEFAULT_PHONE_DUTY_SETTINGS);
          }
        },
        (err) => console.error('PhoneDuty settings error', err)
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'phoneShifts'),
        (snap) => {
          const list = snap.docs.map((d) => ({ ...(d.data() as PhoneShiftAssignment), id: d.id }));
          setPhoneAssignments(list);
        },
        (err) => console.error('PhoneShifts error', err)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'general'),
        (snap) => {
          if (snap.exists() && snap.data()?.bannerMessage) {
            setBannerMessage(snap.data().bannerMessage);
          }
        },
        () => {}
      )
    );

    if (roleIsCommander) {
      unsubs.push(
        onSnapshot(
          collection(db, 'notifications'),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as NotificationItem), id: d.id }))
              .sort((a, b) => b.id.localeCompare(a.id));
            setNotifications(list);
          },
          (err) => console.error('Notifications error', err)
        )
      );
    } else {
      let personalNotifs: NotificationItem[] = [];
      let generalNotifs: NotificationItem[] = [];
      const syncMergedNotifs = () => {
        const map = new Map<string, NotificationItem>();
        [...personalNotifs, ...generalNotifs].forEach((n) => map.set(n.id, n));
        setNotifications(Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id)));
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'notifications'), where('targetPersonId', '==', personId || '__unassigned__')),
          (snap) => {
            personalNotifs = snap.docs.map((d) => ({ ...(d.data() as NotificationItem), id: d.id }));
            syncMergedNotifs();
          },
          (err) => console.error('Personal notifications error', err)
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'notifications'),
            where('targetPersonId', '==', 'all'),
            where('target', 'in', ['today', 'leaves', 'schedule', 'people', 'personal'])
          ),
          (snap) => {
            generalNotifs = snap.docs.map((d) => ({ ...(d.data() as NotificationItem), id: d.id }));
            syncMergedNotifs();
          },
          (err) => console.error('General notifications error', err)
        )
      );
    }

    if (roleIsCommander) {
      unsubs.push(
        onSnapshot(
          collection(db, 'managementMessages'),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as ManagementMessage), id: d.id }))
              .sort((a, b) => a.id.localeCompare(b.id));
            setManagementMessages(list);
          },
          (err) => console.error('Management chat error', err)
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            setUsersList(snap.docs.map((d) => d.data() as UserProfile));
          },
          () => {}
        )
      );

      unsubs.push(
        onSnapshot(
          doc(db, 'appState', 'main'),
          (snap) => {
            if (snap.exists()) {
              const d: any = snap.data();
              const hasLegacyData =
                (d.people?.length || 0) > 0 ||
                (d.tasks?.length || 0) > 0 ||
                (d.leaves?.length || 0) > 0 ||
                (d.events?.length || 0) > 0;
              setLegacyNeedsMigration(hasLegacyData);
            } else {
              setLegacyNeedsMigration(false);
            }
          },
          () => {}
        )
      );
    }

    return () => {
      window.clearTimeout(safetyTimer);
      unsubs.forEach((fn) => fn());
    };
  }, [authUser, userProfile?.uid, userProfile?.role, userProfile?.personId]);


  useEffect(() => {
    if (!authUser || !userProfile || !userProfile.active || userProfile.role !== 'sergeant') {
      return;
    }
    const trueSoldierIds = Array.from(
      new Set(
        people
          .filter(
            (p) =>
              (p.category === 'soldier' || p.category === 'reserve') &&
              (p.role ?? 'soldier') === 'soldier'
          )
          .map((p) => p.id)
      )
    );
    if (trueSoldierIds.length === 0) {
      setTasks([]);
      return;
    }
    const chunks: string[][] = [];
    for (let i = 0; i < trueSoldierIds.length; i += 30) {
      chunks.push(trueSoldierIds.slice(i, i + 30));
    }
    const chunkMap = new Map<number, Task[]>();
    const unsubs = chunks.map((chunk, idx) =>
      onSnapshot(
        query(collection(db, 'tasks'), where('responsibleId', 'in', chunk)),
        (snap) => {
          chunkMap.set(
            idx,
            snap.docs.map((d) => ({ ...(d.data() as Task), id: d.id }))
          );
          const merged: Task[] = [];
          chunkMap.forEach((arr) => merged.push(...arr));
          setTasks(merged);
        },
        (err) => console.error('Sergeant tasks listener error', err)
      )
    );
    return () => unsubs.forEach((fn) => fn());
  }, [authUser, userProfile?.uid, userProfile?.role, userProfile?.active, people]);

  const enablePush = async () => {
    if (!authUser) return;
    setPushStatus('working');
    setPushError('');
    try {
      const res = await setupPushNotifications(authUser, currentUserName, setPushStage);
      setPushStage('');
      setPushStatus(res);
    } catch (err) {
      console.error('Push setup failed', err);
      setPushError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      setPushStatus('error');
    }
  };

  const doLogin = async () => {
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch {
      setLoginError('האימייל או הסיסמה לא נכונים.');
    }
  };

  if (!authReady) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F6F2] flex items-center justify-center font-sans">
        <div className="font-black text-[#7047D7]">טוען את היחידה שלנו…</div>
      </div>
    );
  }

  if (!authUser || !userProfile) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-5 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#7047D7]">
            <Sparkles className="w-4 h-4" />
            היחידה שלנו
          </div>
          <h1 className="text-2xl font-black mt-1 mb-1">כניסה למערכת</h1>
          <p className="text-xs text-slate-400 mb-5">הזדהות אישית למפקדים וחיילים</p>
          <div className="space-y-3">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="אימייל"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doLogin();
              }}
              placeholder="סיסמה"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
            />
            {loginError && <div className="text-xs text-rose-500 font-bold">{loginError}</div>}
            <button
              onClick={doLogin}
              className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-black shadow-md active:scale-[.99]"
            >
              כניסה
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authUser && userProfile && (!userProfile.active || ((userProfile.role === 'soldier' || userProfile.role === 'sergeant') && !userProfile.personId))) {
    return <div dir="rtl" className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-5"><div className="max-w-sm bg-white p-6 rounded-3xl text-center"><h1 className="text-xl font-black mb-3">ממתינים לאישור גישה</h1><p className="text-sm mb-4">המשתמש נרשם בהצלחה. מפקד/ת צריכים לאשר ולשייך אותך לאדם ביחידה.</p><button className="bg-[#7047D7] text-white rounded-xl px-6 py-3" onClick={()=>signOut(auth)}>יציאה</button></div></div>;
  }

  if (!syncReady) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F6F2] flex items-center justify-center font-sans">
        <div className="font-black text-[#7047D7]">מסנכרן נתונים…</div>
      </div>
    );
  }

  const notify = (text: string, target: Tab, entityId?: string, targetPersonId = 'all') => {
    const item: NotificationItem = {
      id: uid(),
      text,
      at: nowText(),
      read: false,
      target,
      entityId,
      targetPersonId
    };
    saveNotificationDoc(item).catch((e) => console.error('Notification write failed', e));
    if (authUser) {
      triggerPushEvent(text, target, entityId, authUser.uid, currentUserName).catch((err) =>
        console.error('Push event write failed', err)
      );
    }
  };

  const today = todayISO();
  const currentLeaves = leaves.filter((l) => leaveOccursOn(l, today));
  const soldierOut = currentLeaves.filter((l) => l.category === 'soldier');
  const commanderOut = currentLeaves.filter((l) => l.category === 'commander');

  const trueSoldierIds = new Set(
    people
      .filter(
        (p) =>
          (p.category === 'soldier' || p.category === 'reserve') &&
          (p.role ?? 'soldier') === 'soldier'
      )
      .map((p) => p.id)
  );

  const visibleTasks = isCommander
    ? tasks
    : isSergeant
    ? tasks.filter((t) => trueSoldierIds.has(t.responsibleId))
    : tasks.filter((t) => Boolean(myPersonId) && t.responsibleId === myPersonId);

  const overdueTasks = visibleTasks.filter(
    (t) => t.kind !== 'ongoing' && (t.status === 'overdue' || (t.status !== 'completed' && t.dueDate < today))
  );
  const pendingApprovalTasks = visibleTasks.filter((t) => t.status === 'pending_approval');
  const openTasks = visibleTasks.filter((t) => t.status !== 'completed');

  const filteredTasks = visibleTasks.filter((t) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'done') return t.status === 'completed';
    if (taskFilter === 'pending_approval') return t.status === 'pending_approval';
    if (taskFilter === 'ongoing') return t.kind === 'ongoing';
    if (taskFilter === 'overdue') return overdueTasks.some((x) => x.id === t.id);
    return (t.status === 'open' || t.status === 'in_progress' || t.status === 'pending_approval') && t.kind !== 'ongoing';
  });

  const visibleNotifications = isCommander
    ? notifications
    : notifications.filter(
        (n) =>
          (Boolean(myPersonId) && n.targetPersonId === myPersonId) ||
          (n.targetPersonId === 'all' && n.target !== 'tasks')
      );

  const unread = visibleNotifications.filter((n) => !n.read).length;
  const visibleEvents = isCommander ? events : events.filter((e) => Boolean(myPersonId) && (e.personIds || []).includes(myPersonId));
  const todayEvents = visibleEvents
    .filter((e) => eventOccursOn(e, today))
    .sort((a, b) => a.time.localeCompare(b.time));

  const selectedDayLeaves = leaves.filter(
    (l) => (canViewAllPresence ? l.category === leaveTab : l.personId === myPersonId) && leaveOccursOn(l, leaveSelectedDay)
  );

  const visibleLeavesForHistory = leaves
    .filter((l) => (canViewAllPresence ? l.category === leaveTab : l.personId === myPersonId))
    .filter((l) => {
      const isEnded =
        l.status === 'cancelled' ||
        ((l.repeatFrequency || 'none') === 'none' && l.endDate < today) ||
        Boolean(l.repeatUntil && l.repeatUntil < today);
      if (leaveHistoryFilter === 'active') return !isEnded;
      if (leaveHistoryFilter === 'ended') return isEnded;
      return true;
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const goTasks = (filter: typeof taskFilter) => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  const openBanner = () => {
    if (!isCommander) return;
    setTempBannerInput(bannerMessage);
    setIsEditingBanner(true);
  };

  const saveBanner = async () => {
    if (!isCommander) return;
    if (tempBannerInput.trim()) {
      await saveBannerMessageDoc(tempBannerInput.trim(), currentUserName);
      notify(`${currentUserName} עדכנ/ה את הודעת הבית`, 'today');
    }
    setIsEditingBanner(false);
  };

  const openForm = (type: 'task' | 'leave' | 'event' | 'person', id?: string) => {
    if (!isCommander && !(isSergeant && type === 'task' && !id)) return;
    setFormType(type);
    setEditingId(id || null);
    setQuickAdd(false);
  };

  const closeDetails = () => {
    setSelectedTask(null);
    setSelectedLeave(null);
    setSelectedEvent(null);
    setSelectedPerson(null);
    setComment('');
    setRejectModalOpen(false);
    setRejectReason('');
  };

  const updateTaskLifecycle = async (
    task: Task,
    nextStatus: TaskStatus,
    auditText: string,
    extraPatch: Partial<Task> = {}
  ) => {
    const at = nowText();
    const auditEntry: Audit = {
      id: uid(),
      actor: currentUserName,
      actorUid: authUser.uid,
      action: nextStatus,
      text: auditText,
      at
    };
    const updated: Task = {
      ...task,
      ...extraPatch,
      status: nextStatus,
      updatedBy: currentUserName,
      updatedAt: at,
      audit: [...(task.audit || []), auditEntry]
    };
    await saveTaskDoc(updated);
    setSelectedTask(updated);
  };

  const handleSoldierStartTask = async (task: Task) => {
    if (userProfile?.role !== 'soldier' || task.responsibleId !== myPersonId) return;
    await updateTaskLifecycle(task, 'in_progress', 'החל/ה בביצוע המשימה');
    notify(`${currentUserName} החל/ה בביצוע: "${task.title}"`, 'tasks', task.id, myPersonId);
  };

  const handleSoldierSubmitForApproval = async (task: Task) => {
    if (userProfile?.role !== 'soldier' || task.responsibleId !== myPersonId) return;
    await updateTaskLifecycle(task, 'pending_approval', 'סימנ/ה שסיים/ה לבצע ושלח/ה לאישור מפקד', {
      rejectionReason: ''
    });
    notify(`${currentUserName} סיים/ה משימה וממתינ/ה לאישור מפקד: "${task.title}"`, 'tasks', task.id, myPersonId);
  };

  const handleCommanderApproveTask = async (task: Task) => {
    if (!isCommander) return;
    const at = nowText();
    await updateTaskLifecycle(task, 'completed', 'אישר/ה את ביצוע המשימה — הושלמה סופית', {
      approvedBy: currentUserName,
      approvedAt: at,
      completedAt: at,
      rejectionReason: ''
    });
    notify(
      `${currentUserName} אישר/ה את השלמת המשימה: "${task.title}"`,
      'tasks',
      task.id,
      task.responsibleId || 'commander'
    );
  };

  const handleCommanderReturnTask = async (task: Task) => {
    if (!isCommander) return;
    const reason = rejectReason.trim() || 'נדרש תיקון / השלמה';
    await updateTaskLifecycle(task, 'in_progress', `החזיר/ה את המשימה לתיקון: ${reason}`, {
      rejectionReason: reason
    });
    notify(
      `${currentUserName} החזיר/ה את המשימה "${task.title}" לתיקון`,
      'tasks',
      task.id,
      task.responsibleId || 'commander'
    );
    setRejectModalOpen(false);
    setRejectReason('');
  };

  const addComment = async (kind: 'task' | 'leave' | 'event', id: string) => {
    const text = comment.trim();
    if (!text) return;
    const c: Comment = { id: uid(), author: currentUserName, authorUid: authUser.uid, text, at: nowText() };
    if (kind === 'task' && selectedTask && (isCommander || (userProfile?.role === 'soldier' && selectedTask.responsibleId === myPersonId))) {
      const updated = { ...selectedTask, comments: [...(selectedTask.comments || []), c] };
      await saveTaskDoc(updated);
      setSelectedTask(updated);
      notify(`${currentUserName} הגיב/ה במשימה`, 'tasks', id, selectedTask.responsibleId || 'all');
    }
    if (kind === 'leave' && selectedLeave && isCommander) {
      const updated = { ...selectedLeave, comments: [...(selectedLeave.comments || []), c] };
      await saveLeaveDoc(updated);
      setSelectedLeave(updated);
      notify(`${currentUserName} הגיב/ה בדיווח נוכחות`, 'leaves', id, selectedLeave.personId);
    }
    if (kind === 'event' && selectedEvent && isCommander) {
      const updated = { ...selectedEvent, comments: [...(selectedEvent.comments || []), c] };
      await saveEventDoc(updated);
      setSelectedEvent(updated);
      notify(`${currentUserName} הגיב/ה באירוע לו״ז`, 'schedule', id);
    }
    setComment('');
  };

  const deleteEntity = async (kind: 'task' | 'leave' | 'event', id: string) => {
    if (!isCommander) return;
    if (kind === 'leave') {
      if (!confirm('לבטל את דיווח הנוכחות? הדיווח יישמר בהיסטוריית הנוכחות כבוטל.')) return;
      const target = leaves.find((l) => l.id === id);
      if (target) {
        const at = nowText();
        const updated: Leave = {
          ...target,
          status: 'cancelled',
          updatedBy: currentUserName,
          updatedAt: at,
          audit: [
            ...(target.audit || []),
            { id: uid(), actor: currentUserName, text: 'ביטל/ה את דיווח הנוכחות (נשמר בהיסטוריה)', at }
          ]
        };
        await saveLeaveDoc(updated);
        notify(`${currentUserName} ביטל/ה דיווח נוכחות עבור ${target.name}`, 'leaves', id, target.personId);
      }
      closeDetails();
      return;
    }

    if (!confirm('למחוק את הפריט?')) return;
    if (kind === 'task') {
      await deleteTaskDoc(id);
      notify(`${currentUserName} מחק/ה משימה`, 'tasks');
    }
    if (kind === 'event') {
      await deleteEventDoc(id);
      notify(`${currentUserName} מחק/ה אירוע לו״ז`, 'schedule');
    }
    closeDetails();
  };

  const addDuty = async () => {
    if (!isCommander) return;
    const person = people.find((p) => p.id === dutyPersonId) || selectedPerson;
    if (!person) return alert('צריך לבחור אדם');
    const at = nowText();
    const d: Duty = {
      id: uid(),
      personId: person.id,
      personName: person.name,
      type: dutyType,
      startDate: dutyStartDate,
      endDate: dutyEndDate,
      startTime: dutyStartTime,
      endTime: dutyEndTime,
      note: dutyNote,
      createdBy: currentUserName,
      createdAt: at,
      updatedBy: currentUserName,
      updatedAt: at,
      active: true
    };
    await saveDutyDoc(d);
    notify(`${currentUserName} הוסיפ/ה ${dutyType} ל${person.name}`, 'people', person.id, person.id);
    setDutyFormOpen(false);
    setDutyPersonId('');
    setDutyType('תורנות');
    setDutyStartDate(todayISO());
    setDutyEndDate(todayISO());
    setDutyStartTime('');
    setDutyEndTime('');
    setDutyNote('');
  };

  const sendManagementMessage = async () => {
    if (!isCommander) return;
    const text = managementText.trim();
    if (!text) return;
    const msg: ManagementMessage = {
      id: uid(),
      author: currentUserName,
      authorUid: authUser.uid,
      text,
      at: nowText()
    };
    await saveManagementMessageDoc(msg);
    notify(`${currentUserName} כתב/ה בצ׳אט המפקדים: ${text}`, 'today');
    setManagementText('');
  };

  const runSafeBackup = async () => {
    if (!isCommander) return;
    setMigrationBusy(true);
    setMigrationStatus('יוצר גיבוי מלא ב-Firestore…');
    try {
      const res = await createSafetyBackup(currentUserName);
      setMigrationStatus(
        `גיבוי הושלם בהצלחה (${res.backupId}). נשמרו ${res.counts.legacyPeople} אנשי צוות, ${res.counts.legacyTasks} משימות, ${res.counts.legacyLeaves} דיווחי נוכחות.`
      );
    } catch (e: any) {
      setMigrationStatus(`שגיאה בגיבוי: ${e?.message || String(e)}`);
    } finally {
      setMigrationBusy(false);
    }
  };

  const runSafeMigration = async () => {
    if (!isCommander) return;
    if (!confirm('פעולה זו תיצור גיבוי מלא ותעתיק נתונים קיימים מ-appState/main לאוספים המאובטחים ללא מחיקת מידע. להמשיך?')) return;
    setMigrationBusy(true);
    setMigrationStatus('מבצע גיבוי והעברה בטוחה ללא דריסת נתונים…');
    try {
      const res = await migrateLegacyAppStateSafely(currentUserName);
      setMigrationStatus(
        `ההעברה הושלמה בהצלחה! גיבוי: ${res.backupId}. הועברו: ${res.migrated.people} אנשים, ${res.migrated.tasks} משימות, ${res.migrated.leaves} דיווחי נוכחות, ${res.migrated.events} אירועים.`
      );
    } catch (e: any) {
      setMigrationStatus(`שגיאה במיגרציה: ${e?.message || String(e)}`);
    } finally {
      setMigrationBusy(false);
    }
  };

  const myPersonRecord = people.find((p) => p.id === myPersonId);

  return (
    <div className="flex justify-center bg-[#E9E7E3] min-h-screen font-sans antialiased text-slate-800 overflow-x-hidden" dir="rtl">
      <div className="w-full max-w-3xl bg-[#F8F6F2] min-h-screen flex flex-col relative pb-28 shadow-2xl border-x border-slate-200/50">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                isCommander
                  ? 'bg-[#EEE1FF] text-[#7047D7]'
                  : isSergeant
                  ? 'bg-sky-50 text-sky-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isCommander ? 'מפקד/ת' : isSergeant ? 'סמל/ת' : 'חייל/ת'} • {currentUserName}
            </span>
            {isCommander && (
              <button
                onClick={() => setAdminToolsOpen(true)}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  legacyNeedsMigration
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {legacyNeedsMigration ? 'נדרשת העברת נתונים בטוחה' : 'אבטחה וגיבוי'}
              </button>
            )}
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-xl hover:bg-slate-50"
          >
            יציאה
          </button>
        </div>

        <div className="flex-1 px-4 pt-2 pb-6 space-y-4">
          {activeTab === 'today' && (
            <div className="space-y-4">
              <Header
                title="היום ביחידה"
                subtitle={new Date().toLocaleDateString('he-IL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
                onBell={() => setNotificationsOpen(true)}
                unread={unread}
              />

              {pushStatus !== 'enabled' && (
                <div className="space-y-2">
                  <button
                    onClick={enablePush}
                    disabled={pushStatus === 'working'}
                    className="w-full bg-white border border-purple-100 rounded-2xl p-3 flex items-center justify-between shadow-sm text-right"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-purple-50 text-[#7047D7] flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="font-black text-sm">הפעלת התראות לטלפון</div>
                        <div className="text-[11px] text-slate-400">
                          {pushStatus === 'working'
                            ? pushStage || 'מחברת התראות…'
                            : pushStatus === 'denied'
                            ? 'ההרשאה נדחתה — אפשר לאפשר בהגדרות'
                            : pushStatus === 'unsupported'
                            ? 'באייפון: הוסיפי למסך הבית ופתחי משם'
                            : pushStatus === 'error'
                            ? 'הייתה שגיאה — הפירוט מופיע למטה'
                            : 'לקבלת עדכונים גם כשהאתר סגור'}
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                  {pushStatus === 'error' && (
                    <div className="w-full bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 text-right">
                      <div className="font-black text-xs mb-1">שגיאה בהפעלת ההתראות</div>
                      <div className="text-[10px] break-words whitespace-pre-wrap">
                        {pushStage && `שלב: ${pushStage}
`}
                        {pushError}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isCommander && (
                <button
                  onClick={() => setManagementChatOpen(true)}
                  className="w-full bg-gradient-to-l from-[#EEE1FF] to-[#F7EFFF] text-[#7047D7] rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </span>
                    <div className="text-right">
                      <div className="font-black text-sm">צ׳אט מפקדים</div>
                      <div className="text-[11px] opacity-75">
                        {managementMessages.length
                          ? `${managementMessages.length} הודעות`
                          : 'להתייעצויות ועדכונים בינינו'}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                </button>
              )}

              <div
                onClick={openBanner}
                className={`relative h-28 sm:h-32 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center bg-gradient-to-l from-[#5B35BC] via-[#7047D7] to-[#8C68E8] ${
                  isCommander ? 'cursor-pointer active:scale-[.99] transition-transform' : ''
                }`}
              >
                <div className="relative text-center px-4">
                  <h2 className="text-white text-xl sm:text-2xl font-black">{bannerMessage}</h2>
                  {isCommander && (
                    <span className="text-[11px] text-white/80">לחץ לעריכת ההודעה ✎</span>
                  )}
                </div>
                {isCommander && (
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white">
                    <Pencil className="w-3 h-3" />
                  </div>
                )}
              </div>

              <PhoneDutyHomeCard
                isCommander={isCommander}
                canAssignPhoneDuty={isCommander || isSergeant}
                myPersonId={myPersonId}
                currentUserName={currentUserName}
                people={people}
                settings={phoneSettings}
                assignments={phoneAssignments}
                onSaveAssignment={savePhoneShiftDoc}
                onDeleteAssignment={deletePhoneShiftDoc}
                onSaveSettings={savePhoneDutySettingsDoc}
                onNotify={(text, entityId) => { if (isCommander) notify(text, 'today', entityId); }}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {canViewAllPresence && (
                  <>
                    <Stat
                      title="חיילים לא ביחידה"
                      value={soldierOut.length}
                      icon={<Users className="w-4 h-4" />}
                      onClick={() => {
                        setLeaveTab('soldier');
                        setActiveTab('leaves');
                      }}
                    />
                    <Stat
                      title="מפקדים לא ביחידה"
                      value={commanderOut.length}
                      icon={<Crown className="w-4 h-4" />}
                      onClick={() => {
                        setLeaveTab('commander');
                        setActiveTab('leaves');
                      }}
                    />
                  </>
                )}
                <Stat
                  title={canCreateTasks ? 'משימות פתוחות' : 'המשימות הפתוחות שלי'}
                  value={openTasks.length}
                  icon={<CheckSquare className="w-4 h-4" />}
                  onClick={() => goTasks('open')}
                />
                <Stat
                  title="ממתינות לאישור"
                  value={pendingApprovalTasks.length}
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => goTasks('pending_approval')}
                />
                {!canViewAllPresence && (
                  <>
                    <Stat
                      title="משימות באיחור"
                      value={overdueTasks.length}
                      icon={<AlertCircle className="w-4 h-4" />}
                      danger
                      onClick={() => goTasks('overdue')}
                    />
                    <Stat
                      title="האזור האישי שלי"
                      value={1}
                      icon={<UserCheck className="w-4 h-4" />}
                      onClick={() => setActiveTab('personal')}
                    />
                  </>
                )}
              </div>

              <Section
                title="היום בלו״ז"
                action="לכל השבוע"
                onAction={() => {
                  setScheduleView('week');
                  setSelectedDay(todayISO());
                  setActiveTab('schedule');
                }}
              >
                <div className="space-y-2.5">
                  {todayEvents.length ? (
                    todayEvents.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="w-full flex items-center gap-3 text-right p-2 rounded-xl hover:bg-slate-50"
                      >
                        <span className="text-xs font-bold text-slate-400 w-12 shrink-0">{e.time}</span>
                        <span className="w-2 h-2 rounded-full bg-[#7047D7] shrink-0" />
                        <span className="text-xs font-extrabold truncate">{e.title}</span>
                      </button>
                    ))
                  ) : (
                    <Empty text="אין אירועים היום" />
                  )}
                </div>
              </Section>

              <Section
                title={canViewAllPresence ? 'נוכחות היום ביחידה' : 'הנוכחות האישית שלי היום'}
                action="לכל הנוכחות"
                onAction={() => setActiveTab('leaves')}
              >
                {(() => {
                  const activeUnitPeople = people.filter((p) => p.active);
                  const visiblePresencePeople = canViewAllPresence
                    ? activeUnitPeople
                    : activeUnitPeople.filter((p) => p.id === myPersonId);

                  if (visiblePresencePeople.length === 0) {
                    return (
                      <Empty
                        text={
                          currentLeaves.length === 0
                            ? canViewAllPresence
                              ? 'אין אנשי צוות רשומים'
                              : 'את/ה נוכח/ת ביחידה היום'
                            : 'אין נתוני נוכחות להצגה'
                        }
                      />
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {visiblePresencePeople.map((p) => {
                        const activeLeave = currentLeaves.find((l) => l.personId === p.id);
                        const isPresent = !activeLeave;
                        const statusLabel = activeLeave
                          ? `${activeLeave.type}${
                              activeLeave.type === 'הפניה' && activeLeave.referralTime
                                ? ` (${activeLeave.referralTime})`
                                : ''
                            }`
                          : 'נוכח/ת';

                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (activeLeave) {
                                setSelectedLeave(activeLeave);
                              } else if (isCommander) {
                                setSelectedPerson(p);
                              }
                            }}
                            className={`p-3 rounded-2xl flex items-center gap-2.5 text-right border transition ${
                              isPresent
                                ? 'bg-emerald-50/90 border-emerald-200/90 hover:bg-emerald-100/70'
                                : 'bg-rose-50/90 border-rose-200/90 hover:bg-rose-100/70'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 text-xs rounded-xl font-black flex items-center justify-center shrink-0 select-none ${
                                isPresent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {getInitials(p.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs font-extrabold truncate ${
                                  isPresent ? 'text-emerald-950' : 'text-rose-950'
                                }`}
                              >
                                {p.name}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isPresent ? 'bg-emerald-600' : 'bg-rose-600'
                                  }`}
                                />
                                <span
                                  className={`text-[11px] font-extrabold truncate ${
                                    isPresent ? 'text-emerald-700' : 'text-rose-700'
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </Section>
            </div>
          )}

          {activeTab === 'personal' && (
            <PersonalView
              profile={userProfile}
              person={myPersonRecord}
              tasks={visibleTasks}
              leaves={leaves}
              events={visibleEvents}
              duties={duties}
              phoneSettings={phoneSettings}
              phoneAssignments={phoneAssignments}
              onSelectTask={(t) => setSelectedTask(t)}
              onSelectLeave={(l) => setSelectedLeave(l)}
              onSelectEvent={(e) => setSelectedEvent(e)}
            />
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <PageTitle
                title="משימות"
                subtitle={isCommander ? 'ניהול, מעקב ואישור ביצוע משימות' : isSergeant ? 'צפייה במשימות חיילים ויצירת משימות לחיילים' : 'המשימות האישיות שלי'}
                action={canCreateTasks ? () => openForm('task') : undefined}
              />
              <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-100 text-xs font-bold gap-1">
                {(
                  [
                    ['all', 'הכל'],
                    ['open', 'פתוחות'],
                    ['pending_approval', `לאישור (${pendingApprovalTasks.length})`],
                    ['ongoing', 'שוטפות'],
                    ['overdue', 'באיחור'],
                    ['done', 'הושלמו']
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTaskFilter(k)}
                    className={`flex-1 min-w-[76px] py-2 px-2 rounded-xl transition ${
                      taskFilter === k ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredTasks.length ? (
                  filteredTasks.map((t) => {
                    const isOverdue = overdueTasks.some((x) => x.id === t.id);
                    const badge =
                      t.status === 'completed'
                        ? { text: 'הושלמה', cls: 'bg-[#DDF5E3] text-[#27824A]' }
                        : t.status === 'pending_approval'
                        ? { text: 'ממתינה לאישור מפקד', cls: 'bg-amber-100 text-amber-800' }
                        : t.status === 'in_progress'
                        ? { text: 'בביצוע', cls: 'bg-sky-100 text-sky-800' }
                        : isOverdue
                        ? { text: 'באיחור', cls: 'bg-[#FFE4E4] text-[#D54A4A]' }
                        : { text: 'פתוחה', cls: 'bg-purple-50 text-[#7047D7]' };

                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="w-full bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 text-right"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              t.status === 'completed'
                                ? 'bg-[#DDF5E3] text-[#27824A]'
                                : t.status === 'pending_approval'
                                ? 'bg-amber-100 text-amber-700'
                                : isOverdue
                                ? 'bg-[#FFE4E4] text-[#D54A4A]'
                                : 'bg-[#FFF1CE] text-[#D99A20]'
                            }`}
                          >
                            {t.status === 'completed' ? (
                              <Check className="w-4 h-4" />
                            ) : t.status === 'pending_approval' ? (
                              <Send className="w-4 h-4" />
                            ) : isOverdue ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Clock3 className="w-4 h-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm truncate">{t.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {t.kind === 'ongoing' ? 'משימה שוטפת' : fmtDate(t.dueDate)} • אחראי:{' '}
                              {t.responsibleName || 'לא שויך'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              עודכן ע״י {t.updatedBy}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl ${badge.cls}`}>
                            {badge.text}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-300" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <Empty text="אין משימות במסנן הזה" />
                )}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <PageTitle
                title="נוכחות"
                subtitle={canViewAllPresence ? 'מעקב נוכחות, הפניות, חזרתיות והיסטוריה' : 'הנוכחות וההיסטוריה האישית שלי'}
                action={isCommander ? () => openForm('leave') : undefined}
              />

              {canViewAllPresence && (
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 text-xs font-bold">
                  <button
                    onClick={() => setLeaveTab('soldier')}
                    className={`flex-1 py-2 rounded-xl ${
                      leaveTab === 'soldier' ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    חיילים
                  </button>
                  <button
                    onClick={() => setLeaveTab('commander')}
                    className={`flex-1 py-2 rounded-xl ${
                      leaveTab === 'commander' ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    מפקדים
                  </button>
                  <button
                    onClick={() => setLeaveTab('reserve')}
                    className={`flex-1 py-2 rounded-xl ${
                      leaveTab === 'reserve' ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    מילואים
                  </button>
                </div>
              )}

              <LeaveCalendar
                month={leaveMonth}
                selectedDay={leaveSelectedDay}
                leaves={leaves.filter((l) =>
                  canViewAllPresence ? l.category === leaveTab : l.personId === myPersonId
                )}
                onSelect={setLeaveSelectedDay}
                onPrev={() => setLeaveMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                onNext={() => setLeaveMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                onToday={() => {
                  const d = new Date();
                  setLeaveMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  setLeaveSelectedDay(todayISO());
                }}
              />

              <Section
                title={`${fmtDate(leaveSelectedDay)} • ${
                  canViewAllPresence
                    ? leaveTab === 'soldier'
                      ? 'חיילים'
                      : leaveTab === 'reserve'
                      ? 'מילואים'
                      : 'מפקדים'
                    : 'הדיווחים שלי'
                }`}
              >
                <div className="space-y-2.5">
                  {selectedDayLeaves.length ? (
                    selectedDayLeaves.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLeave(l)}
                        className="w-full bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between gap-2 text-right"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <InitialBadge name={l.name} />
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm truncate">{l.name}</div>
                            <div className="text-xs text-slate-400">
                              {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                              {l.repeatFrequency && l.repeatFrequency !== 'none'
                                ? ` • ${repeatLabel(l.repeatFrequency)}`
                                : ''}
                            </div>
                            <div className="text-[10px] text-slate-400">נוסף ע״י {l.createdBy}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[11px] font-extrabold bg-[#E0F5E5] text-[#277B47] px-3 py-1 rounded-xl">
                            {l.type}
                          </span>
                          {l.type === 'הפניה' && l.referralTime && (
                            <span className="text-[10px] font-black bg-purple-100 text-[#7047D7] px-2 py-0.5 rounded-lg">
                              שעה {l.referralTime}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <Empty text="אין דיווחי נוכחות ביום הזה" />
                  )}
                </div>
              </Section>

              <Section title="היסטוריית נוכחות מלאה">
                <div className="flex gap-1.5 mb-3">
                  {(
                    [
                      ['all', 'הכל'],
                      ['active', 'פעילים'],
                      ['ended', 'הסתיימו / בוטלו']
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setLeaveHistoryFilter(k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        leaveHistoryFilter === k
                          ? 'bg-[#7047D7] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {visibleLeavesForHistory.length ? (
                    visibleLeavesForHistory.map((l) => {
                      const isEnded =
                        l.status === 'cancelled' ||
                        ((l.repeatFrequency || 'none') === 'none' && l.endDate < today) ||
                        Boolean(l.repeatUntil && l.repeatUntil < today);

                      return (
                        <button
                          key={l.id}
                          onClick={() => setSelectedLeave(l)}
                          className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-2 text-right border ${
                            l.status === 'cancelled'
                              ? 'bg-slate-50 border-slate-200 opacity-65'
                              : isEnded
                              ? 'bg-slate-50/70 border-slate-100'
                              : 'bg-white border-slate-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <InitialBadge name={l.name} />
                            <div className="min-w-0">
                              <div className="font-extrabold text-sm truncate">{l.name}</div>
                              <div className="text-xs text-slate-400">
                                {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                                {l.repeatFrequency && l.repeatFrequency !== 'none'
                                  ? ` • ${repeatLabel(l.repeatFrequency)}`
                                  : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] font-extrabold bg-[#E0F5E5] text-[#277B47] px-3 py-1 rounded-xl">
                              {l.type}
                              {l.type === 'הפניה' && l.referralTime ? ` • ${l.referralTime}` : ''}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {l.status === 'cancelled' ? 'בוטל' : isEnded ? 'הסתיים' : 'פעיל'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <Empty text="אין רשומות להצגה" />
                  )}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'schedule' && (() => {
            const getPersonalDerivedItemsForDay = (day: string) => {
              const myPhones = myPersonId
                ? resolvePhoneSlotsForDate(day, phoneSettings, phoneAssignments).filter(
                    (s) => s.personId === myPersonId
                  )
                : [];
              const myDayDuties = duties.filter(
                (d) =>
                  d.active &&
                  Boolean(myPersonId) &&
                  d.personId === myPersonId &&
                  d.startDate <= day &&
                  d.endDate >= day
              );
              const myDayLeaves = leaves.filter(
                (l) => Boolean(myPersonId) && l.personId === myPersonId && leaveOccursOn(l, day)
              );
              return { myPhones, myDayDuties, myDayLeaves };
            };

            const selectedDerived = getPersonalDerivedItemsForDay(selectedDay);
            const selectedDayEvents = visibleEvents
              .filter((e) => eventOccursOn(e, selectedDay))
              .sort((a, b) => a.time.localeCompare(b.time));
            const hasAnySelectedDayItem =
              selectedDayEvents.length > 0 ||
              selectedDerived.myPhones.length > 0 ||
              selectedDerived.myDayDuties.length > 0 ||
              selectedDerived.myDayLeaves.length > 0;

            return (
              <div className="space-y-4">
                <PageTitle
                  title="לו״ז"
                  subtitle={isCommander ? 'תכנון פעילות היחידה ואירועים אישיים' : 'הלו״ז האישי המשולב שלי'}
                  action={isCommander ? () => openForm('event') : undefined}
                />
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 text-xs font-bold">
                  <button
                    onClick={() => setScheduleView('day')}
                    className={`flex-1 py-2 rounded-xl ${
                      scheduleView === 'day' ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    יומי
                  </button>
                  <button
                    onClick={() => setScheduleView('week')}
                    className={`flex-1 py-2 rounded-xl ${
                      scheduleView === 'week' ? 'bg-[#7047D7] text-white' : 'text-slate-500'
                    }`}
                  >
                    שבועי
                  </button>
                </div>
                {scheduleView === 'day' ? (
                  <>
                    <input
                      type="date"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-3 text-sm font-bold"
                    />
                    <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-2.5">
                      {selectedDerived.myDayLeaves.map((l) => (
                        <button
                          key={`leave-${l.id}`}
                          onClick={() => setSelectedLeave(l)}
                          className="w-full p-3 rounded-xl text-right border bg-[#E0F5E5] border-[#C5E9CE] text-[#277B47]"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs">
                              נוכחות אישית: {l.type}
                              {l.type === 'הפניה' && l.referralTime ? ` • שעה ${l.referralTime}` : ''}
                            </span>
                            <span className="text-[10px] font-bold bg-white/70 px-2 py-0.5 rounded-lg">
                              מסונכרן אוטומטית
                            </span>
                          </div>
                        </button>
                      ))}

                      {selectedDerived.myPhones.map((p) => (
                        <div
                          key={`phone-${p.slotKey}`}
                          className="w-full p-3 rounded-xl text-right border bg-[#EEE1FF] border-[#DEC9FF] text-[#7047D7]"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs">
                              כוננות טלפון ({p.shiftLabel})
                            </span>
                            <span className="text-[10px] font-bold">
                              {p.startTime}–{p.endTime}
                            </span>
                          </div>
                        </div>
                      ))}

                      {selectedDerived.myDayDuties.map((d) => (
                        <div
                          key={`duty-${d.id}`}
                          className="w-full p-3 rounded-xl text-right border bg-amber-50 border-amber-200 text-amber-900"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs">{d.type}</span>
                            {d.startTime && (
                              <span className="text-[10px] font-bold">
                                {d.startTime}–{d.endTime || ''}
                              </span>
                            )}
                          </div>
                          {d.note && <div className="text-[10px] opacity-80 mt-1">{d.note}</div>}
                        </div>
                      ))}

                      {selectedDayEvents.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={`w-full p-3 rounded-xl text-right border ${
                            Number(e.time.slice(0, 2)) < 10
                              ? 'bg-[#E9E0FF] border-[#D8C8FF]'
                              : Number(e.time.slice(0, 2)) < 13
                              ? 'bg-[#DDF4E2] border-[#C7EBCF]'
                              : Number(e.time.slice(0, 2)) < 15
                              ? 'bg-[#FFE2E2] border-[#F6CCCC]'
                              : 'bg-[#DDEEFF] border-[#C9E1F8]'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="font-extrabold text-xs">
                              {e.title}
                              {e.repeatFrequency && e.repeatFrequency !== 'none' ? ' ↻' : ''}
                            </span>
                            <span className="text-[10px]">
                              {e.time}–{e.endTime}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">נוסף ע״י {e.createdBy}</div>
                        </button>
                      ))}

                      {!hasAnySelectedDayItem && (
                        <Empty text="אין אירועים בתאריך הזה" />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 7 }, (_, i) => addDaysISO(startOfWeekISO(selectedDay), i)).map(
                      (day) => {
                        const dayEvents = visibleEvents
                          .filter((e) => eventOccursOn(e, day))
                          .sort((a, b) => a.time.localeCompare(b.time));
                        const derived = getPersonalDerivedItemsForDay(day);
                        const hasWeekDayItems =
                          dayEvents.length > 0 ||
                          derived.myPhones.length > 0 ||
                          derived.myDayDuties.length > 0 ||
                          derived.myDayLeaves.length > 0;

                        return (
                          <div key={day} className="bg-white rounded-3xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-black text-sm">
                                {dateFromISO(day).toLocaleDateString('he-IL', { weekday: 'long' })}
                              </div>
                              <div className="text-xs text-slate-400">{fmtDate(day)}</div>
                            </div>
                            <div className="space-y-2">
                              {hasWeekDayItems ? (
                                <>
                                  {derived.myDayLeaves.map((l) => (
                                    <button
                                      key={`wk-leave-${l.id}-${day}`}
                                      onClick={() => setSelectedLeave(l)}
                                      className="w-full bg-[#E0F5E5] border border-[#C5E9CE] text-[#277B47] p-3 rounded-2xl flex justify-between text-right"
                                    >
                                      <span className="font-extrabold text-xs">
                                        נוכחות אישית: {l.type}
                                        {l.type === 'הפניה' && l.referralTime ? ` (${l.referralTime})` : ''}
                                      </span>
                                      <span className="text-[10px] font-bold">מסונכרן</span>
                                    </button>
                                  ))}
                                  {derived.myPhones.map((p) => (
                                    <div
                                      key={`wk-phone-${p.slotKey}`}
                                      className="w-full bg-[#EEE1FF] border border-[#DEC9FF] text-[#7047D7] p-3 rounded-2xl flex justify-between text-right"
                                    >
                                      <span className="font-extrabold text-xs">
                                        כוננות טלפון ({p.shiftLabel})
                                      </span>
                                      <span className="text-[10px] font-bold">
                                        {p.startTime}–{p.endTime}
                                      </span>
                                    </div>
                                  ))}
                                  {derived.myDayDuties.map((d) => (
                                    <div
                                      key={`wk-duty-${d.id}-${day}`}
                                      className="w-full bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl flex justify-between text-right"
                                    >
                                      <span className="font-extrabold text-xs">{d.type}</span>
                                      {d.startTime && (
                                        <span className="text-[10px] font-bold">
                                          {d.startTime}–{d.endTime || ''}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {dayEvents.map((e) => (
                                    <button
                                      key={`${e.id}-${day}`}
                                      onClick={() => setSelectedEvent(e)}
                                      className="w-full bg-[#F7F3FF] border border-[#E7DCFF] p-3 rounded-2xl flex justify-between text-right"
                                    >
                                      <span className="font-extrabold text-xs">
                                        {e.title}
                                        {e.repeatFrequency && e.repeatFrequency !== 'none' ? ' ↻' : ''}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {e.time}–{e.endTime}
                                      </span>
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <div className="text-xs text-slate-300 py-1">אין אירועים</div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDay(addDaysISO(selectedDay, -7))}
                        className="flex-1 bg-white border p-3 rounded-2xl text-xs font-bold"
                      >
                        שבוע קודם
                      </button>
                      <button
                        onClick={() => setSelectedDay(todayISO())}
                        className="flex-1 bg-white border p-3 rounded-2xl text-xs font-bold"
                      >
                        השבוע
                      </button>
                      <button
                        onClick={() => setSelectedDay(addDaysISO(selectedDay, 7))}
                        className="flex-1 bg-white border p-3 rounded-2xl text-xs font-bold"
                      >
                        שבוע הבא
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'people' && isCommander && (
            <div className="space-y-4">
              <PageTitle
                title="כוח אדם"
                subtitle="ניהול חיילים, מפקדים והרשאות גישה"
                action={() => openForm('person')}
              />
              {(['commander', 'soldier', 'reserve'] as Category[]).map((cat) => (
                <Section
                  key={cat}
                  title={cat === 'commander' ? 'מפקדים' : cat === 'reserve' ? 'מילואים' : 'חיילים'}
                >
                  <div className="space-y-2">
                    {people
                      .filter((p) => p.category === cat && p.active)
                      .map((p) => {
                        const out = currentLeaves.some((l) => l.personId === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPerson(p)}
                            className="w-full flex items-center justify-between bg-slate-50 p-3 rounded-2xl text-right"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <InitialBadge name={p.name} />
                              <div className="min-w-0">
                                <div className="font-extrabold text-sm truncate">{p.name}</div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {p.category === 'commander'
                                    ? 'מפקד/ת'
                                    : p.category === 'reserve'
                                    ? 'מילואים'
                                    : 'חייל/ת'}
                                  {p.email ? ` • ${p.email}` : ''}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                                out ? 'bg-amber-50 text-amber-700' : 'bg-[#E0F5E5] text-[#277B47]'
                              }`}
                            >
                              {out ? 'לא ביחידה' : 'ביחידה'}
                            </span>
                          </button>
                        );
                      })}
                    {!people.some((p) => p.category === cat && p.active) && (
                      <Empty text="אין רשומים בקטגוריה זו" />
                    )}
                  </div>
                </Section>
              ))}
            </div>
          )}
        </div>

        <nav className="fixed bottom-3 left-0 right-0 flex justify-center px-3 z-40 pointer-events-none">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[24px] px-2 py-2 flex items-center justify-around shadow-[0_8px_28px_rgba(0,0,0,0.10)] pointer-events-auto">
            <Nav active={activeTab === 'today'} icon={<Home />} label="היום" onClick={() => setActiveTab('today')} />
            <Nav active={activeTab === 'personal'} icon={<UserCheck />} label="אישי" onClick={() => setActiveTab('personal')} />
            <Nav active={activeTab === 'tasks'} icon={<CheckSquare />} label="משימות" onClick={() => setActiveTab('tasks')} />
            {canCreateTasks && (
              <button
                onClick={() => setQuickAdd(true)}
                className="w-13 h-13 p-3.5 rounded-full bg-[#7047D7] shadow-lg text-white flex items-center justify-center -mt-5 shrink-0"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
            <Nav active={activeTab === 'leaves'} icon={<Palmtree />} label="נוכחות" onClick={() => setActiveTab('leaves')} />
            <Nav active={activeTab === 'schedule'} icon={<CalendarDays />} label="לו״ז" onClick={() => setActiveTab('schedule')} />
            {isCommander && (
              <Nav active={activeTab === 'people'} icon={<Users />} label="אנשים" onClick={() => setActiveTab('people')} />
            )}
          </div>
        </nav>

        {quickAdd && canCreateTasks && (
          <Modal title="הוספה חדשה" onClose={() => setQuickAdd(false)}>
            <Action icon={<CheckSquare />} title="הוספת משימה" onClick={() => openForm('task')} />
            {isCommander && (
              <>
                <Action icon={<Palmtree />} title="הוספת נוכחות" onClick={() => openForm('leave')} />
                <Action icon={<Calendar />} title="הוספת אירוע בלו״ז" onClick={() => openForm('event')} />
                <Action icon={<UserRound />} title="הוספת אדם" onClick={() => openForm('person')} />
              </>
            )}
          </Modal>
        )}

        {formType && (isCommander || (isSergeant && formType === 'task' && !editingId)) && (
          <Editor
            type={formType}
            editingId={editingId}
            people={people}
            tasks={tasks}
            leaves={leaves}
            events={events}
            currentUserName={currentUserName}
            restrictTaskToSoldiers={isSergeant}
            onClose={() => {
              setFormType(null);
              setEditingId(null);
            }}
            onPerson={async (p, isEdit) => {
              const matchedUser = usersList.find(
                (u) =>
                  (p.uid && u.uid === p.uid) ||
                  (p.email && u.email && u.email.toLowerCase() === p.email.toLowerCase()) ||
                  u.personId === p.id
              );
              const resolvedRole: UserRole =
                p.category === 'commander'
                  ? 'commander'
                  : matchedUser?.role === 'sergeant'
                  ? 'sergeant'
                  : p.role || 'soldier';
              const personWithRole: Person = { ...p, role: resolvedRole };
              await savePersonDoc(personWithRole);
              if (matchedUser) {
                await saveUserProfileDoc({
                  ...matchedUser,
                  displayName: p.name,
                  personId: p.id,
                  role: resolvedRole,
                  active: p.active,
                  updatedAt: nowText()
                });
              }
              notify(`${currentUserName} ${isEdit ? 'עדכנ/ה' : 'הוסיפ/ה'} את ${p.name}`, 'people', p.id);
            }}
            onTask={async (t, isEdit) => {
              await saveTaskDoc(t);
              notify(
                `${currentUserName} ${isEdit ? 'עדכנ/ה' : 'הוסיפ/ה'} משימה: ${t.title}`,
                'tasks',
                t.id,
                t.responsibleId || 'all'
              );
              setSelectedTask(null);
            }}
            onLeave={async (l, isEdit) => {
              await saveLeaveDoc(l);
              notify(
                `${currentUserName} ${isEdit ? 'עדכנ/ה' : 'הוסיפ/ה'} נוכחות ל${l.name}`,
                'leaves',
                l.id,
                l.personId
              );
              setSelectedLeave(null);
            }}
            onEvent={async (e, isEdit) => {
              await saveEventDoc(e);
              notify(`${currentUserName} ${isEdit ? 'עדכנ/ה' : 'הוסיפ/ה'} אירוע: ${e.title}`, 'schedule', e.id);
              setSelectedEvent(null);
            }}
          />
        )}

        {selectedTask && (
          <Detail
            title="פרטי משימה"
            canEdit={isCommander}
            onClose={() => {
              setSelectedTask(null);
              setRejectModalOpen(false);
            }}
            onEdit={() => openForm('task', selectedTask.id)}
            onDelete={() => deleteEntity('task', selectedTask.id)}
            meta={`נוצר ע״י ${selectedTask.createdBy} • ${selectedTask.createdAt}`}
            comments={selectedTask.comments || []}
            audit={selectedTask.audit || []}
            comment={comment}
            setComment={setComment}
            onComment={() => addComment('task', selectedTask.id)}
          >
            <h2 className="text-xl font-black">{selectedTask.title}</h2>
            {selectedTask.description && <p className="text-sm text-slate-600">{selectedTask.description}</p>}
            <Info label="אחראי" value={selectedTask.responsibleName || 'לא שויך'} />
            <Info label="סוג" value={selectedTask.kind === 'ongoing' ? 'משימה שוטפת' : 'משימה רגילה'} />
            {selectedTask.kind !== 'ongoing' && <Info label="תאריך יעד" value={fmtDate(selectedTask.dueDate)} />}
            <Info
              label="סטטוס נוכחי"
              value={
                selectedTask.status === 'completed'
                  ? 'הושלמה (אושרה ע״י מפקד)'
                  : selectedTask.status === 'pending_approval'
                  ? 'ממתינה לאישור מפקד'
                  : selectedTask.status === 'in_progress'
                  ? 'בביצוע'
                  : 'פתוחה'
              }
            />

            {selectedTask.rejectionReason && selectedTask.status !== 'completed' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                הערת מפקד להחזרה לתיקון: {selectedTask.rejectionReason}
              </div>
            )}

            {selectedTask.approvedBy && selectedTask.status === 'completed' && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                אושר ע״י {selectedTask.approvedBy} • {selectedTask.approvedAt}
              </div>
            )}

            {selectedTask.status !== 'completed' && (
              <div className="space-y-2 pt-2">
                {userProfile?.role === 'soldier' && selectedTask.responsibleId === myPersonId && selectedTask.status === 'open' && (
                  <button
                    onClick={() => handleSoldierStartTask(selectedTask)}
                    className="w-full bg-sky-600 text-white p-3 rounded-2xl font-black text-sm"
                  >
                    התחל ביצוע משימה
                  </button>
                )}

                {userProfile?.role === 'soldier' && selectedTask.responsibleId === myPersonId && (selectedTask.status === 'open' || selectedTask.status === 'in_progress' || selectedTask.status === 'overdue') && (
                  <button
                    onClick={() => handleSoldierSubmitForApproval(selectedTask)}
                    className="w-full bg-amber-500 text-white p-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    סיימתי לבצע — שליחה לאישור מפקד
                  </button>
                )}

                {isCommander && selectedTask.status === 'pending_approval' && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="text-xs font-black text-amber-900">
                      החייל סימן שהמשימה בוצעה וממתין לאישורך:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCommanderApproveTask(selectedTask)}
                        className="bg-emerald-600 text-white p-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        אישור ביצוע
                      </button>
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        className="bg-rose-600 text-white p-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        החזרה לתיקון
                      </button>
                    </div>
                  </div>
                )}

                {isCommander && selectedTask.status !== 'pending_approval' && (
                  <button
                    onClick={() => handleCommanderApproveTask(selectedTask)}
                    className="w-full bg-emerald-600 text-white p-3 rounded-2xl font-bold text-sm"
                  >
                    אישור והשלמה ישירה (מפקד)
                  </button>
                )}
              </div>
            )}

            {rejectModalOpen && isCommander && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 mt-2">
                <div className="text-xs font-extrabold text-rose-900">סיבת החזרה לתיקון:</div>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="מה נדרש להשלים או לתקן?"
                  className="w-full p-2.5 bg-white border rounded-xl text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCommanderReturnTask(selectedTask)}
                    className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-xs font-bold"
                  >
                    שלח לתיקון
                  </button>
                  <button
                    onClick={() => setRejectModalOpen(false)}
                    className="px-3 bg-white border rounded-xl text-xs font-bold"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </Detail>
        )}

        {selectedLeave && (
          <Detail
            title="פרטי נוכחות"
            canEdit={isCommander}
            onClose={() => setSelectedLeave(null)}
            onEdit={() => openForm('leave', selectedLeave.id)}
            onDelete={() => deleteEntity('leave', selectedLeave.id)}
            meta={`נוסף ע״י ${selectedLeave.createdBy} • ${selectedLeave.createdAt}`}
            comments={selectedLeave.comments || []}
            audit={selectedLeave.audit || []}
            comment={comment}
            setComment={setComment}
            onComment={() => addComment('leave', selectedLeave.id)}
          >
            <h2 className="text-xl font-black">{selectedLeave.name}</h2>
            <Info label="סוג" value={selectedLeave.type} />
            {selectedLeave.type === 'הפניה' && selectedLeave.referralTime && (
              <Info label="שעת הפניה" value={selectedLeave.referralTime} />
            )}
            <Info label="תאריכים" value={`${fmtDate(selectedLeave.startDate)} – ${fmtDate(selectedLeave.endDate)}`} />
            {selectedLeave.repeatFrequency && selectedLeave.repeatFrequency !== 'none' && (
              <Info
                label="תדירות חזרתיות"
                value={`${repeatLabel(selectedLeave.repeatFrequency)}${
                  selectedLeave.repeatUntil ? ` • עד ${fmtDate(selectedLeave.repeatUntil)}` : ''
                }`}
              />
            )}
            {selectedLeave.status === 'cancelled' && (
              <Info label="סטטוס" value="בוטל (נשמר בהיסטוריה)" />
            )}
            {selectedLeave.note && <p className="text-sm pt-1">{selectedLeave.note}</p>}
          </Detail>
        )}

        {selectedEvent && (
          <Detail
            title="אירוע בלו״ז"
            canEdit={isCommander}
            onClose={() => setSelectedEvent(null)}
            onEdit={() => openForm('event', selectedEvent.id)}
            onDelete={() => deleteEntity('event', selectedEvent.id)}
            meta={`נוסף ע״י ${selectedEvent.createdBy} • ${selectedEvent.createdAt}`}
            comments={selectedEvent.comments || []}
            audit={selectedEvent.audit || []}
            comment={comment}
            setComment={setComment}
            onComment={() => addComment('event', selectedEvent.id)}
          >
            <h2 className="text-xl font-black">{selectedEvent.title}</h2>
            <Info label="תאריך התחלה" value={fmtDate(selectedEvent.date)} />
            <Info label="שעה" value={`${selectedEvent.time} – ${selectedEvent.endTime}`} />
            {selectedEvent.repeatFrequency && selectedEvent.repeatFrequency !== 'none' && (
              <Info
                label="חזרה"
                value={
                  ({ daily: 'כל יום', weekly: 'כל שבוע', biweekly: 'כל שבועיים', monthly: 'כל חודש' } as any)[
                    selectedEvent.repeatFrequency
                  ] + (selectedEvent.repeatUntil ? ` • עד ${fmtDate(selectedEvent.repeatUntil)}` : ' • ללא תאריך סיום')
                }
              />
            )}
            {selectedEvent.description && <p className="text-sm">{selectedEvent.description}</p>}
          </Detail>
        )}

        {selectedPerson && isCommander && (
          <div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-2xl mx-auto" dir="rtl">
            <Top title="פרופיל אישי" onClose={() => setSelectedPerson(null)} />
            <div className="flex flex-col items-center text-center py-4">
              <InitialBadge name={selectedPerson.name} size="lg" highlight />
              <h2 className="text-xl font-black mt-3">{selectedPerson.name}</h2>
              <p className="text-sm text-slate-500">
                {selectedPerson.category === 'commander'
                  ? 'מפקד/ת'
                  : selectedPerson.category === 'reserve'
                  ? 'מילואים'
                  : 'חייל/ת'}
              </p>
            </div>
            {selectedPerson.email && <Info label="אימייל התחברות" value={selectedPerson.email} />}
            <div className="grid grid-cols-2 gap-2 my-4">
              <button
                onClick={() => openForm('person', selectedPerson.id)}
                className="bg-[#7047D7] text-white p-3 rounded-2xl font-bold"
              >
                עריכת פרטים
              </button>
              <button
                onClick={() => openForm('leave')}
                className="bg-white border p-3 rounded-2xl font-bold"
              >
                הוספת נוכחות
              </button>
              <button
                onClick={async () => {
                  if (
                    confirm(
                      `להעביר את ${selectedPerson.name} ללא פעיל? כל המשימות, הנוכחות וההיסטוריה יישמרו במלואם.`
                    )
                  ) {
                    const updated = { ...selectedPerson, active: false, updatedAt: nowText() };
                    await savePersonDoc(updated);
                    notify(`${currentUserName} העביר/ה את ${selectedPerson.name} ללא פעיל`, 'people', selectedPerson.id);
                    setSelectedPerson(null);
                  }
                }}
                className="col-span-2 bg-[#FFE8E8] text-[#C84242] p-3 rounded-2xl font-bold"
              >
                העברה ללא פעיל (שומר היסטוריה)
              </button>
            </div>

            <Section title="תורנויות ושמירות">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setDutyPersonId(selectedPerson.id);
                    setDutyFormOpen(true);
                  }}
                  className="w-full bg-gradient-to-l from-[#FFF0D8] to-[#FFF8EB] text-[#A96C15] p-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  הוספת תורנות / שמירה / שבת
                </button>
                {duties
                  .filter((d) => d.personId === selectedPerson.id && d.active)
                  .map((d) => (
                    <div key={d.id} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-sm">{d.type}</div>
                        <div className="text-[10px] text-slate-400">
                          {fmtDate(d.startDate)}
                          {d.endDate !== d.startDate ? ` – ${fmtDate(d.endDate)}` : ''}
                          {d.startTime ? ` • ${d.startTime}${d.endTime ? `–${d.endTime}` : ''}` : ''}
                        </div>
                        {d.note && <div className="text-xs mt-1">{d.note}</div>}
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('לבטל את הרשומה?')) {
                            await saveDutyDoc({ ...d, active: false, updatedBy: currentUserName, updatedAt: nowText() });
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </Section>

            <div className="h-3" />
            <Section title="משימות">
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.responsibleId === selectedPerson.id)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedPerson(null);
                        setSelectedTask(t);
                      }}
                      className="w-full bg-slate-50 p-3 rounded-xl text-right text-sm font-bold flex justify-between"
                    >
                      <span>{t.title}</span>
                      <span className="text-xs text-slate-400">{t.status}</span>
                    </button>
                  ))}
              </div>
            </Section>

            <div className="h-3" />
            <Section title="היסטוריית נוכחות מלאה">
              <div className="space-y-2">
                {leaves
                  .filter((l) => l.personId === selectedPerson.id)
                  .map((l) => (
                    <div key={l.id} className="bg-slate-50 p-3 rounded-xl text-sm flex justify-between">
                      <span>
                        {l.type}
                        {l.type === 'הפניה' && l.referralTime ? ` (${l.referralTime})` : ''} •{' '}
                        {fmtDate(l.startDate)}–{fmtDate(l.endDate)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {l.status === 'cancelled' ? 'בוטל' : repeatLabel(l.repeatFrequency)}
                      </span>
                    </div>
                  ))}
              </div>
            </Section>
          </div>
        )}

        {dutyFormOpen && isCommander && (
          <Modal title="הוספת תורנות / שמירה" onClose={() => setDutyFormOpen(false)}>
            <div className="space-y-3">
              <select
                value={dutyPersonId || selectedPerson?.id || ''}
                onChange={(e) => setDutyPersonId(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
              >
                <option value="">בחירת אדם</option>
                {people
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                {(['תורנות', 'שמירה', 'סגירת שבת'] as DutyType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDutyType(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold ${
                      dutyType === t ? 'bg-[#7047D7] text-white' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">מתאריך</div>
                  <input
                    type="date"
                    value={dutyStartDate}
                    onChange={(e) => setDutyStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">עד תאריך</div>
                  <input
                    type="date"
                    value={dutyEndDate}
                    onChange={(e) => setDutyEndDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
                  />
                </div>
              </div>
              {dutyType !== 'סגירת שבת' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={dutyStartTime}
                    onChange={(e) => setDutyStartTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
                  />
                  <input
                    type="time"
                    value={dutyEndTime}
                    onChange={(e) => setDutyEndTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
                  />
                </div>
              )}
              <textarea
                value={dutyNote}
                onChange={(e) => setDutyNote(e.target.value)}
                placeholder="הערה (אופציונלי)"
                className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
              />
              <button onClick={addDuty} className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-bold">
                שמירה
              </button>
            </div>
          </Modal>
        )}

        {managementChatOpen && isCommander && (
          <div className="fixed inset-0 z-50 bg-[#F8F6F2] max-w-2xl mx-auto flex flex-col" dir="rtl">
            <div className="p-4">
              <Top title="צ׳אט מפקדים" onClose={() => setManagementChatOpen(false)} />
            </div>
            <div className="px-4 pb-2">
              <div className="bg-[#EEE1FF] text-[#7047D7] rounded-2xl p-3 text-xs font-bold">
                💬 צ׳אט מפקדים מאובטח — נגיש אך ורק למפקדי היחידה
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {managementMessages.length ? (
                managementMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 items-end ${
                      m.author === currentUserName ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <InitialBadge name={m.author} size="sm" highlight={m.author === currentUserName} />
                    <div
                      className={`max-w-[78%] p-3 rounded-2xl ${
                        m.author === currentUserName ? 'bg-[#7047D7] text-white' : 'bg-white border'
                      }`}
                    >
                      <div className="text-[10px] font-black opacity-75">{m.author}</div>
                      <div className="text-sm mt-0.5">{m.text}</div>
                      <div className="text-[8px] opacity-60 mt-1">{m.at}</div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="עוד אין הודעות בצ׳אט המפקדים" />
              )}
            </div>
            <div className="p-4 bg-white border-t flex gap-2">
              <input
                value={managementText}
                onChange={(e) => setManagementText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendManagementMessage();
                }}
                placeholder="כתיבת הודעה..."
                className="flex-1 bg-slate-50 border rounded-2xl p-3 text-sm"
              />
              <button
                onClick={sendManagementMessage}
                className="w-12 rounded-2xl bg-[#7047D7] text-white flex items-center justify-center shrink-0"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {notificationsOpen && (
          <div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-2xl mx-auto" dir="rtl">
            <Top title="התראות" onClose={() => setNotificationsOpen(false)} />
            <button
              onClick={async () => {
                for (const n of visibleNotifications.filter((x) => !x.read)) {
                  await saveNotificationDoc({ ...n, read: true });
                }
              }}
              className="text-xs font-bold text-[#7047D7] my-3"
            >
              סימון הכל כנקרא
            </button>
            <div className="space-y-2">
              {visibleNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    await saveNotificationDoc({ ...n, read: true });
                    setNotificationsOpen(false);
                    setActiveTab(n.target);
                  }}
                  className={`w-full p-4 rounded-2xl border text-right ${
                    n.read ? 'bg-white' : 'bg-purple-50 border-purple-100'
                  }`}
                >
                  <div className="text-sm font-bold">{n.text}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{n.at}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isEditingBanner && isCommander && (
          <Modal title="עריכת הודעת הבאנר" onClose={() => setIsEditingBanner(false)}>
            <input
              value={tempBannerInput}
              onChange={(e) => setTempBannerInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"
              autoFocus
            />
            <button onClick={saveBanner} className="w-full bg-[#7047D7] text-white p-3 rounded-2xl font-bold mt-3">
              שמור
            </button>
          </Modal>
        )}

        {adminToolsOpen && isCommander && (
          <Modal title="אבטחת מידע, גיבוי והעברה בטוחה" onClose={() => setAdminToolsOpen(false)}>
            <div className="space-y-3 text-right">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-xs text-slate-700 space-y-1">
                <div className="font-black text-[#7047D7]">הפרדת הרשאות ברמת השרת (Firestore Rules)</div>
                <p>
                  הנתונים מופרדים לאוספים ייעודיים (<code className="font-mono">users</code>,{' '}
                  <code className="font-mono">people</code>, <code className="font-mono">tasks</code>,{' '}
                  <code className="font-mono">leaves</code>, <code className="font-mono">phoneShifts</code>,{' '}
                  <code className="font-mono">managementMessages</code>) כך שחיילים יכולים לקרוא רק את הנתונים המותרים להם.
                </p>
              </div>

              <button
                disabled={migrationBusy}
                onClick={runSafeBackup}
                className="w-full bg-white border-2 border-[#7047D7] text-[#7047D7] p-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2"
              >
                <DatabaseBackup className="w-4 h-4" />
                יצירת גיבוי מלא עכשיו (ללא שינוי נתונים)
              </button>

              <button
                disabled={migrationBusy}
                onClick={runSafeMigration}
                className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                גיבוי + העברה בטוחה מ-appState/main
              </button>

              {migrationStatus && (
                <div className="p-3 rounded-2xl bg-slate-50 border text-xs font-bold text-slate-700 whitespace-pre-wrap">
                  {migrationStatus}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-black mb-2">שיוך משתמשים רשומים והגדרת תפקידים:</div>
                {usersList.length === 0 ? (
                  <div className="text-xs text-slate-400">אין עדיין משתמשים נוספים שהתחברו</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {usersList.map((u) => (
                      <div key={u.uid} className="p-2.5 rounded-xl bg-slate-50 border space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="truncate">{u.email || u.displayName}</span>
                          <span className="text-[#7047D7]">
                            {u.role === 'commander' ? 'מפקד' : u.role === 'sergeant' ? 'סמל' : 'חייל'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              const nextRole = e.target.value as UserRole;
                              await saveUserProfileDoc({
                                ...u,
                                role: nextRole,
                                updatedAt: nowText()
                              });
                              if (u.personId) {
                                const linkedPerson = people.find((x) => x.id === u.personId);
                                if (linkedPerson) {
                                  await savePersonDoc({
                                    ...linkedPerson,
                                    role: nextRole,
                                    updatedAt: nowText()
                                  });
                                }
                              }
                            }}
                            className="p-1.5 bg-white border rounded-lg text-xs font-bold"
                          >
                            <option value="soldier">חייל</option>
                            <option value="sergeant">סמל</option>
                            <option value="commander">מפקד</option>
                          </select>
                          <select
                            value={u.personId || ''}
                            onChange={async (e) => {
                              const p = people.find((x) => x.id === e.target.value);
                              await saveUserProfileDoc({
                                ...u,
                                personId: e.target.value,
                                displayName: p?.name || u.displayName,
                                updatedAt: nowText()
                              });
                              if (p) {
                                await savePersonDoc({
                                  ...p,
                                  role: u.role,
                                  updatedAt: nowText()
                                });
                              }
                            }}
                            className="p-1.5 bg-white border rounded-lg text-xs font-bold"
                          >
                            <option value="">שיוך לאדם ביחידה…</option>
                            {people
                              .filter((p) => p.active)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function LeaveCalendar({
  month,
  selectedDay,
  leaves,
  onSelect,
  onPrev,
  onNext,
  onToday
}: {
  month: Date;
  selectedDay: string;
  leaves: Leave[];
  onSelect: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const year = month.getFullYear(),
    mon = month.getMonth();
  const first = new Date(year, mon, 1);
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const offset = first.getDay();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const iso = (day: number) => `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayMatches = (day: number) => leaves.filter((l) => leaveOccursOn(l, iso(day)));
  const monthName = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(month);
  const weekdays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="font-black text-sm">{monthName}</div>
          <button onClick={onToday} className="text-[10px] text-[#7047D7] font-bold mt-0.5">
            חזרה להיום
          </button>
        </div>
        <button onClick={onNext} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekdays.map((w) => (
          <div key={w} className="text-[10px] font-bold text-slate-400 py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />;
          const matches = dayMatches(day);
          const hasLeave = matches.length > 0;
          return (
            <button
              key={i}
              onClick={() => onSelect(iso(day))}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition ${
                selectedDay === iso(day)
                  ? 'bg-[#7047D7] text-white'
                  : 'bg-[#F4F2EF] text-slate-700 active:bg-purple-50'
              }`}
            >
              <span>{day}</span>
              {hasLeave && (
                <span
                  className={`absolute bottom-1 min-w-1.5 h-1.5 px-0.5 rounded-full ${
                    selectedDay === iso(day) ? 'bg-white' : 'bg-[#8BD7A2]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-slate-400">
        <span className="w-2 h-2 rounded-full bg-[#8BD7A2]" />
        <span>יש דיווח נוכחות / היעדרות ביום הזה</span>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onBell, unread }: { title: string; subtitle: string; onBell: () => void; unread: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#7047D7]">
          <Sparkles className="w-3.5 h-3.5" />
          היחידה שלנו
        </div>
        <h1 className="text-2xl font-black mt-0.5">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <button onClick={onBell} className="relative w-10 h-10 rounded-2xl bg-white border flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      {action && (
        <button onClick={action} className="w-10 h-10 rounded-2xl bg-white border flex items-center justify-center shrink-0">
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
  onClick,
  danger = false
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  const palette = danger
    ? 'from-[#FFE7E7] to-[#FFF1F1] text-[#C84343]'
    : title.includes('מפקדים')
    ? 'from-[#EFE4FF] to-[#F7F0FF] text-[#7047D7]'
    : title.includes('חיילים')
    ? 'from-[#DDF1FF] to-[#EDF8FF] text-[#287EB8]'
    : 'from-[#DDF5E3] to-[#ECFAEF] text-[#27824A]';
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${palette} p-3.5 rounded-2xl text-right active:scale-[.98] shadow-sm min-h-[96px]`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl sm:text-3xl font-black leading-none">{value}</div>
          <div className="text-[11px] font-extrabold mt-2">{title}</div>
        </div>
        <span className="w-8 h-8 rounded-full bg-white/65 flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
      </div>
    </button>
  );
}

function Section({
  title,
  action,
  onAction,
  children
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/70">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-extrabold text-sm">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-xs text-[#7047D7] font-bold">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-slate-400 text-center py-4">{text}</div>;
}

function Nav({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-1 px-1.5 ${active ? 'text-[#7047D7]' : 'text-slate-400'}`}
    >
      <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-[10px] mt-1 font-bold">{label}</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-5 max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <h3 className="font-extrabold text-base">{title}</h3>
          <span className="w-6" />
        </div>
        {children}
      </div>
    </div>
  );
}

function Action({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  const style = title.includes('משימה')
    ? 'from-[#EEE1FF] to-[#F7EFFF] text-[#7047D7]'
    : title.includes('נוכחות')
    ? 'from-[#DDF5E3] to-[#EEFAF1] text-[#25834B]'
    : title.includes('לו״ז')
    ? 'from-[#DDEFFF] to-[#EEF7FF] text-[#277DB7]'
    : 'from-[#FFF0D8] to-[#FFF7E9] text-[#B87318]';
  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-br ${style} p-4 rounded-2xl flex gap-4 items-center mb-3 min-h-[76px]`}
    >
      <span className="w-11 h-11 rounded-2xl bg-white/65 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 shrink-0">
        {icon}
      </span>
      <span className="font-black text-base">{title}</span>
    </button>
  );
}

function Top({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onClose} className="w-10 h-10 bg-white border rounded-2xl flex items-center justify-center">
        <ChevronRight className="w-5 h-5" />
      </button>
      <h2 className="font-extrabold">{title}</h2>
      <span className="w-10" />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl my-1">
      <div className="text-[10px] text-slate-400 font-bold">{label}</div>
      <div className="text-sm font-extrabold mt-0.5">{value}</div>
    </div>
  );
}

function Detail({
  title,
  canEdit,
  onClose,
  onEdit,
  onDelete,
  meta,
  comments,
  audit,
  comment,
  setComment,
  onComment,
  children
}: {
  title: string;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  meta: string;
  comments: Comment[];
  audit: Audit[];
  comment: string;
  setComment: (x: string) => void;
  onComment: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-2xl mx-auto" dir="rtl">
      <Top title={title} onClose={onClose} />
      <div className="space-y-3 mt-4 pb-10">
        <div className="bg-white p-4 rounded-3xl border space-y-2">
          {children}
          <div className="text-[10px] text-slate-400 pt-2">{meta}</div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 bg-[#7047D7] text-white p-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              עריכה
            </button>
            <button onClick={onDelete} className="px-4 bg-[#FFE8E8] text-[#C84242] rounded-2xl">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        <Section title="צ׳אט ותגובות">
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-slate-50 p-3 rounded-2xl">
                <div className="text-xs font-extrabold">{c.author}</div>
                <div className="text-sm mt-1">{c.text}</div>
                <div className="text-[9px] text-slate-400 mt-1">{c.at}</div>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onComment();
                }}
                placeholder="כתיבת תגובה..."
                className="flex-1 bg-slate-50 border rounded-2xl p-3 text-sm"
              />
              <button onClick={onComment} className="bg-[#7047D7] text-white px-4 rounded-2xl">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Section>
        <Section title="היסטוריית פעילות ושינויים">
          <div className="space-y-2">
            {audit.map((a) => (
              <div key={a.id} className="text-xs border-r-2 border-purple-200 pr-3">
                <b>{a.actor}</b> {a.text}
                <div className="text-[9px] text-slate-400">{a.at}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Editor({
  type,
  editingId,
  people,
  tasks,
  leaves,
  events,
  currentUserName,
  restrictTaskToSoldiers = false,
  onClose,
  onPerson,
  onTask,
  onLeave,
  onEvent
}: {
  type: 'task' | 'leave' | 'event' | 'person';
  editingId: string | null;
  people: Person[];
  tasks: Task[];
  leaves: Leave[];
  events: ScheduleEvent[];
  currentUserName: string;
  restrictTaskToSoldiers?: boolean;
  onClose: () => void;
  onPerson: (p: Person, e: boolean) => Promise<void>;
  onTask: (t: Task, e: boolean) => Promise<void>;
  onLeave: (l: Leave, e: boolean) => Promise<void>;
  onEvent: (ev: ScheduleEvent, e: boolean) => Promise<void>;
}) {
  const old: any =
    type === 'task'
      ? tasks.find((x) => x.id === editingId)
      : type === 'leave'
      ? leaves.find((x) => x.id === editingId)
      : type === 'event'
      ? events.find((x) => x.id === editingId)
      : people.find((x) => x.id === editingId);

  const [f, setF] = useState<any>(old || {});
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const input = 'w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm';

  const save = async () => {
    const isEdit = !!old;
    const at = nowText();

    if (type === 'person') {
      if (!f.name?.trim()) return alert('צריך להזין שם');
      const p: Person = {
        id: old?.id || uid(),
        name: f.name.trim(),
        category: f.category || 'soldier',
        role: old?.role,
        email: (f.email || '').trim().toLowerCase(),
        phone: (f.phone || '').trim(),
        notes: f.notes || '',
        active: f.active ?? true,
        createdAt: old?.createdAt || at,
        updatedAt: at
      };
      await onPerson(p, isEdit);
    }

    if (type === 'task') {
      if (!f.title?.trim()) return alert('צריך להזין שם משימה');
      const assignablePeople = people.filter(
        (x) =>
          x.active &&
          (!restrictTaskToSoldiers ||
            ((x.category === 'soldier' || x.category === 'reserve') &&
              (x.role ?? 'soldier') === 'soldier'))
      );
      const p = assignablePeople.find((x) => x.id === f.responsibleId) || assignablePeople[0];
      if (!p) return alert('יש לבחור חייל/ת לשיוך המשימה');
      const t: Task = {
        id: old?.id || uid(),
        title: f.title.trim(),
        dueDate: f.dueDate || todayISO(),
        dueTime: f.dueTime || '',
        responsibleId: p?.id || '',
        responsibleName: p?.name || '',
        status: f.status || 'open',
        kind: (f.kind || 'regular') as TaskKind,
        description: f.description || '',
        createdBy: old?.createdBy || currentUserName,
        createdAt: old?.createdAt || at,
        updatedBy: currentUserName,
        updatedAt: at,
        comments: old?.comments || [],
        audit: [
          ...(old?.audit || []),
          { id: uid(), actor: currentUserName, text: isEdit ? 'ערכ/ה את המשימה' : 'יצר/ה את המשימה', at }
        ]
      };
      await onTask(t, isEdit);
    }

    if (type === 'leave') {
      const p = people.find((x) => x.id === f.personId) || people.filter((x) => x.active)[0];
      if (!p) return alert('צריך להוסיף אדם קודם');
      const leaveType = (f.type || 'חופש') as LeaveType;
      const startDate = f.startDate || todayISO();
      const endDate = f.endDate && f.endDate >= startDate ? f.endDate : startDate;
      const repeatFreq = (f.repeatFrequency || 'none') as RepeatFrequency;
      const repeatUntil = repeatFreq !== 'none' ? f.repeatUntil || '' : '';

      if (leaveType === 'הפניה' && !f.referralTime) {
        return alert('בעת דיווח הפניה יש להזין שעת הפניה');
      }

      const l: Leave = {
        id: old?.id || uid(),
        personId: p.id,
        name: p.name,
        type: leaveType,
        startDate,
        endDate,
        referralTime: leaveType === 'הפניה' ? f.referralTime : '',
        repeatFrequency: repeatFreq,
        repeatUntil,
        status: f.status || 'active',
        category: p.category,
        note: f.note || '',
        createdBy: old?.createdBy || currentUserName,
        createdAt: old?.createdAt || at,
        updatedBy: currentUserName,
        updatedAt: at,
        comments: old?.comments || [],
        audit: [
          ...(old?.audit || []),
          {
            id: uid(),
            actor: currentUserName,
            text: isEdit
              ? 'ערכ/ה את דיווח הנוכחות'
              : `הוסיפ/ה דיווח ${leaveType}${leaveType === 'הפניה' ? ` (שעה ${f.referralTime})` : ''}${
                  repeatFreq !== 'none' ? ` (${repeatLabel(repeatFreq)})` : ''
                }`,
            at
          }
        ]
      };
      await onLeave(l, isEdit);
    }

    if (type === 'event') {
      if (!f.title?.trim()) return alert('צריך להזין כותרת');
      const startTime = f.time || '08:00';
      const rawEnd = f.endTime || '';
      const safeEnd = !rawEnd || rawEnd <= startTime ? addOneHour(startTime) : rawEnd;
      const e: ScheduleEvent = {
        id: old?.id || uid(),
        title: f.title.trim(),
        date: f.date || todayISO(),
        time: startTime,
        endTime: safeEnd,
        description: f.description || '',
        personIds: f.personIds || [],
        repeatFrequency: f.repeatFrequency || 'none',
        repeatUntil: f.repeatFrequency && f.repeatFrequency !== 'none' ? f.repeatUntil || '' : '',
        createdBy: old?.createdBy || currentUserName,
        createdAt: old?.createdAt || at,
        updatedBy: currentUserName,
        updatedAt: at,
        comments: old?.comments || [],
        audit: [
          ...(old?.audit || []),
          { id: uid(), actor: currentUserName, text: isEdit ? 'ערכ/ה את האירוע' : 'הוסיפ/ה אירוע', at }
        ]
      };
      await onEvent(e, isEdit);
    }

    onClose();
  };

  return (
    <Modal
      title={`${editingId ? 'עריכת' : 'הוספת'} ${
        type === 'task' ? 'משימה' : type === 'leave' ? 'נוכחות' : type === 'event' ? 'אירוע' : 'אדם'
      }`}
      onClose={onClose}
    >
      <div className="space-y-3">
        {type === 'person' && (
          <>
            <input className={input} placeholder="שם מלא" value={f.name || ''} onChange={(e) => set('name', e.target.value)} />
            <select className={input} value={f.category || 'soldier'} onChange={(e) => set('category', e.target.value)}>
              <option value="soldier">חייל/ת</option>
              <option value="commander">מפקד/ת</option>
              <option value="reserve">מילואים</option>
            </select>
            <input
              type="email"
              className={input}
              placeholder="אימייל להתחברות אישית (לשיוך אוטומטי)"
              value={f.email || ''}
              onChange={(e) => set('email', e.target.value)}
            />
            <input
              type="tel"
              className={input}
              placeholder="טלפון (אופציונלי)"
              value={f.phone || ''}
              onChange={(e) => set('phone', e.target.value)}
            />
            <textarea className={input} placeholder="הערות (אופציונלי)" value={f.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </>
        )}

        {type === 'task' && (
          <>
            <input className={input} placeholder="שם המשימה" value={f.title || ''} onChange={(e) => set('title', e.target.value)} />
            <textarea className={input} placeholder="פירוט המשימה" value={f.description || ''} onChange={(e) => set('description', e.target.value)} />
            <select
              className={input}
              value={
                f.responsibleId ||
                people.filter(
                  (p) =>
                    p.active &&
                    (!restrictTaskToSoldiers ||
                      ((p.category === 'soldier' || p.category === 'reserve') &&
                        (p.role ?? 'soldier') === 'soldier'))
                )[0]?.id ||
                ''
              }
              onChange={(e) => set('responsibleId', e.target.value)}
            >
              {people
                .filter(
                  (p) =>
                    p.active &&
                    (!restrictTaskToSoldiers ||
                      ((p.category === 'soldier' || p.category === 'reserve') &&
                        (p.role ?? 'soldier') === 'soldier'))
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select className={input} value={f.kind || 'regular'} onChange={(e) => set('kind', e.target.value)}>
              <option value="regular">משימה רגילה</option>
              <option value="ongoing">משימה שוטפת</option>
            </select>
            {(f.kind || 'regular') === 'regular' && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className={input} value={f.dueDate || todayISO()} onChange={(e) => set('dueDate', e.target.value)} />
                <input type="time" className={input} value={f.dueTime || ''} onChange={(e) => set('dueTime', e.target.value)} />
              </div>
            )}
            <select className={input} value={f.status || 'open'} onChange={(e) => set('status', e.target.value)}>
              <option value="open">פתוחה</option>
              <option value="in_progress">בביצוע</option>
              <option value="pending_approval">ממתינה לאישור מפקד</option>
              <option value="completed">הושלמה (מאושרת)</option>
            </select>
          </>
        )}

        {type === 'leave' && (
          <>
            <select
              className={input}
              value={f.personId || people.filter((p) => p.active)[0]?.id || ''}
              onChange={(e) => set('personId', e.target.value)}
            >
              {people
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select className={input} value={f.type || 'חופש'} onChange={(e) => set('type', e.target.value)}>
              <option value="חופש">חופש</option>
              <option value="גימלים">גימלים</option>
              <option value="קורס">קורס</option>
              <option value="אפטר">אפטר</option>
              <option value="תמ״ל">תמ״ל</option>
              <option value="לימודים">לימודים</option>
              <option value="הפניה">הפניה</option>
            </select>

            {(f.type || 'חופש') === 'הפניה' && (
              <div className="bg-[#F6F0FF] p-3 rounded-2xl border border-[#E2D4FF]">
                <label className="block text-xs font-black text-[#7047D7] mb-1">
                  שעת הפניה (חובה להפניה)
                </label>
                <input
                  type="time"
                  className="w-full p-2.5 bg-white border rounded-xl text-sm font-bold"
                  value={f.referralTime || ''}
                  onChange={(e) => set('referralTime', e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">מתאריך</div>
                <input
                  type="date"
                  className={input}
                  value={f.startDate || todayISO()}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">עד תאריך</div>
                <input
                  type="date"
                  className={input}
                  min={f.startDate || todayISO()}
                  value={f.endDate || f.startDate || todayISO()}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#7047D7]" />
                תדירות דיווח
              </div>
              <select
                className={input}
                value={f.repeatFrequency || 'none'}
                onChange={(e) => set('repeatFrequency', e.target.value)}
              >
                <option value="none">חד־פעמי</option>
                <option value="daily">יומי</option>
                <option value="weekly">שבועי (למשל לימודים בכל יום שני)</option>
                <option value="biweekly">כל שבועיים</option>
                <option value="monthly">חודשי</option>
              </select>
            </div>

            {f.repeatFrequency && f.repeatFrequency !== 'none' && (
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">
                  תאריך סיום לחזרתיות (אופציונלי)
                </div>
                <input
                  type="date"
                  className={input}
                  min={f.startDate || todayISO()}
                  value={f.repeatUntil || ''}
                  onChange={(e) => set('repeatUntil', e.target.value)}
                />
              </div>
            )}

            <textarea className={input} placeholder="הערה (אופציונלי)" value={f.note || ''} onChange={(e) => set('note', e.target.value)} />
          </>
        )}

        {type === 'event' && (
          <>
            <input className={input} placeholder="כותרת האירוע" value={f.title || ''} onChange={(e) => set('title', e.target.value)} />
            <input type="date" className={input} value={f.date || todayISO()} onChange={(e) => set('date', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" className={input} value={f.time || '08:00'} onChange={(e) => set('time', e.target.value)} />
              <input type="time" className={input} value={f.endTime || '09:00'} onChange={(e) => set('endTime', e.target.value)} />
            </div>
            <select className={input} value={f.repeatFrequency || 'none'} onChange={(e) => set('repeatFrequency', e.target.value)}>
              <option value="none">אירוע חד־פעמי</option>
              <option value="daily">חוזר כל יום</option>
              <option value="weekly">חוזר כל שבוע</option>
              <option value="biweekly">חוזר כל שבועיים</option>
              <option value="monthly">חוזר כל חודש</option>
            </select>
            {f.repeatFrequency && f.repeatFrequency !== 'none' && (
              <div>
                <div className="text-xs font-bold mb-1">חוזר עד (אופציונלי)</div>
                <input
                  type="date"
                  className={input}
                  min={f.date || todayISO()}
                  value={f.repeatUntil || ''}
                  onChange={(e) => set('repeatUntil', e.target.value)}
                />
              </div>
            )}
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 space-y-3">
              <div className="text-sm font-bold text-slate-800">שיוך האירוע</div>
                <div className="space-y-2">
                  <div className="text-xs text-slate-600">בחרי את אנשי הצוות שהאירוע שייך אליהם:</div>
                  <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl bg-white p-2 border border-slate-200">
                    {people.filter((p) => p.active || (f.personIds || []).includes(p.id)).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(f.personIds || []).includes(p.id)}
                          onChange={(e) => set('personIds', e.target.checked
                            ? [...new Set([...(f.personIds || []), p.id])]
                            : (f.personIds || []).filter((id: string) => id !== p.id))}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                    {people.length === 0 && <div className="text-xs text-slate-400">אין אנשי צוות לשיוך</div>}
                  </div>
                  <div className="text-xs text-slate-500">
                    אירוע ללא שיוך לא יוצג באזור האישי של חיילים.
                  </div>
                </div>

            </div>
            <textarea className={input} placeholder="פירוט" value={f.description || ''} onChange={(e) => set('description', e.target.value)} />
          </>
        )}

        <button
          onClick={save}
          className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-bold flex justify-center items-center gap-2"
        >
          <Save className="w-4 h-4" />
          שמירה
        </button>
      </div>
    </Modal>
  );
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: any) {
    return { error: error?.message || String(error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error('App render error', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" className="min-h-screen bg-[#F8F6F2] p-6 font-sans flex items-center justify-center">
          <div className="max-w-sm w-full bg-white rounded-3xl border p-5 shadow">
            <h1 className="font-black text-xl mb-2">האתר נתקל בשגיאה</h1>
            <p className="text-sm text-slate-500 mb-3">לא איבדת שום מידע. ניתן לרענן את העמוד.</p>
            <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-3 rounded-2xl text-rose-600">
              {this.state.error}
            </pre>
            <button onClick={() => location.reload()} className="w-full mt-4 bg-[#7047D7] text-white p-3 rounded-2xl font-black">
              רענון
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppCore />
    </AppErrorBoundary>
  );
}
