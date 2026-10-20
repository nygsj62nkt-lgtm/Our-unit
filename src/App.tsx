import React, { useMemo, useState } from 'react';
import {
  Home, CheckSquare, Plus, Calendar, CalendarDays, Bell, SlidersHorizontal,
  ChevronRight, ChevronLeft, Users, Crown, AlertCircle, Palmtree, X, Check,
  Pencil, Sparkles, ArrowUpRight, UserRound, MessageCircle, Trash2, Save,
  Clock3, Phone, Briefcase, ShieldCheck
} from 'lucide-react';

type Tab = 'today' | 'tasks' | 'leaves' | 'schedule' | 'people';
type Category = 'soldier' | 'commander' | 'reserve';
type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

interface Comment { id:string; author:string; text:string; at:string; }
interface Audit { id:string; actor:string; text:string; at:string; }
interface Person {
  id:string; name:string; category:Category;
  notes:string; avatarUrl:string; active:boolean;
}
interface Task {
  id:string; title:string; dueDate:string; dueTime?:string; responsibleId:string;
  responsibleName:string; avatarUrl:string; imageUrl?:string; status:TaskStatus;
  description?:string; createdBy:string; createdAt:string; updatedBy:string; updatedAt:string;
  comments:Comment[]; audit:Audit[];
}
interface Leave {
  id:string; personId:string; name:string; type:'חופש'|'גימלים'|'קורס'|'אפטר'|'תמ״ל';
  startDate:string; endDate:string; avatarUrl:string; category:Category; note?:string;
  createdBy:string; createdAt:string; updatedBy:string; updatedAt:string;
  comments:Comment[]; audit:Audit[];
}
interface ScheduleEvent {
  id:string; title:string; date:string; time:string; endTime:string; description?:string;
  personIds:string[]; createdBy:string; createdAt:string; updatedBy:string; updatedAt:string;
  comments:Comment[]; audit:Audit[];
}
interface Notification { id:string; text:string; at:string; read:boolean; target:Tab; entityId?:string; }
type DutyType = 'תורנות' | 'שמירה' | 'סגירת שבת';
interface Duty {
  id:string; personId:string; personName:string; avatarUrl:string; type:DutyType;
  startDate:string; endDate:string; startTime?:string; endTime?:string; note?:string;
  createdBy:string; createdAt:string; updatedBy:string; updatedAt:string; active:boolean;
}
interface ManagementMessage { id:string; author:string; avatarUrl:string; text:string; at:string; }

const CURRENT_USER = 'עדי';
const nowText = () => new Date().toLocaleString('he-IL', {dateStyle:'short', timeStyle:'short'});
const todayISO = () => new Date().toISOString().slice(0,10);
const fmtDate = (iso:string) => iso ? new Date(iso+'T12:00:00').toLocaleDateString('he-IL') : '';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

