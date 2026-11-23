import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import {
  Duty,
  Leave,
  ManagementMessage,
  NotificationItem,
  Person,
  PhoneDutySettings,
  PhoneShiftAssignment,
  ScheduleEvent,
  Task,
  UserProfile
} from '../types';
import { DEFAULT_PHONE_DUTY_SETTINGS, nowText } from '../utils/dates';

export const firebaseConfig = {
  apiKey: 'AIzaSyB7McjnXFMPyIkIzNML4l2dXzo2Nf2Wvt8',
  authDomain: 'our-unit.firebaseapp.com',
  projectId: 'our-unit',
  storageBucket: 'our-unit.firebasestorage.app',
  messagingSenderId: '136384065875',
  appId: '1:136384065875:web:cb2dac4435893a7e7c31a6',
  measurementId: 'G-EVMG15FL0K'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export { onAuthStateChanged, signInWithEmailAndPassword, signOut };
export type { User };

export const cleanFirestoreData = <T extends Record<string, any>>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export async function resolveOrBootstrapUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // New users are always pending. Only an existing commander or an administrator
  // using Firebase Console/Admin SDK can grant roles and link a person record.
  // Never infer elevated privileges from an email address or a person category.
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'משתמש/ת',
    role: 'soldier',
    personId: '',
    active: false,
    createdAt: nowText()
  };
  await setDoc(userRef, cleanFirestoreData(profile));
  return profile;
}

export async function createSafetyBackup(actorName: string): Promise<{ backupId: string; counts: Record<string, number> }> {
  const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const legacySnap = await getDoc(doc(db, 'appState', 'main'));
  const legacyData = legacySnap.exists() ? legacySnap.data() : null;

  const [peopleSnap, tasksSnap, leavesSnap, eventsSnap, dutiesSnap, phoneShiftsSnap, settingsSnap] =
    await Promise.all([
      getDocs(collection(db, 'people')),
      getDocs(collection(db, 'tasks')),
      getDocs(collection(db, 'leaves')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'duties')),
      getDocs(collection(db, 'phoneShifts')),
      getDoc(doc(db, 'settings', 'phoneDuty'))
    ]);

  const backupPayload = cleanFirestoreData({
    backupId,
    createdAt: nowText(),
    createdBy: actorName,
    legacyAppStateMain: legacyData,
    collections: {
      people: peopleSnap.docs.map((d) => d.data()),
      tasks: tasksSnap.docs.map((d) => d.data()),
      leaves: leavesSnap.docs.map((d) => d.data()),
      events: eventsSnap.docs.map((d) => d.data()),
      duties: dutiesSnap.docs.map((d) => d.data()),
      phoneShifts: phoneShiftsSnap.docs.map((d) => d.data()),
      phoneDutySettings: settingsSnap.exists() ? settingsSnap.data() : null
    }
  });

  await setDoc(doc(db, 'backups', backupId), backupPayload);

  return {
    backupId,
    counts: {
      legacyPeople: legacyData?.people?.length || 0,
      legacyTasks: legacyData?.tasks?.length || 0,
      legacyLeaves: legacyData?.leaves?.length || 0,
      legacyEvents: legacyData?.events?.length || 0,
      legacyDuties: legacyData?.duties?.length || 0
    }
  };
}

