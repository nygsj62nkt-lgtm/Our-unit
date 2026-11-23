export type Tab = 'today' | 'tasks' | 'leaves' | 'schedule' | 'people' | 'personal';
export type UserRole = 'commander' | 'soldier';
export type Category = 'soldier' | 'commander' | 'reserve';

export type TaskStatus = 'open' | 'in_progress' | 'pending_approval' | 'completed' | 'overdue';
export type TaskKind = 'regular' | 'ongoing';

export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type LeaveType = 'חופש' | 'גימלים' | 'קורס' | 'אפטר' | 'תמ״ל' | 'לימודים' | 'הפניה';
export type LeaveStatus = 'active' | 'cancelled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  personId: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorUid?: string;
  text: string;
  at: string;
}

export interface Audit {
  id: string;
  actor: string;
  actorUid?: string;
  action?: string;
  text: string;
  at: string;
}

export interface Person {
  id: string;
  name: string;
  category: Category;
  notes: string;
  avatarUrl?: string;
  active: boolean;
  email?: string;
  uid?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  responsibleId: string;
  responsibleName: string;
  avatarUrl?: string;
  imageUrl?: string;
  status: TaskStatus;
  kind?: TaskKind;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  completedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  comments: Comment[];
  audit: Audit[];
}

export interface Leave {
  id: string;
  personId: string;
  name: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  referralTime?: string;
  repeatFrequency?: RepeatFrequency;
  repeatUntil?: string;
  excludedDates?: string[];
  status?: LeaveStatus;
  avatarUrl?: string;
  category: Category;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  comments: Comment[];
  audit: Audit[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  description?: string;
  personIds: string[];
  repeatFrequency?: RepeatFrequency;
  repeatUntil?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  comments: Comment[];
  audit: Audit[];
}

export interface NotificationItem {
  id: string;
  text: string;
  at: string;
  read: boolean;
  target: Tab;
  entityId?: string;
  targetPersonId?: string;
}

export type DutyType = 'תורנות' | 'שמירה' | 'סגירת שבת';

export interface Duty {
  id: string;
  personId: string;
  personName: string;
  avatarUrl?: string;
  type: DutyType;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  active: boolean;
}

export interface ManagementMessage {
  id: string;
  author: string;
  authorUid?: string;
  avatarUrl?: string;
  text: string;
  at: string;
}

export interface ShiftTemplate {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface DayOperatingConfig {
  dayOfWeek: number;
  enabled: boolean;
  openTime: string;
  closeTime: string;
  shifts: ShiftTemplate[];
}

export interface PhoneDutySettings {
  days: Record<number, DayOperatingConfig>;
  updatedBy?: string;
  updatedAt?: string;
}

export type PhoneShiftRepeat = 'none' | 'weekly' | 'biweekly';

export interface PhoneShiftAssignment {
  id: string;
  date: string;
  shiftId: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
  personId: string;
  personName: string;
  repeatFrequency: PhoneShiftRepeat;
  repeatUntil?: string;
  excludedDates?: string[];
  overrides?: Record<string, {
    personId?: string;
    personName?: string;
    startTime?: string;
    endTime?: string;
    shiftLabel?: string;
    cancelled?: boolean;
  }>;
  cancelled?: boolean;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ResolvedPhoneSlot {
  slotKey: string;
  date: string;
  shiftId: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
  assignmentId?: string;
  personId?: string;
  personName?: string;
  isRecurring?: boolean;
  note?: string;
}