const AVATARS = [
  {id:'person-01',label:'דמות 1',src:'/avatars/person-01.jpg',group:'people'},
  {id:'person-02',label:'דמות 2',src:'/avatars/person-02.jpg',group:'people'},
  {id:'person-03',label:'דמות 3',src:'/avatars/person-03.jpg',group:'people'},
  {id:'person-04',label:'דמות 4',src:'/avatars/person-04.jpg',group:'people'},
  {id:'person-05',label:'דמות 5',src:'/avatars/person-05.jpg',group:'people'},
  {id:'person-06',label:'דמות 6',src:'/avatars/person-06.jpg',group:'people'},
  {id:'person-07',label:'דמות 7',src:'/avatars/person-07.jpg',group:'people'},
  {id:'person-08',label:'דמות 8',src:'/avatars/person-08.jpg',group:'people'},
  {id:'person-09',label:'דמות 9',src:'/avatars/person-09.jpg',group:'people'},
  {id:'person-10',label:'דמות 10',src:'/avatars/person-10.jpg',group:'people'},
  {id:'person-11',label:'דמות 11',src:'/avatars/person-11.jpg',group:'people'},
  {id:'person-12',label:'דמות 12',src:'/avatars/person-12.jpg',group:'people'},
  {id:'person-13',label:'דמות 13',src:'/avatars/person-13.jpg',group:'people'},
  {id:'person-14',label:'דמות 14',src:'/avatars/person-14.jpg',group:'people'},
  {id:'person-15',label:'דמות 15',src:'/avatars/person-15.jpg',group:'people'},
  {id:'person-16',label:'דמות 16',src:'/avatars/person-16.jpg',group:'people'},
  {id:'person-17',label:'דמות 17',src:'/avatars/person-17.jpg',group:'people'},
  {id:'person-18',label:'דמות 18',src:'/avatars/person-18.jpg',group:'people'},
  {id:'person-19',label:'דמות 19',src:'/avatars/person-19.jpg',group:'people'},
  {id:'person-20',label:'דמות 20',src:'/avatars/person-20.jpg',group:'people'},
  {id:'person-21',label:'דמות 21',src:'/avatars/person-21.jpg',group:'people'},
  {id:'person-22',label:'דמות 22',src:'/avatars/person-22.jpg',group:'people'},
  {id:'person-23',label:'דמות 23',src:'/avatars/person-23.jpg',group:'people'},
  {id:'person-24',label:'דמות 24',src:'/avatars/person-24.jpg',group:'people'},
  {id:'person-25',label:'דמות 25',src:'/avatars/person-25.jpg',group:'people'},
  {id:'person-26',label:'דמות 26',src:'/avatars/person-26.jpg',group:'people'},
  {id:'person-27',label:'דמות 27',src:'/avatars/person-27.jpg',group:'people'},
  {id:'person-28',label:'דמות 28',src:'/avatars/person-28.jpg',group:'people'},
  {id:'person-29',label:'דמות 29',src:'/avatars/person-29.jpg',group:'people'},
  {id:'person-30',label:'דמות 30',src:'/avatars/person-30.jpg',group:'people'},
  {id:'person-31',label:'דמות 31',src:'/avatars/person-31.jpg',group:'people'},
  {id:'person-32',label:'דמות 32',src:'/avatars/person-32.jpg',group:'people'},
  {id:'person-33',label:'דמות 33',src:'/avatars/person-33.jpg',group:'people'},
  {id:'person-34',label:'דמות 34',src:'/avatars/person-34.jpg',group:'people'},
  {id:'person-35',label:'דמות 35',src:'/avatars/person-35.jpg',group:'people'},
  {id:'person-36',label:'דמות 36',src:'/avatars/person-36.jpg',group:'people'},
  {id:'person-37',label:'דמות 37',src:'/avatars/person-37.jpg',group:'people'},
  {id:'person-38',label:'דמות 38',src:'/avatars/person-38.jpg',group:'people'},
  {id:'person-39',label:'דמות 39',src:'/avatars/person-39.jpg',group:'people'},
  {id:'person-40',label:'דמות 40',src:'/avatars/person-40.jpg',group:'people'},
  {id:'person-41',label:'דמות 41',src:'/avatars/person-41.jpg',group:'people'},
  {id:'person-42',label:'דמות 42',src:'/avatars/person-42.jpg',group:'people'},
  {id:'person-43',label:'דמות 43',src:'/avatars/person-43.jpg',group:'people'},
  {id:'person-44',label:'דמות 44',src:'/avatars/person-44.jpg',group:'people'},
  {id:'person-45',label:'דמות 45',src:'/avatars/person-45.jpg',group:'people'},
  {id:'person-46',label:'דמות 46',src:'/avatars/person-46.jpg',group:'people'},
  {id:'person-47',label:'דמות 47',src:'/avatars/person-47.jpg',group:'people'},
  {id:'person-48',label:'דמות 48',src:'/avatars/person-48.jpg',group:'people'},
  {id:'cat-diva',label:'חתול־דיווה ✨',src:'/avatars/cat-diva.jpg',group:'animals'},
  {id:'cat-siamese',label:'חתול סיאמי',src:'/avatars/cat-siamese.jpg',group:'animals'},
  {id:'cat-tuxedo',label:'חתול טוקסידו',src:'/avatars/cat-tuxedo.jpg',group:'animals'},
  {id:'cat-calico',label:'חתול קליקו',src:'/avatars/cat-calico.jpg',group:'animals'},
  {id:'cat-grumpy',label:'חתול זועף',src:'/avatars/cat-grumpy.jpg',group:'animals'},
  {id:'cat-bow',label:'חתולה עם פפיון',src:'/avatars/cat-bow.jpg',group:'animals'},
  {id:'cat-orange',label:'חתול כתום',src:'/avatars/cat-orange.jpg',group:'animals'},
  {id:'cat-gray',label:'חתול אפור',src:'/avatars/cat-gray.jpg',group:'animals'},
  {id:'cat-sleepy',label:'חתול ישנוני',src:'/avatars/cat-sleepy.jpg',group:'animals'},
  {id:'cat-black',label:'חתול שחור',src:'/avatars/cat-black.jpg',group:'animals'},
  {id:'dog-golden',label:'גולדן',src:'/avatars/dog-golden.jpg',group:'animals'},
  {id:'dog-corgi',label:'קורגי',src:'/avatars/dog-corgi.jpg',group:'animals'},
  {id:'dog-husky',label:'האסקי',src:'/avatars/dog-husky.jpg',group:'animals'},
  {id:'dog-white',label:'כלבלב לבן',src:'/avatars/dog-white.jpg',group:'animals'},
  {id:'dog-poodle',label:'פודל',src:'/avatars/dog-poodle.jpg',group:'animals'},
  {id:'dog-dachshund',label:'תחש',src:'/avatars/dog-dachshund.jpg',group:'animals'},
  {id:'dog-jack',label:'ג׳ק ראסל',src:'/avatars/dog-jack.jpg',group:'animals'},
  {id:'cat-sleepy-2',label:'cat-sleepy-2',src:'/avatars/cat-sleepy-2.jpg',group:'animals'},
  {id:'dog-frenchie',label:'בולדוג צרפתי',src:'/avatars/dog-frenchie.jpg',group:'animals'},
  {id:'dog-rottweiler',label:'רוטוויילר',src:'/avatars/dog-rottweiler.jpg',group:'animals'},
  {id:'bunny-brown',label:'ארנב',src:'/avatars/bunny-brown.jpg',group:'animals'},
  {id:'bunny-white',label:'ארנב לבן',src:'/avatars/bunny-white.jpg',group:'animals'},
  {id:'bunny-gray',label:'ארנב אפור',src:'/avatars/bunny-gray.jpg',group:'animals'},
  {id:'hamster',label:'אוגר',src:'/avatars/hamster.jpg',group:'animals'},
  {id:'hedgehog',label:'קיפוד',src:'/avatars/hedgehog.jpg',group:'animals'},
  {id:'raccoon',label:'דביבון',src:'/avatars/raccoon.jpg',group:'animals'},
  {id:'otter',label:'לוטרה',src:'/avatars/otter.jpg',group:'animals'},
  {id:'red-panda',label:'פנדה אדומה',src:'/avatars/red-panda.jpg',group:'animals'},
  {id:'sloth',label:'עצלן',src:'/avatars/sloth.jpg',group:'animals'},
  {id:'guinea-pig',label:'שרקן',src:'/avatars/guinea-pig.jpg',group:'animals'},
  {id:'capybara',label:'קפיברה',src:'/avatars/capybara.jpg',group:'animals'},
  {id:'highland-cow',label:'פרה סקוטית',src:'/avatars/highland-cow.jpg',group:'animals'},
  {id:'dino',label:'דינוזאור',src:'/avatars/dino.jpg',group:'creatures'},
  {id:'frog',label:'צפרדע מלכותית',src:'/avatars/frog.jpg',group:'creatures'},
  {id:'axolotl',label:'אקסולוטל',src:'/avatars/axolotl.jpg',group:'creatures'},
  {id:'penguin',label:'פינגווין',src:'/avatars/penguin.jpg',group:'animals'},
  {id:'seal',label:'כלב ים',src:'/avatars/seal.jpg',group:'animals'},
  {id:'octopus',label:'תמנון',src:'/avatars/octopus.jpg',group:'creatures'},
  {id:'turtle',label:'צב',src:'/avatars/turtle.jpg',group:'animals'},
  {id:'cockatiel',label:'קוקטייל',src:'/avatars/cockatiel.jpg',group:'animals'},
  {id:'budgie',label:'תוכון',src:'/avatars/budgie.jpg',group:'animals'},
  {id:'owl',label:'ינשוף',src:'/avatars/owl.jpg',group:'animals'},
  {id:'crow',label:'עורב',src:'/avatars/crow.jpg',group:'animals'},
  {id:'dragon',label:'דרקון',src:'/avatars/dragon.jpg',group:'creatures'},
  {id:'unicorn-1',label:'חד־קרן',src:'/avatars/unicorn-1.jpg',group:'creatures'},
  {id:'unicorn-2',label:'חד־קרן',src:'/avatars/unicorn-2.jpg',group:'creatures'},
  {id:'creature-1',label:'יצור חמוד',src:'/avatars/creature-1.jpg',group:'creatures'},
  {id:'creature-2',label:'יצור חמוד',src:'/avatars/creature-2.jpg',group:'creatures'},
];


const initialPeople:Person[] = [];

const seedAudit = (text:string):Audit[] => [{id:uid(),actor:'עדי',text,at:nowText()}];