export async function migrateLegacyAppStateSafely(actorName: string): Promise<{
  backupId: string;
  migrated: Record<string, number>;
}> {
  const { backupId } = await createSafetyBackup(actorName);

  const legacySnap = await getDoc(doc(db, 'appState', 'main'));
  if (!legacySnap.exists()) {
    return {
      backupId,
      migrated: { people: 0, tasks: 0, leaves: 0, events: 0, duties: 0, messages: 0, notifications: 0 }
    };
  }

  const d: any = legacySnap.data();
  const legacyPeople: Person[] = d.people || [];
  const legacyTasks: Task[] = d.tasks || [];
  const legacyLeaves: Leave[] = d.leaves || [];
  const legacyEvents: ScheduleEvent[] = d.events || [];
  const legacyDuties: Duty[] = d.duties || [];
  const legacyMessages: ManagementMessage[] = d.managementMessages || [];
  const legacyNotifications: NotificationItem[] = d.notifications || [];
  const bannerMessage: string = d.bannerMessage || 'יום טוב ומנצח! ✨';

  const [exPeople, exTasks, exLeaves, exEvents, exDuties, exMsgs, exNotifs] = await Promise.all([
    getDocs(collection(db, 'people')),
    getDocs(collection(db, 'tasks')),
    getDocs(collection(db, 'leaves')),
    getDocs(collection(db, 'events')),
    getDocs(collection(db, 'duties')),
    getDocs(collection(db, 'managementMessages')),
    getDocs(collection(db, 'notifications'))
  ]);

  const existingIds = {
    people: new Set(exPeople.docs.map((x) => x.id)),
    tasks: new Set(exTasks.docs.map((x) => x.id)),
    leaves: new Set(exLeaves.docs.map((x) => x.id)),
    events: new Set(exEvents.docs.map((x) => x.id)),
    duties: new Set(exDuties.docs.map((x) => x.id)),
    messages: new Set(exMsgs.docs.map((x) => x.id)),
    notifications: new Set(exNotifs.docs.map((x) => x.id))
  };

  const operations: Array<{ ref: any; data: any }> = [];
  const counts = { people: 0, tasks: 0, leaves: 0, events: 0, duties: 0, messages: 0, notifications: 0 };

  for (const p of legacyPeople) {
    if (!p?.id || existingIds.people.has(p.id)) continue;
    operations.push({
      ref: doc(db, 'people', p.id),
      data: cleanFirestoreData({ ...p, active: p.active ?? true })
    });
    counts.people++;
  }

  for (const t of legacyTasks) {
    if (!t?.id || existingIds.tasks.has(t.id)) continue;
    operations.push({
      ref: doc(db, 'tasks', t.id),
      data: cleanFirestoreData({
        ...t,
        comments: t.comments || [],
        audit: t.audit || []
      })
    });
    counts.tasks++;
  }

  for (const l of legacyLeaves) {
    if (!l?.id || existingIds.leaves.has(l.id)) continue;
    operations.push({
      ref: doc(db, 'leaves', l.id),
      data: cleanFirestoreData({
        ...l,
        repeatFrequency: l.repeatFrequency || 'none',
        status: l.status || 'active',
        comments: l.comments || [],
        audit: l.audit || []
      })
    });
    counts.leaves++;
  }

  for (const ev of legacyEvents) {
    if (!ev?.id || existingIds.events.has(ev.id)) continue;
    operations.push({
      ref: doc(db, 'events', ev.id),
      data: cleanFirestoreData({
        ...ev,
        personIds: ev.personIds || [],
        comments: ev.comments || [],
        audit: ev.audit || []
      })
    });
    counts.events++;
  }

  for (const duty of legacyDuties) {
    if (!duty?.id || existingIds.duties.has(duty.id)) continue;
    operations.push({
      ref: doc(db, 'duties', duty.id),
      data: cleanFirestoreData({ ...duty, active: duty.active ?? true })
    });
    counts.duties++;
  }

  for (const msg of legacyMessages) {
    if (!msg?.id || existingIds.messages.has(msg.id)) continue;
    operations.push({
      ref: doc(db, 'managementMessages', msg.id),
      data: cleanFirestoreData(msg)
    });
    counts.messages++;
  }

  for (const n of legacyNotifications) {
    if (!n?.id || existingIds.notifications.has(n.id)) continue;
    operations.push({
      ref: doc(db, 'notifications', n.id),
      data: cleanFirestoreData({ ...n, targetPersonId: n.targetPersonId || 'all' })
    });
    counts.notifications++;
  }

  const generalSettingsRef = doc(db, 'settings', 'general');
  const generalSnap = await getDoc(generalSettingsRef);
  if (!generalSnap.exists()) {
    operations.push({
      ref: generalSettingsRef,
      data: cleanFirestoreData({ bannerMessage, updatedBy: actorName, updatedAt: nowText() })
    });
  }

  const phoneSettingsRef = doc(db, 'settings', 'phoneDuty');
  const phoneSettingsSnap = await getDoc(phoneSettingsRef);
  if (!phoneSettingsSnap.exists()) {
    operations.push({
      ref: phoneSettingsRef,
      data: cleanFirestoreData({
        ...DEFAULT_PHONE_DUTY_SETTINGS,
        updatedBy: actorName,
        updatedAt: nowText()
      })
    });
  }

  for (let i = 0; i < operations.length; i += 400) {
    const batch = writeBatch(db);
    const slice = operations.slice(i, i + 400);
    for (const op of slice) {
      batch.set(op.ref, op.data, { merge: true });
    }
    await batch.commit();
  }

  return { backupId, migrated: counts };
}