export default function App() {
  const [activeTab,setActiveTab] = useState<Tab>('today');
  const [taskFilter,setTaskFilter] = useState<'all'|'open'|'overdue'|'done'>('all');
  const [leaveTab,setLeaveTab] = useState<Category>('soldier');
  const [people,setPeople] = useState<Person[]>(initialPeople);
  const [selectedPerson,setSelectedPerson] = useState<Person|null>(null);
  const [selectedTask,setSelectedTask] = useState<Task|null>(null);
  const [selectedLeave,setSelectedLeave] = useState<Leave|null>(null);
  const [selectedEvent,setSelectedEvent] = useState<ScheduleEvent|null>(null);
  const [quickAdd,setQuickAdd] = useState(false);
  const [formType,setFormType] = useState<'task'|'leave'|'event'|'person'|null>(null);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [comment,setComment] = useState('');
  const [selectedDay,setSelectedDay] = useState(todayISO());
  const [leaveSelectedDay,setLeaveSelectedDay] = useState(todayISO());
  const [leaveMonth,setLeaveMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [bannerMessage,setBannerMessage] = useState(() => localStorage.getItem('unit_banner_message') || 'יום טוב ומנצח! ✨');
  const [isEditingBanner,setIsEditingBanner] = useState(false);
  const [tempBannerInput,setTempBannerInput] = useState('');

  const [tasks,setTasks] = useState<Task[]>([]);
  const [leaves,setLeaves] = useState<Leave[]>([]);
  const [events,setEvents] = useState<ScheduleEvent[]>([]);
  const [notifications,setNotifications] = useState<Notification[]>([]);
  const [duties,setDuties] = useState<Duty[]>([]);
  const [managementMessages,setManagementMessages] = useState<ManagementMessage[]>([]);
  const [managementChatOpen,setManagementChatOpen] = useState(false);
  const [managementText,setManagementText] = useState('');
  const [dutyFormOpen,setDutyFormOpen] = useState(false);
  const [dutyPersonId,setDutyPersonId] = useState('');
  const [dutyType,setDutyType] = useState<DutyType>('תורנות');
  const [dutyStartDate,setDutyStartDate] = useState(todayISO());
  const [dutyEndDate,setDutyEndDate] = useState(todayISO());
  const [dutyStartTime,setDutyStartTime] = useState('');
  const [dutyEndTime,setDutyEndTime] = useState('');
  const [dutyNote,setDutyNote] = useState('');

  const notify = (text:string,target:Tab,entityId?:string) => setNotifications(n => [{id:uid(),text,at:nowText(),read:false,target,entityId},...n]);
  const currentLeaves = useMemo(() => leaves.filter(l => l.startDate <= todayISO() && l.endDate >= todayISO()),[leaves]);
  const soldierOut = currentLeaves.filter(l=>l.category==='soldier');
  const commanderOut = currentLeaves.filter(l=>l.category==='commander');
  const overdueTasks = tasks.filter(t=>t.status==='overdue' || (t.status!=='completed' && t.dueDate < todayISO()));
  const openTasks = tasks.filter(t=>t.status!=='completed');
  const filteredTasks = tasks.filter(t => taskFilter==='all' ? true : taskFilter==='done' ? t.status==='completed' : taskFilter==='overdue' ? overdueTasks.some(x=>x.id===t.id) : t.status==='open' || t.status==='in_progress');
  const unread = notifications.filter(n=>!n.read).length;
  const todayEvents = events.filter(e=>e.date===todayISO()).sort((a,b)=>a.time.localeCompare(b.time));
  const selectedDayLeaves = leaves.filter(l =>
    l.category===leaveTab && l.startDate<=leaveSelectedDay && l.endDate>=leaveSelectedDay
  );

  const goTasks = (filter:'all'|'open'|'overdue'|'done') => { setTaskFilter(filter); setActiveTab('tasks'); };
  const openBanner = () => { setTempBannerInput(bannerMessage); setIsEditingBanner(true); };
  const saveBanner = () => { if(tempBannerInput.trim()){setBannerMessage(tempBannerInput.trim());localStorage.setItem('unit_banner_message',tempBannerInput.trim());notify(`${CURRENT_USER} עדכנה את הודעת הבית`,'today');} setIsEditingBanner(false); };

  const openForm = (type:'task'|'leave'|'event'|'person', id?:string) => { setFormType(type); setEditingId(id||null); setQuickAdd(false); };
  const closeDetails = () => {setSelectedTask(null);setSelectedLeave(null);setSelectedEvent(null);setSelectedPerson(null);setComment('');};

  const addComment = (kind:'task'|'leave'|'event', id:string) => {
    const text=comment.trim(); if(!text)return;
    const c={id:uid(),author:CURRENT_USER,text,at:nowText()};
    if(kind==='task'){setTasks(xs=>xs.map(x=>x.id===id?{...x,comments:[...x.comments,c]}:x));setSelectedTask(x=>x&&x.id===id?{...x,comments:[...x.comments,c]}:x);notify(`${CURRENT_USER} הגיבה במשימה`,'tasks',id);}
    if(kind==='leave'){setLeaves(xs=>xs.map(x=>x.id===id?{...x,comments:[...x.comments,c]}:x));setSelectedLeave(x=>x&&x.id===id?{...x,comments:[...x.comments,c]}:x);notify(`${CURRENT_USER} הגיבה בחופש`,'leaves',id);}
    if(kind==='event'){setEvents(xs=>xs.map(x=>x.id===id?{...x,comments:[...x.comments,c]}:x));setSelectedEvent(x=>x&&x.id===id?{...x,comments:[...x.comments,c]}:x);notify(`${CURRENT_USER} הגיבה באירוע לו״ז`,'schedule',id);}
    setComment('');
  };

  const deleteEntity=(kind:'task'|'leave'|'event',id:string)=>{
    if(!confirm('למחוק את הפריט?'))return;
    if(kind==='task'){setTasks(x=>x.filter(i=>i.id!==id));notify(`${CURRENT_USER} מחקה משימה`,'tasks');}
    if(kind==='leave'){setLeaves(x=>x.filter(i=>i.id!==id));notify(`${CURRENT_USER} מחקה חופש`,'leaves');}
    if(kind==='event'){setEvents(x=>x.filter(i=>i.id!==id));notify(`${CURRENT_USER} מחקה אירוע לו״ז`,'schedule');}
    closeDetails();
  };

  const addDuty=()=>{
    const person=people.find(p=>p.id===dutyPersonId) || selectedPerson;
    if(!person) return alert('צריך לבחור אדם');
    const at=nowText();
    const d:Duty={id:uid(),personId:person.id,personName:person.name,avatarUrl:person.avatarUrl,type:dutyType,startDate:dutyStartDate,endDate:dutyEndDate,startTime:dutyStartTime,endTime:dutyEndTime,note:dutyNote,createdBy:CURRENT_USER,createdAt:at,updatedBy:CURRENT_USER,updatedAt:at,active:true};
    setDuties(xs=>[d,...xs]); notify(`${CURRENT_USER} הוסיפה ${dutyType} ל${person.name}`,'people',person.id);
    setDutyFormOpen(false); setDutyPersonId(''); setDutyType('תורנות'); setDutyStartDate(todayISO()); setDutyEndDate(todayISO()); setDutyStartTime(''); setDutyEndTime(''); setDutyNote('');
  };
  const sendManagementMessage=()=>{
    const text=managementText.trim(); if(!text)return;
    const me=people.find(p=>p.name===CURRENT_USER);
    setManagementMessages(xs=>[...xs,{id:uid(),author:CURRENT_USER,avatarUrl:me?.avatarUrl||'/avatars/cat-diva.jpg',text,at:nowText()}]);
    setManagementText('');
  };

  return <div className="flex justify-center bg-[#E9E7E3] min-h-screen font-sans antialiased text-slate-800" dir="rtl">
    <div className="w-full max-w-[440px] bg-[#F8F6F2] min-h-screen flex flex-col relative pb-28 shadow-2xl overflow-hidden border-x border-slate-200/40">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6">
        {activeTab==='today' && <div className="space-y-4">
          <Header title="היום ביחידה" subtitle={new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} onBell={()=>setNotificationsOpen(true)} unread={unread}/>
          <button onClick={()=>setManagementChatOpen(true)} className="w-full bg-gradient-to-l from-[#EEE1FF] to-[#F7EFFF] text-[#7047D7] rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center"><MessageCircle className="w-5 h-5"/></span><div className="text-right"><div className="font-black text-sm">צ׳אט מפקדים</div><div className="text-[10px] opacity-70">{managementMessages.length?`${managementMessages.length} הודעות`:'להתייעצויות ועדכונים בינינו'}</div></div></div><ChevronLeft className="w-4 h-4"/>
          </button>
          <div onClick={openBanner} className="relative h-32 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center cursor-pointer active:scale-[.99] transition-transform">
            <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&fit=crop" className="absolute inset-0 w-full h-full object-cover brightness-[0.92] saturate-[1.15]"/>
            <div className="relative text-center px-4"><h2 className="text-white text-2xl font-black">{bannerMessage}</h2><span className="text-[11px] text-white/80">לחץ לעריכת ההודעה ✎</span></div>
            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white"><Pencil className="w-3 h-3"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat title="חיילים בחופש" value={soldierOut.length} icon={<Users className="w-4 h-4"/>} onClick={()=>{setLeaveTab('soldier');setActiveTab('leaves')}}/>
            <Stat title="מפקדים בחופש" value={commanderOut.length} icon={<Crown className="w-4 h-4"/>} onClick={()=>{setLeaveTab('commander');setActiveTab('leaves')}}/>
            <Stat title="משימות פתוחות" value={openTasks.length} icon={<CheckSquare className="w-4 h-4"/>} onClick={()=>goTasks('open')}/>
            <Stat title="משימות באיחור" value={overdueTasks.length} icon={<AlertCircle className="w-4 h-4"/>} danger onClick={()=>goTasks('overdue')}/>
          </div>
          <Section title="היום בלו״ז" action="לכל השבוע" onAction={()=>setActiveTab('schedule')}>
            <div className="space-y-3">{todayEvents.length?todayEvents.map(e=><button key={e.id} onClick={()=>setSelectedEvent(e)} className="w-full flex items-center gap-3 text-right"><span className="text-xs font-bold text-slate-400 w-11">{e.time}</span><span className="w-2 h-2 rounded-full bg-[#7047D7]"/><span className="text-xs font-bold">{e.title}</span></button>):<Empty text="אין אירועים היום"/>}</div>
          </Section>
          <Section title="בחופשה היום 🌴" action="לכל החופשות" onAction={()=>setActiveTab('leaves')}>
            <div className="flex gap-3 overflow-x-auto">{currentLeaves.length?currentLeaves.map(l=><button key={l.id} onClick={()=>setSelectedLeave(l)} className="min-w-[92px] bg-slate-50 p-2.5 rounded-2xl"><img src={l.avatarUrl} className="w-10 h-10 rounded-full object-cover mx-auto"/><div className="text-xs font-bold mt-1">{l.name}</div><div className="text-[10px] text-slate-400">{l.type}</div></button>):<Empty text="אף אחד לא בחופש היום"/>}</div>
          </Section>
        </div>}

        {activeTab==='tasks' && <div className="space-y-4">
          <PageTitle title="משימות" subtitle="מעקב וניהול משימות היחידה" action={()=>openForm('task')}/>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 text-xs font-bold">
            {([['all','הכל'],['open','פתוחות'],['overdue','באיחור'],['done','הושלמו']] as const).map(([k,l])=><button key={k} onClick={()=>setTaskFilter(k)} className={`flex-1 py-2 rounded-xl ${taskFilter===k?'bg-[#7047D7] text-white':'text-slate-500'}`}>{l}</button>)}
          </div>
          <div className="space-y-2.5">{filteredTasks.length?filteredTasks.map(t=><button key={t.id} onClick={()=>setSelectedTask(t)} className="w-full bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-right">
            <div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center ${t.status==='completed'?'bg-[#DDF5E3] text-[#27824A]':overdueTasks.some(x=>x.id===t.id)?'bg-[#FFE4E4] text-[#D54A4A]':'bg-[#FFF1CE] text-[#D99A20]'}`}>{t.status==='completed'?<Check className="w-4 h-4"/>:overdueTasks.some(x=>x.id===t.id)?<AlertCircle className="w-4 h-4"/>:<Clock3 className="w-4 h-4"/>}</span><div><div className="font-extrabold text-sm">{t.title}</div><div className="text-[11px] text-slate-400 mt-1">{fmtDate(t.dueDate)} • אחראי: {t.responsibleName||'לא שויך'}</div><div className="text-[10px] text-slate-400 mt-1">עודכן ע״י {t.updatedBy}</div></div></div><ChevronLeft className="w-4 h-4 text-slate-300"/>
          </button>):<Empty text="אין משימות במסנן הזה"/>}</div>
        </div>}

        {activeTab==='leaves' && <div className="space-y-4">
          <PageTitle title="ניהול חופשות" subtitle="חיילים ומפקדים מחוץ לבסיס" action={()=>openForm('leave')}/>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 text-xs font-bold">
            <button onClick={()=>setLeaveTab('soldier')} className={`flex-1 py-2 rounded-xl ${leaveTab==='soldier'?'bg-[#7047D7] text-white':'text-slate-500'}`}>חיילים</button>
            <button onClick={()=>setLeaveTab('commander')} className={`flex-1 py-2 rounded-xl ${leaveTab==='commander'?'bg-[#7047D7] text-white':'text-slate-500'}`}>מפקדים</button>
            <button onClick={()=>setLeaveTab('reserve')} className={`flex-1 py-2 rounded-xl ${leaveTab==='reserve'?'bg-[#7047D7] text-white':'text-slate-500'}`}>מילואים</button>
          </div>

          <LeaveCalendar
            month={leaveMonth}
            selectedDay={leaveSelectedDay}
            leaves={leaves.filter(l=>l.category===leaveTab)}
            onSelect={setLeaveSelectedDay}
            onPrev={()=>setLeaveMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}
            onNext={()=>setLeaveMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}
            onToday={()=>{
              const d=new Date();
              setLeaveMonth(new Date(d.getFullYear(),d.getMonth(),1));
              setLeaveSelectedDay(todayISO());
            }}
          />

          <Section title={`${fmtDate(leaveSelectedDay)} • ${leaveTab==='soldier'?'חיילים':leaveTab==='reserve'?'מילואים':'מפקדים'} בחופש`}>
            <div className="space-y-2.5">
              {selectedDayLeaves.length ? selectedDayLeaves.map(l=><button key={l.id} onClick={()=>setSelectedLeave(l)} className="w-full bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between text-right">
                <div className="flex items-center gap-3"><img src={l.avatarUrl} className="w-10 h-10 rounded-full object-cover"/><div><div className="font-extrabold text-sm">{l.name}</div><div className="text-xs text-slate-400">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</div><div className="text-[10px] text-slate-400">נוסף ע״י {l.createdBy}</div></div></div><span className="text-[11px] font-extrabold bg-[#E0F5E5] text-[#277B47] px-3 py-1 rounded-xl">{l.type}</span>
              </button>) : <Empty text="אין חופשות ביום הזה"/>}
            </div>
          </Section>

          <Section title="כל החופשות">
            <div className="space-y-2.5">{leaves.filter(l=>l.category===leaveTab).map(l=><button key={l.id} onClick={()=>setSelectedLeave(l)} className="w-full bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between text-right">
              <div className="flex items-center gap-3"><img src={l.avatarUrl} className="w-10 h-10 rounded-full object-cover"/><div><div className="font-extrabold text-sm">{l.name}</div><div className="text-xs text-slate-400">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</div></div></div><span className="text-[11px] font-extrabold bg-[#E0F5E5] text-[#277B47] px-3 py-1 rounded-xl">{l.type}</span>
            </button>)}</div>
          </Section>
        </div>}

        {activeTab==='schedule' && <div className="space-y-4">
          <PageTitle title="לו״ז" subtitle="תכנון פעילות היחידה" action={()=>openForm('event')}/>
          <input type="date" value={selectedDay} onChange={e=>setSelectedDay(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl p-3 text-sm font-bold"/>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
            {events.filter(e=>e.date===selectedDay).sort((a,b)=>a.time.localeCompare(b.time)).map(e=><button key={e.id} onClick={()=>setSelectedEvent(e)} className={`w-full p-3 rounded-xl text-right border ${Number(e.time.slice(0,2))<10?'bg-[#E9E0FF] border-[#D8C8FF]':Number(e.time.slice(0,2))<13?'bg-[#DDF4E2] border-[#C7EBCF]':Number(e.time.slice(0,2))<15?'bg-[#FFE2E2] border-[#F6CCCC]':'bg-[#DDEEFF] border-[#C9E1F8]'}`}>
              <div className="flex justify-between"><span className="font-extrabold text-xs">{e.title}</span><span className="text-[10px]">{e.time}–{e.endTime}</span></div><div className="text-[10px] text-slate-500 mt-1">נוסף ע״י {e.createdBy}</div>
            </button>)}
            {!events.some(e=>e.date===selectedDay)&&<Empty text="אין אירועים בתאריך הזה"/>}
          </div>
        </div>}

        {activeTab==='people' && <div className="space-y-4">
          <PageTitle title="כוח אדם" subtitle="חיילים ומפקדים" action={()=>openForm('person')}/>
          {(['commander','soldier','reserve'] as Category[]).map(cat=><Section key={cat} title={cat==='commander'?'מפקדים':cat==='reserve'?'מילואים':'חיילים'}>
            <div className="space-y-2">{people.filter(p=>p.category===cat&&p.active).map(p=>{
              const out=currentLeaves.some(l=>l.personId===p.id);
              return <button key={p.id} onClick={()=>setSelectedPerson(p)} className="w-full flex items-center justify-between bg-slate-50 p-3 rounded-2xl text-right">
                <div className="flex items-center gap-3"><img src={p.avatarUrl} className="w-11 h-11 rounded-full object-cover"/><div><div className="font-extrabold text-sm">{p.name}</div><div className="text-[11px] text-slate-400">{p.category==='commander'?'מפקד/ת':p.category==='reserve'?'מילואים':'חייל/ת'}</div></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${out?'bg-amber-50 text-amber-700':'bg-[#E0F5E5] text-[#277B47]'}`}>{out?'בחופש':'ביחידה'}</span>
              </button>
            })}</div>
          </Section>)}
        </div>}
      </div>

      <nav className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-[24px] px-3 py-2 flex items-center justify-between shadow-[0_8px_28px_rgba(0,0,0,0.10)] pointer-events-auto">
          <Nav active={activeTab==='today'} icon={<Home/>} label="היום" onClick={()=>setActiveTab('today')}/>
          <Nav active={activeTab==='tasks'} icon={<CheckSquare/>} label="משימות" onClick={()=>setActiveTab('tasks')}/>
          <button onClick={()=>setQuickAdd(true)} className="w-14 h-14 rounded-full bg-[#7047D7] shadow-lg text-white flex items-center justify-center -mt-5"><Plus className="w-6 h-6"/></button>
          <Nav active={activeTab==='leaves'} icon={<Palmtree/>} label="חופשות" onClick={()=>setActiveTab('leaves')}/>
          <Nav active={activeTab==='schedule'} icon={<CalendarDays/>} label="לו״ז" onClick={()=>setActiveTab('schedule')}/>
          <Nav active={activeTab==='people'} icon={<Users/>} label="אנשים" onClick={()=>setActiveTab('people')}/>
        </div>
      </nav>

      {quickAdd&&<Modal title="הוספה חדשה" onClose={()=>setQuickAdd(false)}>
        <Action icon={<CheckSquare/>} title="הוספת משימה" onClick={()=>openForm('task')}/>
        <Action icon={<Palmtree/>} title="הוספת חופשה" onClick={()=>openForm('leave')}/>
        <Action icon={<Calendar/>} title="הוספת אירוע בלו״ז" onClick={()=>openForm('event')}/>
        <Action icon={<UserRound/>} title="הוספת אדם" onClick={()=>openForm('person')}/>
      </Modal>}

      {formType&&<Editor type={formType} editingId={editingId} people={people} tasks={tasks} leaves={leaves} events={events}
        onClose={()=>{setFormType(null);setEditingId(null)}}
        onPerson={(p,isEdit)=>{setPeople(xs=>isEdit?xs.map(x=>x.id===p.id?p:x):[...xs,p]);notify(`${CURRENT_USER} ${isEdit?'עדכנה':'הוסיפה'} את ${p.name}`,'people',p.id)}}
        onTask={(t,isEdit)=>{setTasks(xs=>isEdit?xs.map(x=>x.id===t.id?t:x):[t,...xs]);notify(`${CURRENT_USER} ${isEdit?'עדכנה':'הוסיפה'} משימה: ${t.title}`,'tasks',t.id);setSelectedTask(null)}}
        onLeave={(l,isEdit)=>{setLeaves(xs=>isEdit?xs.map(x=>x.id===l.id?l:x):[l,...xs]);notify(`${CURRENT_USER} ${isEdit?'עדכנה':'הוסיפה'} חופש ל${l.name}`,'leaves',l.id);setSelectedLeave(null)}}
        onEvent={(e,isEdit)=>{setEvents(xs=>isEdit?xs.map(x=>x.id===e.id?e:x):[e,...xs]);notify(`${CURRENT_USER} ${isEdit?'עדכנה':'הוסיפה'} אירוע: ${e.title}`,'schedule',e.id);setSelectedEvent(null)}}
      />}

      {selectedTask&&<Detail title="פרטי משימה" onClose={()=>setSelectedTask(null)} onEdit={()=>openForm('task',selectedTask.id)} onDelete={()=>deleteEntity('task',selectedTask.id)}
        meta={`נוצר ע״י ${selectedTask.createdBy} • ${selectedTask.createdAt}`} comments={selectedTask.comments} audit={selectedTask.audit} comment={comment} setComment={setComment} onComment={()=>addComment('task',selectedTask.id)}>
        <h2 className="text-xl font-black">{selectedTask.title}</h2><p className="text-sm text-slate-600">{selectedTask.description}</p><Info label="אחראי" value={selectedTask.responsibleName}/><Info label="תאריך יעד" value={fmtDate(selectedTask.dueDate)}/><Info label="סטטוס" value={selectedTask.status}/>
        {selectedTask.status!=='completed'&&<button onClick={()=>{const updated={...selectedTask,status:'completed' as TaskStatus,updatedBy:CURRENT_USER,updatedAt:nowText(),audit:[...selectedTask.audit,{id:uid(),actor:CURRENT_USER,text:'סימנה את המשימה כהושלמה',at:nowText()}]};setTasks(xs=>xs.map(x=>x.id===updated.id?updated:x));setSelectedTask(updated);notify(`${CURRENT_USER} השלימה את "${updated.title}"`,'tasks',updated.id)}} className="w-full bg-emerald-600 text-white p-3 rounded-2xl font-bold">סימון כהושלמה</button>}
      </Detail>}

      {selectedLeave&&<Detail title="פרטי חופש" onClose={()=>setSelectedLeave(null)} onEdit={()=>openForm('leave',selectedLeave.id)} onDelete={()=>deleteEntity('leave',selectedLeave.id)}
        meta={`נוסף ע״י ${selectedLeave.createdBy} • ${selectedLeave.createdAt}`} comments={selectedLeave.comments} audit={selectedLeave.audit} comment={comment} setComment={setComment} onComment={()=>addComment('leave',selectedLeave.id)}>
        <h2 className="text-xl font-black">{selectedLeave.name}</h2><Info label="סוג" value={selectedLeave.type}/><Info label="תאריכים" value={`${fmtDate(selectedLeave.startDate)} – ${fmtDate(selectedLeave.endDate)}`}/><p className="text-sm">{selectedLeave.note}</p>
      </Detail>}

      {selectedEvent&&<Detail title="אירוע בלו״ז" onClose={()=>setSelectedEvent(null)} onEdit={()=>openForm('event',selectedEvent.id)} onDelete={()=>deleteEntity('event',selectedEvent.id)}
        meta={`נוסף ע״י ${selectedEvent.createdBy} • ${selectedEvent.createdAt}`} comments={selectedEvent.comments} audit={selectedEvent.audit} comment={comment} setComment={setComment} onComment={()=>addComment('event',selectedEvent.id)}>
        <h2 className="text-xl font-black">{selectedEvent.title}</h2><Info label="תאריך" value={fmtDate(selectedEvent.date)}/><Info label="שעה" value={`${selectedEvent.time} – ${selectedEvent.endTime}`}/><p className="text-sm">{selectedEvent.description}</p>
      </Detail>}

      {selectedPerson&&<div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-[440px] mx-auto" dir="rtl">
        <Top title="פרופיל אישי" onClose={()=>setSelectedPerson(null)}/>
        <div className="text-center py-4"><img src={selectedPerson.avatarUrl} className="w-24 h-24 rounded-full object-cover mx-auto"/><h2 className="text-xl font-black mt-2">{selectedPerson.name}</h2><p className="text-sm text-slate-500">{selectedPerson.category==='commander'?'מפקד/ת':selectedPerson.category==='reserve'?'מילואים':'חייל/ת'}</p></div>
        <Info label="סוג" value={selectedPerson.category==='commander'?'מפקד/ת':selectedPerson.category==='reserve'?'מילואים':'חייל/ת'}/>
        <div className="grid grid-cols-2 gap-2 my-4"><button onClick={()=>openForm('person',selectedPerson.id)} className="bg-[#7047D7] text-white p-3 rounded-2xl font-bold">עריכת פרטים</button><button onClick={()=>openForm('leave')} className="bg-white border p-3 rounded-2xl font-bold">הוספת חופש</button><button onClick={()=>{if(confirm(`למחוק את ${selectedPerson.name} מכוח האדם? המשימות והחופשות הקיימות יישמרו.`)){setPeople(xs=>xs.map(x=>x.id===selectedPerson.id?{...x,active:false}:x));notify(`${CURRENT_USER} הסירה את ${selectedPerson.name} מכוח האדם`,'people',selectedPerson.id);setSelectedPerson(null)}}} className="col-span-2 bg-[#FFE8E8] text-[#C84242] p-3 rounded-2xl font-bold">מחיקה מכוח האדם</button></div>
        <Section title="תורנויות ושמירות">
          <div className="space-y-2">
            <button onClick={()=>{setDutyPersonId(selectedPerson.id);setDutyFormOpen(true)}} className="w-full bg-gradient-to-l from-[#FFF0D8] to-[#FFF8EB] text-[#A96C15] p-3 rounded-2xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>הוספת תורנות / שמירה / שבת</button>
            {duties.filter(d=>d.personId===selectedPerson.id&&d.active).map(d=><div key={d.id} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between"><div><div className="font-extrabold text-sm">{d.type}</div><div className="text-[10px] text-slate-400">{fmtDate(d.startDate)}{d.endDate!==d.startDate?` – ${fmtDate(d.endDate)}`:''}{d.startTime?` • ${d.startTime}${d.endTime?`–${d.endTime}`:''}`:''}</div>{d.note&&<div className="text-xs mt-1">{d.note}</div>}<div className="text-[9px] text-slate-400 mt-1">הוזן ע״י {d.createdBy}</div></div><button onClick={()=>{if(confirm('למחוק את הרשומה?'))setDuties(xs=>xs.map(x=>x.id===d.id?{...x,active:false}:x))}} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5"/></button></div>)}
            {!duties.some(d=>d.personId===selectedPerson.id&&d.active)&&<Empty text="אין תורנויות או שמירות"/>}
          </div>
        </Section><div className="h-3"/><Section title="משימות"><div className="space-y-2">{tasks.filter(t=>t.responsibleId===selectedPerson.id).map(t=><button key={t.id} onClick={()=>{setSelectedPerson(null);setSelectedTask(t)}} className="w-full bg-slate-50 p-3 rounded-xl text-right text-sm font-bold">{t.title}</button>)}{!tasks.some(t=>t.responsibleId===selectedPerson.id)&&<Empty text="אין משימות"/>}</div></Section>
        <div className="h-3"/><Section title="חופשות"><div className="space-y-2">{leaves.filter(l=>l.personId===selectedPerson.id).map(l=><div key={l.id} className="bg-slate-50 p-3 rounded-xl text-sm">{l.type} • {fmtDate(l.startDate)}–{fmtDate(l.endDate)}</div>)}{!leaves.some(l=>l.personId===selectedPerson.id)&&<Empty text="אין חופשות"/>}</div></Section>
      </div>}

      {dutyFormOpen&&<Modal title="הוספת תורנות / שמירה" onClose={()=>setDutyFormOpen(false)}>
        <div className="space-y-3">
          <select value={dutyPersonId||selectedPerson?.id||''} onChange={e=>setDutyPersonId(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm">
            <option value="">בחירת אדם</option>{people.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">{(['תורנות','שמירה','סגירת שבת'] as DutyType[]).map(t=><button key={t} onClick={()=>setDutyType(t)} className={`py-2.5 rounded-xl text-xs font-bold ${dutyType===t?'bg-[#7047D7] text-white':'bg-slate-50 text-slate-500'}`}>{t}</button>)}</div>
          <div className="grid grid-cols-2 gap-2"><div><div className="text-[10px] text-slate-400 mb-1">מתאריך</div><input type="date" value={dutyStartDate} onChange={e=>setDutyStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"/></div><div><div className="text-[10px] text-slate-400 mb-1">עד תאריך</div><input type="date" value={dutyEndDate} onChange={e=>setDutyEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"/></div></div>
          {dutyType!=='סגירת שבת'&&<div className="grid grid-cols-2 gap-2"><input type="time" value={dutyStartTime} onChange={e=>setDutyStartTime(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"/><input type="time" value={dutyEndTime} onChange={e=>setDutyEndTime(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"/></div>}
          <textarea value={dutyNote} onChange={e=>setDutyNote(e.target.value)} placeholder="הערה (אופציונלי)" className="w-full p-3 bg-slate-50 border rounded-2xl text-sm"/>
          <button onClick={addDuty} className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-bold">שמירה</button>
        </div>
      </Modal>}

      {managementChatOpen&&<div className="fixed inset-0 z-50 bg-[#F8F6F2] max-w-[440px] mx-auto flex flex-col" dir="rtl">
        <div className="p-4"><Top title="צ׳אט מפקדים" onClose={()=>setManagementChatOpen(false)}/></div>
        <div className="px-4 pb-2"><div className="bg-[#EEE1FF] text-[#7047D7] rounded-2xl p-3 text-xs font-bold">💬 מקום להתייעצויות ועדכונים שלא קשורים לפריט מסוים</div></div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {managementMessages.length?managementMessages.map(m=><div key={m.id} className={`flex gap-2 ${m.author===CURRENT_USER?'flex-row':'flex-row-reverse'}`}><img src={m.avatarUrl} className="w-8 h-8 rounded-full object-cover"/><div className={`max-w-[78%] p-3 rounded-2xl ${m.author===CURRENT_USER?'bg-[#7047D7] text-white':'bg-white border'}`}><div className="text-[10px] font-black opacity-75">{m.author}</div><div className="text-sm mt-0.5">{m.text}</div><div className="text-[8px] opacity-60 mt-1">{m.at}</div></div></div>):<Empty text="עוד אין הודעות. מישהי צריכה להתחיל 😌"/>}
        </div>
        <div className="p-4 bg-white border-t flex gap-2"><input value={managementText} onChange={e=>setManagementText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendManagementMessage()}} placeholder="כתיבת הודעה..." className="flex-1 bg-slate-50 border rounded-2xl p-3 text-sm"/><button onClick={sendManagementMessage} className="w-12 rounded-2xl bg-[#7047D7] text-white flex items-center justify-center"><MessageCircle className="w-5 h-5"/></button></div>
      </div>}

      {notificationsOpen&&<div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-[440px] mx-auto" dir="rtl">
        <Top title="התראות" onClose={()=>setNotificationsOpen(false)}/>
        <button onClick={()=>setNotifications(n=>n.map(x=>({...x,read:true})))} className="text-xs font-bold text-[#7047D7] my-3">סימון הכל כנקרא</button>
        <div className="space-y-2">{notifications.map(n=><button key={n.id} onClick={()=>{setNotifications(xs=>xs.map(x=>x.id===n.id?{...x,read:true}:x));setNotificationsOpen(false);setActiveTab(n.target)}} className={`w-full p-4 rounded-2xl border text-right ${n.read?'bg-white':'bg-purple-50 border-purple-100'}`}><div className="text-sm font-bold">{n.text}</div><div className="text-[10px] text-slate-400 mt-1">{n.at}</div></button>)}</div>
      </div>}

      {isEditingBanner&&<Modal title="עריכת הודעת הבאנר" onClose={()=>setIsEditingBanner(false)}>
        <input value={tempBannerInput} onChange={e=>setTempBannerInput(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-sm" autoFocus/>
        <button onClick={saveBanner} className="w-full bg-[#7047D7] text-white p-3 rounded-2xl font-bold mt-3">שמור</button>
      </Modal>}
    </div>
  </div>
}


function LeaveCalendar({month,selectedDay,leaves,onSelect,onPrev,onNext,onToday}:{month:Date;selectedDay:string;leaves:Leave[];onSelect:(d:string)=>void;onPrev:()=>void;onNext:()=>void;onToday:()=>void}){
  const year=month.getFullYear(), mon=month.getMonth();
  const first=new Date(year,mon,1);
  const daysInMonth=new Date(year,mon+1,0).getDate();
  const offset=first.getDay();
  const cells:(number|null)[]=[...Array(offset).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while(cells.length%7) cells.push(null);
  const iso=(day:number)=>`${year}-${String(mon+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const hasLeave=(day:number)=>leaves.some(l=>l.startDate<=iso(day)&&l.endDate>=iso(day));
  const count=(day:number)=>leaves.filter(l=>l.startDate<=iso(day)&&l.endDate>=iso(day)).length;
  const monthName=new Intl.DateTimeFormat('he-IL',{month:'long',year:'numeric'}).format(month);
  const weekdays=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  return <div className="bg-white rounded-3xl p-4 border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <button onClick={onPrev} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center"><ChevronRight className="w-4 h-4"/></button>
      <div className="text-center"><div className="font-black text-sm">{monthName}</div><button onClick={onToday} className="text-[10px] text-[#7047D7] font-bold mt-0.5">חזרה להיום</button></div>
      <button onClick={onNext} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center"><ChevronLeft className="w-4 h-4"/></button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center mb-1">{weekdays.map(w=><div key={w} className="text-[10px] font-bold text-slate-400 py-1">{w}</div>)}</div>
    <div className="grid grid-cols-7 gap-1">
      {cells.map((day,i)=>day===null?<div key={i} className="aspect-square"/>:<button key={i} onClick={()=>onSelect(iso(day))} className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition ${selectedDay===iso(day)?'bg-[#7047D7] text-white':'bg-[#F4F2EF] text-slate-700 active:bg-purple-50'}`}>
        <span>{day}</span>
        {hasLeave(day)&&<span className={`absolute bottom-1 min-w-1.5 h-1.5 px-0.5 rounded-full ${selectedDay===iso(day)?'bg-white':'bg-[#8BD7A2]'}`}>{count(day)>1?<span className="sr-only">{count(day)}</span>:null}</span>}
      </button>)}
    </div>
    <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-[#8BD7A2]"/><span>יש חופש ביום הזה</span></div>
  </div>
}

function Header({title,subtitle,onBell,unread}:{title:string;subtitle:string;onBell:()=>void;unread:number}){
  return <div className="flex items-center justify-between"><div><div className="flex items-center gap-1 text-xs font-semibold text-[#7047D7]"><Sparkles className="w-3.5 h-3.5"/>היחידה שלנו</div><h1 className="text-[25px] font-black mt-0.5">{title}</h1><p className="text-xs text-slate-400">{subtitle}</p></div><button onClick={onBell} className="relative w-10 h-10 rounded-2xl bg-white border flex items-center justify-center"><Bell className="w-4 h-4"/>{unread>0&&<span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] min-w-4 h-4 px-1 rounded-full">{unread}</span>}</button></div>
}
function PageTitle({title,subtitle,action}:{title:string;subtitle:string;action:()=>void}){return <div className="flex items-center justify-between"><div><h1 className="text-[25px] font-black">{title}</h1><p className="text-xs text-slate-400">{subtitle}</p></div><button onClick={action} className="w-10 h-10 rounded-2xl bg-white border flex items-center justify-center"><Plus className="w-5 h-5"/></button></div>}
function Stat({title,value,icon,onClick,danger=false}:{title:string;value:number;icon:React.ReactNode;onClick:()=>void;danger?:boolean}){
  const palette = danger
    ? 'from-[#FFE7E7] to-[#FFF1F1] text-[#C84343]'
    : title.includes('מפקדים')
      ? 'from-[#EFE4FF] to-[#F7F0FF] text-[#7047D7]'
      : title.includes('חיילים')
        ? 'from-[#DDF1FF] to-[#EDF8FF] text-[#287EB8]'
        : 'from-[#DDF5E3] to-[#ECFAEF] text-[#27824A]';
  return <button onClick={onClick} className={`bg-gradient-to-br ${palette} p-4 rounded-2xl text-right active:scale-[.98] shadow-sm min-h-[104px]`}>
    <div className="flex items-start justify-between">
      <div><div className="text-3xl font-black leading-none">{value}</div><div className="text-[11px] font-extrabold mt-2">{title}</div></div>
      <span className="w-9 h-9 rounded-full bg-white/65 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
    </div>
  </button>
}
function Section({title,action,onAction,children}:{title:string;action?:string;onAction?:()=>void;children:React.ReactNode}){return <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/70"><div className="flex justify-between mb-4"><h3 className="font-extrabold text-sm">{title}</h3>{action&&<button onClick={onAction} className="text-xs text-[#7047D7] font-bold">{action}</button>}</div>{children}</div>}
function Empty({text}:{text:string}){return <div className="text-xs text-slate-400 text-center py-4">{text}</div>}
function Nav({active,icon,label,onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}){return <button onClick={onClick} className={`flex flex-col items-center py-1 ${active?'text-[#7047D7]':'text-slate-400'}`}><span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span><span className="text-[9px] mt-1 font-bold">{label}</span></button>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl"><div className="w-full max-w-[380px] bg-white rounded-3xl p-5 max-h-[88vh] overflow-y-auto"><div className="flex justify-between mb-4"><button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button><h3 className="font-extrabold">{title}</h3><span className="w-5"/></div>{children}</div></div>}
function Action({icon,title,onClick}:{icon:React.ReactNode;title:string;onClick:()=>void}){
  const style=title.includes('משימה')?'from-[#EEE1FF] to-[#F7EFFF] text-[#7047D7]':title.includes('חופ')?'from-[#DDF5E3] to-[#EEFAF1] text-[#25834B]':title.includes('לו״ז')?'from-[#DDEFFF] to-[#EEF7FF] text-[#277DB7]':'from-[#FFF0D8] to-[#FFF7E9] text-[#B87318]';
  return <button onClick={onClick} className={`w-full bg-gradient-to-br ${style} p-5 rounded-2xl flex gap-4 items-center mb-3 min-h-[90px]`}>
    <span className="w-12 h-12 rounded-2xl bg-white/65 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">{icon}</span>
    <span className="font-black text-base">{title}</span>
  </button>
}
function Top({title,onClose}:{title:string;onClose:()=>void}){return <div className="flex items-center justify-between"><button onClick={onClose} className="w-10 h-10 bg-white border rounded-2xl flex items-center justify-center"><ChevronRight className="w-5 h-5"/></button><h2 className="font-extrabold">{title}</h2><span className="w-10"/></div>}
function Info({label,value}:{label:string;value:string}){return <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl my-1"><div className="text-[10px] text-slate-400 font-bold">{label}</div><div className="text-sm font-extrabold mt-0.5">{value}</div></div>}

function Detail({title,onClose,onEdit,onDelete,meta,comments,audit,comment,setComment,onComment,children}:{title:string;onClose:()=>void;onEdit:()=>void;onDelete:()=>void;meta:string;comments:Comment[];audit:Audit[];comment:string;setComment:(x:string)=>void;onComment:()=>void;children:React.ReactNode}){
  return <div className="fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-4 max-w-[440px] mx-auto" dir="rtl"><Top title={title} onClose={onClose}/><div className="space-y-3 mt-4"><div className="bg-white p-4 rounded-3xl border space-y-2">{children}<div className="text-[10px] text-slate-400 pt-2">{meta}</div></div><div className="flex gap-2"><button onClick={onEdit} className="flex-1 bg-[#7047D7] text-white p-3 rounded-2xl font-bold flex items-center justify-center gap-2"><Pencil className="w-4 h-4"/>עריכה</button><button onClick={onDelete} className="px-4 bg-[#FFE8E8] text-[#C84242] rounded-2xl"><Trash2 className="w-4 h-4"/></button></div><Section title="צ׳אט"><div className="space-y-2">{comments.map(c=><div key={c.id} className="bg-slate-50 p-3 rounded-2xl"><div className="text-xs font-extrabold">{c.author}</div><div className="text-sm mt-1">{c.text}</div><div className="text-[9px] text-slate-400 mt-1">{c.at}</div></div>)}<div className="flex gap-2"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="כתיבת תגובה..." className="flex-1 bg-slate-50 border rounded-2xl p-3 text-sm"/><button onClick={onComment} className="bg-[#7047D7] text-white px-4 rounded-2xl"><MessageCircle className="w-4 h-4"/></button></div></div></Section><Section title="היסטוריית פעילות"><div className="space-y-2">{audit.map(a=><div key={a.id} className="text-xs border-r-2 border-purple-200 pr-3"><b>{a.actor}</b> {a.text}<div className="text-[9px] text-slate-400">{a.at}</div></div>)}</div></Section></div></div>
}

function Editor({type,editingId,people,tasks,leaves,events,onClose,onPerson,onTask,onLeave,onEvent}:{type:'task'|'leave'|'event'|'person';editingId:string|null;people:Person[];tasks:Task[];leaves:Leave[];events:ScheduleEvent[];onClose:()=>void;onPerson:(p:Person,e:boolean)=>void;onTask:(t:Task,e:boolean)=>void;onLeave:(l:Leave,e:boolean)=>void;onEvent:(ev:ScheduleEvent,e:boolean)=>void}){
  const old:any = type==='task'?tasks.find(x=>x.id===editingId):type==='leave'?leaves.find(x=>x.id===editingId):type==='event'?events.find(x=>x.id===editingId):people.find(x=>x.id===editingId);
  const [f,setF]=useState<any>(old||{});
  const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}));
  const input="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm";
  const save=()=>{
    const isEdit=!!old, at=nowText();
    if(type==='person'){
      if(!f.name?.trim())return alert('צריך להזין שם');
      const p:Person={id:old?.id||uid(),name:f.name,category:f.category||'soldier',notes:f.notes||'',avatarUrl:f.avatarUrl||'/avatars/human-01.jpg',active:f.active??true};onPerson(p,isEdit);
    }
    if(type==='task'){
      if(!f.title?.trim())return alert('צריך להזין שם משימה'); const p=people.find(x=>x.id===f.responsibleId)||people[0];
      const t:Task={id:old?.id||uid(),title:f.title,dueDate:f.dueDate||todayISO(),dueTime:f.dueTime||'',responsibleId:p?.id||'',responsibleName:p?.name||'',avatarUrl:p?.avatarUrl||'',imageUrl:f.imageUrl||'',status:f.status||'open',description:f.description||'',createdBy:old?.createdBy||CURRENT_USER,createdAt:old?.createdAt||at,updatedBy:CURRENT_USER,updatedAt:at,comments:old?.comments||[],audit:[...(old?.audit||[]),{id:uid(),actor:CURRENT_USER,text:isEdit?'ערכה את המשימה':'יצרה את המשימה',at}]};onTask(t,isEdit);
    }
    if(type==='leave'){
      const p=people.find(x=>x.id===f.personId)||people[0]; if(!p)return alert('צריך להוסיף אדם קודם');
      const l:Leave={id:old?.id||uid(),personId:p.id,name:p.name,type:f.type||'חופש',startDate:f.startDate||todayISO(),endDate:f.endDate||todayISO(),avatarUrl:p.avatarUrl,category:p.category,note:f.note||'',createdBy:old?.createdBy||CURRENT_USER,createdAt:old?.createdAt||at,updatedBy:CURRENT_USER,updatedAt:at,comments:old?.comments||[],audit:[...(old?.audit||[]),{id:uid(),actor:CURRENT_USER,text:isEdit?'ערכה את החופש':'הוסיפה חופש',at}]};onLeave(l,isEdit);
    }
    if(type==='event'){
      if(!f.title?.trim())return alert('צריך להזין כותרת');
      const e:ScheduleEvent={id:old?.id||uid(),title:f.title,date:f.date||todayISO(),time:f.time||'08:00',endTime:f.endTime||'09:00',description:f.description||'',personIds:f.personIds||[],createdBy:old?.createdBy||CURRENT_USER,createdAt:old?.createdAt||at,updatedBy:CURRENT_USER,updatedAt:at,comments:old?.comments||[],audit:[...(old?.audit||[]),{id:uid(),actor:CURRENT_USER,text:isEdit?'ערכה את האירוע':'הוסיפה אירוע',at}]};onEvent(e,isEdit);
    }
    onClose();
  };
  return <Modal title={`${editingId?'עריכת':'הוספת'} ${type==='task'?'משימה':type==='leave'?'חופש':type==='event'?'אירוע':'אדם'}`} onClose={onClose}><div className="space-y-3">
    {type==='person'&&<><input className={input} placeholder="שם" value={f.name||''} onChange={e=>set('name',e.target.value)}/><select className={input} value={f.category||'soldier'} onChange={e=>set('category',e.target.value)}><option value="soldier">חייל/ת</option><option value="commander">מפקד/ת</option><option value="reserve">מילואים</option></select><div><div className="text-xs font-extrabold mb-2">בחירת אווטאר</div><div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto bg-[#F8F6F2] p-2 rounded-2xl border border-slate-100">{AVATARS.map(a=><button type="button" key={a.id} onClick={()=>set('avatarUrl',a.src)} title={a.label} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition ${f.avatarUrl===a.src?'border-[#7047D7] ring-2 ring-[#7047D7]/20':'border-transparent'}`}><img src={a.src} className="w-full h-full object-cover"/>{a.id==='cat-diva'&&<span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[8px] py-0.5">דיווה ✨</span>}{f.avatarUrl===a.src&&<span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#7047D7] text-white flex items-center justify-center"><Check className="w-3 h-3"/></span>}</button>)}</div><div className="text-[10px] text-slate-400 mt-1">אפשר להחליף אווטאר בכל שלב</div></div><textarea className={input} placeholder="הערות (אופציונלי)" value={f.notes||''} onChange={e=>set('notes',e.target.value)}/></>}
    {type==='task'&&<><input className={input} placeholder="שם המשימה" value={f.title||''} onChange={e=>set('title',e.target.value)}/><textarea className={input} placeholder="פירוט" value={f.description||''} onChange={e=>set('description',e.target.value)}/><select className={input} value={f.responsibleId||people[0]?.id||''} onChange={e=>set('responsibleId',e.target.value)}>{people.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="date" className={input} value={f.dueDate||todayISO()} onChange={e=>set('dueDate',e.target.value)}/><input type="time" className={input} value={f.dueTime||''} onChange={e=>set('dueTime',e.target.value)}/><select className={input} value={f.status||'open'} onChange={e=>set('status',e.target.value)}><option value="open">פתוחה</option><option value="in_progress">בביצוע</option><option value="completed">הושלמה</option><option value="overdue">באיחור</option></select><input className={input} placeholder="קישור לתמונה (זמני עד Firebase)" value={f.imageUrl||''} onChange={e=>set('imageUrl',e.target.value)}/></>}
    {type==='leave'&&<><select className={input} value={f.personId||people[0]?.id||''} onChange={e=>set('personId',e.target.value)}>{people.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className={input} value={f.type||'חופש'} onChange={e=>set('type',e.target.value)}><option>חופש</option><option>גימלים</option><option>קורס</option><option>אפטר</option><option>תמ״ל</option></select><input type="date" className={input} value={f.startDate||todayISO()} onChange={e=>set('startDate',e.target.value)}/><input type="date" className={input} value={f.endDate||todayISO()} onChange={e=>set('endDate',e.target.value)}/><textarea className={input} placeholder="הערה" value={f.note||''} onChange={e=>set('note',e.target.value)}/></>}
    {type==='event'&&<><input className={input} placeholder="כותרת האירוע" value={f.title||''} onChange={e=>set('title',e.target.value)}/><input type="date" className={input} value={f.date||todayISO()} onChange={e=>set('date',e.target.value)}/><div className="grid grid-cols-2 gap-2"><input type="time" className={input} value={f.time||'08:00'} onChange={e=>set('time',e.target.value)}/><input type="time" className={input} value={f.endTime||'09:00'} onChange={e=>set('endTime',e.target.value)}/></div><textarea className={input} placeholder="פירוט" value={f.description||''} onChange={e=>set('description',e.target.value)}/></>}
    <button onClick={save} className="w-full bg-[#7047D7] text-white p-3.5 rounded-2xl font-bold flex justify-center items-center gap-2"><Save className="w-4 h-4"/>שמירה</button>
  </div></Modal>
}