export const savePersonDoc = async (person: Person) => {
  await setDoc(doc(db, 'people', person.id), cleanFirestoreData(person), { merge: true });
};

export const saveTaskDoc = async (task: Task) => {
  await setDoc(doc(db, 'tasks', task.id), cleanFirestoreData(task), { merge: true });
};

export const deleteTaskDoc = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const saveLeaveDoc = async (leave: Leave) => {
  await setDoc(doc(db, 'leaves', leave.id), cleanFirestoreData(leave), { merge: true });
};

export const saveEventDoc = async (ev: ScheduleEvent) => {
  await setDoc(doc(db, 'events', ev.id), cleanFirestoreData(ev), { merge: true });
};

export const deleteEventDoc = async (eventId: string) => {
  await deleteDoc(doc(db, 'events', eventId));
};

export const saveDutyDoc = async (duty: Duty) => {
  await setDoc(doc(db, 'duties', duty.id), cleanFirestoreData(duty), { merge: true });
};

export const savePhoneDutySettingsDoc = async (settings: PhoneDutySettings) => {
  await setDoc(doc(db, 'settings', 'phoneDuty'), cleanFirestoreData(settings), { merge: true });
};

export const savePhoneShiftDoc = async (shift: PhoneShiftAssignment) => {
  await setDoc(doc(db, 'phoneShifts', shift.id), cleanFirestoreData(shift), { merge: true });
};

export const deletePhoneShiftDoc = async (shiftId: string) => {
  await deleteDoc(doc(db, 'phoneShifts', shiftId));
};

export const saveManagementMessageDoc = async (msg: ManagementMessage) => {
  await setDoc(doc(db, 'managementMessages', msg.id), cleanFirestoreData(msg), { merge: true });
};

export const saveNotificationDoc = async (notif: NotificationItem) => {
  await setDoc(doc(db, 'notifications', notif.id), cleanFirestoreData(notif), { merge: true });
};

export const saveBannerMessageDoc = async (bannerMessage: string, actorName: string) => {
  await setDoc(
    doc(db, 'settings', 'general'),
    cleanFirestoreData({ bannerMessage, updatedBy: actorName, updatedAt: nowText() }),
    { merge: true }
  );
};

export const saveUserProfileDoc = async (profile: UserProfile) => {
  await setDoc(doc(db, 'users', profile.uid), cleanFirestoreData(profile), { merge: true });
};

export const triggerPushEvent = async (
  text: string,
  target: string,
  entityId: string | undefined,
  actorUid: string,
  actorName: string
) => {
  await addDoc(collection(db, 'pushEvents'), {
    text,
    target,
    entityId: entityId || '',
    actorUid,
    actorName,
    createdAt: serverTimestamp()
  });
};

export const setupPushNotifications = async (
  user: User,
  actorName: string,
  onStage: (s: string) => void
): Promise<'enabled' | 'unsupported' | 'denied'> => {
  onStage('בודקת תמיכה בהתראות');
  const supported = await isSupported();
  if (!supported || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  onStage('מבקשת הרשאה להתראות');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return 'denied';
  }
  onStage('רושמת Service Worker');
  await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const registration = await navigator.serviceWorker.ready;

  onStage('מבקשת FCM token');
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey:
      'BM5djlrpEGQahKXA6zZSBAacG0WKqeGby56P945hVhPLQPiEPHeuo1HjHgQAKQ8EaVxgDn8qi3Bzav6EfiGnM3A',
    serviceWorkerRegistration: registration
  });
  if (!token) throw new Error('לא התקבל token להתראות');

  onStage('שומרת token ב-Firestore');
  await setDoc(
    doc(db, 'pushTokens', user.uid),
    {
      uid: user.uid,
      token,
      email: user.email || '',
      name: actorName,
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent
    },
    { merge: true }
  );
  return 'enabled';
};

export { collection, doc, onSnapshot, query, where };
