import React, { useState } from 'react';
import { 
  Home, 
  CheckSquare, 
  Plus, 
  Calendar, 
  CalendarDays, 
  Bell, 
  Search, 
  SlidersHorizontal, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Crown, 
  AlertCircle, 
  Palmtree, 
  X, 
  Check,
  Pencil,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  responsibleName: string;
  avatarUrl: string;
  imageUrl?: string;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  description?: string;
}

interface Leave {
  id: string;
  name: string;
  type: 'חופש' | 'גימלים' | 'קורס' | 'אפטר';
  dateRange: string;
  avatarUrl: string;
  category: 'soldier' | 'commander';
}

interface ScheduleEvent {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  dayIndex: number;
  badgeColor: string;
  dotColor: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'tasks' | 'leaves' | 'schedule'>('today');
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'overdue' | 'done'>('all');
  const [leaveTab, setLeaveTab] = useState<'soldiers' | 'commanders'>('soldiers');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [bannerMessage, setBannerMessage] = useState<string>(() => {
    return localStorage.getItem('unit_banner_message') || 'יום טוב ומנצח! ✨';
  });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [tempBannerInput, setTempBannerInput] = useState('');

  const handleOpenEditBanner = () => {
    setTempBannerInput(bannerMessage);
    setIsEditingBanner(true);
  };

  const handleSaveBanner = () => {
    const trimmed = tempBannerInput.trim();
    if (trimmed) {
      setBannerMessage(trimmed);
      localStorage.setItem('unit_banner_message', trimmed);
    }
    setIsEditingBanner(false);
  };

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'להכין ציוד לאימון',
      dueDate: '15.10.24',
      responsibleName: 'דניאל',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=240&h=240&fit=crop',
      status: 'overdue',
      description: 'להכין את כל הציוד לקראת אימון פלוגתי:\n- וסטים מותאמים\n- קסדות מאובזרות\n- קשר ותדרי חמ"ל\n- מים ומנות קרב'
    },
    {
      id: '2',
      title: 'להעביר רשימת חיילים',
      dueDate: '16.10.24',
      responsibleName: 'שיר',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=240&h=240&fit=crop',
      status: 'in_progress',
      description: 'סגירת רשימה שמית סופית של מחלקה 2 לקראת היציאות'
    },
    {
      id: '3',
      title: 'לתאם הסעות שבועיות',
      dueDate: '18.10.24',
      responsibleName: 'לוי',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=240&h=240&fit=crop',
      status: 'completed',
      description: 'תיאום אוטובוס לבסיס צאלים מול מוקד היסעים'
    },
    {
      id: '4',
      title: 'עדכון נוהל שבת',
      dueDate: '20.10.24',
      responsibleName: 'מאיה',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=240&h=240&fit=crop',
      status: 'open',
      description: 'רענון פקודות ותדריך יציאות לסופ״ש הקרוב'
    }
  ]);

  const leaves: Leave[] = [
    { id: '1', name: 'סמל לוי', type: 'חופש', dateRange: '15.10 – 17.10', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face', category: 'soldier' },
    { id: '2', name: 'רב״ט כהן', type: 'חופש', dateRange: '22.10 – 24.10', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face', category: 'soldier' },
    { id: '3', name: 'טוראי דניאל', type: 'גימלים', dateRange: '07.10 – 08.10', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face', category: 'soldier' },
    { id: '4', name: 'סג״ם מאיה', type: 'קורס', dateRange: '28.10 – 30.10', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face', category: 'commander' }
  ];

  const scheduleEvents: ScheduleEvent[] = [
    { id: '1', time: '08:00', endTime: '09:00', title: 'מסדר ותדריך בוקר', dayIndex: 2, badgeColor: 'bg-purple-50 text-[#5B4B67] border-purple-200/60', dotColor: 'bg-[#5B4B67]' },
    { id: '2', time: '10:00', endTime: '12:00', title: 'אימון פלוגתי מרוכז', dayIndex: 2, badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200/60', dotColor: 'bg-emerald-500' },
    { id: '3', time: '13:00', endTime: '14:00', title: 'ישיבת מפקדי צוותים', dayIndex: 2, badgeColor: 'bg-amber-50 text-amber-900 border-amber-200/60', dotColor: 'bg-amber-500' },
    { id: '4', time: '16:00', endTime: '17:00', title: 'סיכום יום ופקודות', dayIndex: 2, badgeColor: 'bg-blue-50 text-blue-900 border-blue-200/60', dotColor: 'bg-blue-500' }
  ];

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'open') return t.status === 'open';
    if (taskFilter === 'overdue') return t.status === 'overdue';
    if (taskFilter === 'done') return t.status === 'completed';
    return true;
  });

  return (
    <div className="flex justify-center bg-[#18181B] min-h-screen font-sans antialiased text-slate-800" dir="rtl">
      <div className="w-full max-w-[440px] bg-[#FAF9F6] min-h-screen flex flex-col relative pb-28 shadow-2xl overflow-hidden border-x border-slate-200/40">
        
        {/* תוכן ראשי */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6">
          
          {/* ================= מסך ראשי: היום ================= */}
          {activeTab === 'today' && (
            <div className="space-y-4">
              
              {/* כותרת עליונה בסגנון מודרני */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B4B67]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>היחידה שלנו</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">היום ביחידה</h1>
                  <p className="text-xs text-slate-400 font-medium">יום שלישי, 15 באוקטובר 2024</p>
                </div>
                <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600 active:scale-95 transition-all">
                  <Bell className="w-4 h-4" />
                </button>
              </div>

              {/* באנר פנורמי מודרני בעיצוב נקי עם זכוכית מעושנת */}
              <div 
                onClick={handleOpenEditBanner}
                className="relative h-32 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center cursor-pointer group active:scale-[0.99] transition-transform"
              >
                <img 
                  src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&fit=crop" 
                  alt="באנר" 
                  className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />
                
                <div className="relative text-center px-4">
                  <h2 className="text-white text-2xl font-black drop-shadow-md tracking-wide">
                    {bannerMessage}
                  </h2>
                  <span className="text-[11px] text-white/80 font-medium tracking-wider mt-1 block">לחץ לעריכת ההודעה ✎</span>
                </div>

                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white">
                  <Pencil className="w-3 h-3" />
                </div>
              </div>

              {/* 4 כרטיסי סטטוס בסטייל מודרני מרווח */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">חיילים בחופש</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">3</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">מתוך 24 סדיר</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">מפקדים בחופש</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5B4B67] flex items-center justify-center">
                      <Crown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">1</div>
                  <div className="text-[10px] text-purple-600 font-semibold mt-1">מפקד תורן נוכח</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">משימות פתוחות</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">5</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">2 בביצוע כעת</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">משימות באיחור</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-rose-600 mt-2">2</div>
                  <div className="text-[10px] text-rose-500 font-medium mt-1">דורש טיפול מיידי</div>
                </div>
              </div>

              {/* כרטיס לו"ז יומי מעוצב כרשימת ציר זמן */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-900 text-sm">היום בלו״ז</h3>
                  <button onClick={() => setActiveTab('schedule')} className="text-xs text-[#5B4B67] font-bold flex items-center gap-0.5">
                    <span>לכל השבוע</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-3.5">
                  {[
                    { time: '08:00', title: 'תדריך בוקר ומסדר', tag: 'חובה' },
                    { time: '10:00', title: 'אימון פלוגתי מרוכז', tag: 'שטח' },
                    { time: '13:00', title: 'ישיבת מפקדי מחלקות', tag: 'מפקדה' },
                    { time: '16:00', title: 'סיכום יום ומשמרות', tag: 'סגירה' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-11">{item.time}</span>
                        <div className="w-2 h-2 rounded-full bg-[#5B4B67]" />
                        <span className="text-xs font-bold text-slate-800">{item.title}</span>
                      </div>
                      <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-medium border border-slate-100">
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* כרטיס חיילים בחופש היום */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="font-extrabold text-slate-900 text-sm">בחופשה היום 🌴</h3>
                  <button onClick={() => setActiveTab('leaves')} className="text-xs text-slate-400 font-semibold">לוח חודשי</button>
                </div>
                <div className="flex items-center gap-4">
                  {[
                    { name: 'דניאל', role: 'גימלים', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' },
                    { name: 'כהן', role: 'חופש', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
                    { name: 'לוי', role: 'חופש', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' }
                  ].map((p, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 bg-slate-50/70 py-2.5 rounded-2xl border border-slate-100">
                      <img src={p.img} alt={p.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs" />
                      <span className="text-xs font-bold text-slate-800 mt-1.5">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= מסך: משימות ================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">משימות פתוחות</h1>
                  <p className="text-xs text-slate-400 font-medium">מעקב וניהול משימות היחידה</p>
                </div>
                <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* מסנני משימות מודרניים */}
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-xs text-xs font-bold">
                {[
                  { key: 'all', label: 'הכל' },
                  { key: 'open', label: 'פתוחות' },
                  { key: 'overdue', label: 'באיחור' },
                  { key: 'done', label: 'הושלמו' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTaskFilter(tab.key as any)}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      taskFilter === tab.key 
                        ? 'bg-[#5B4B67] text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* רשימת כרטיסי המשימות */}
              <div className="space-y-2.5">
                {filteredTasks.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTask(t)}
                    className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      {t.status === 'overdue' && (
                        <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {t.status === 'in_progress' && (
                        <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        </div>
                      )}
                      {t.status === 'completed' && (
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                      {t.status === 'open' && (
                        <div className="w-7 h-7 rounded-full border-2 border-slate-200 shrink-0" />
                      )}

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] font-bold ${t.status === 'overdue' ? 'text-rose-500' : 'text-slate-400'}`}>
                            {t.dueDate}
                          </span>
                          <span className="text-slate-200">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">אחראי: {t.responsibleName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.imageUrl && (
                        <img src={t.imageUrl} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-2xs border border-slate-100" />
                      )}
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= מסך: חופשות ================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">ניהול חופשות</h1>
                  <p className="text-xs text-slate-400 font-medium">חיילים ומפקדים מחוץ לבסיס</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-800">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* טאבים חיילים/מפקדים */}
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-xs text-xs font-bold">
                <button 
                  onClick={() => setLeaveTab('soldiers')}
                  className={`flex-1 py-2 rounded-xl transition-all ${leaveTab === 'soldiers' ? 'bg-[#5B4B67] text-white shadow-xs' : 'text-slate-500'}`}
                >
                  חיילים (3)
                </button>
                <button 
                  onClick={() => setLeaveTab('commanders')}
                  className={`flex-1 py-2 rounded-xl transition-all ${leaveTab === 'commanders' ? 'bg-[#5B4B67] text-white shadow-xs' : 'text-slate-500'}`}
                >
                  מפקדים (1)
                </button>
              </div>

              {/* לוח שנה מעוצב ומינימליסטי */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <ChevronRight className="w-5 h-5 text-slate-400 cursor-pointer" />
                  <span className="font-extrabold text-slate-900 text-sm">אוקטובר 2024</span>
                  <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" />
                </div>
                
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-3 font-bold">
                  <span>א׳</span><span>ב׳</span><span>ג׳</span><span>ד׳</span><span>ה׳</span><span>ו׳</span><span>ש׳</span>
                </div>
                
                <div className="grid grid-cols-7 text-center gap-y-2 text-xs font-bold text-slate-700">
                  <span className="text-slate-200"></span><span className="text-slate-200"></span>
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
                  <span>13</span>
                  <span className="w-7 h-7 mx-auto rounded-xl bg-[#5B4B67] text-white flex items-center justify-center shadow-xs">14</span>
                  <span className="w-7 h-7 mx-auto rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">15</span>
                  <span>16</span><span>17</span><span>18</span><span>19</span>
                  <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                  <span>27</span>
                  <span className="w-7 h-7 mx-auto rounded-xl bg-[#5B4B67] text-white flex items-center justify-center shadow-xs">28</span>
                  <span>29</span><span>30</span><span>31</span>
                </div>
              </div>

              {/* רשימת החופשות */}
              <div className="space-y-2.5">
                {leaves.map((l) => (
                  <div key={l.id} className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={l.avatarUrl} alt={l.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-2xs" />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{l.name}</h4>
                        <span className="text-xs text-slate-400 font-medium">{l.dateRange}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-xl ${
                      l.type === 'חופש' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      l.type === 'גימלים' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      'bg-purple-50 text-[#5B4B67] border border-purple-100'
                    }`}>
                      {l.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= מסך: לו"ז שבועי ================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">לו״ז שבועי</h1>
                  <p className="text-xs text-slate-400 font-medium">תכנון אימונים ופעילות</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-800">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* סרגל שבוע מודרני */}
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs text-xs font-bold text-slate-700">
                <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
                <span>13.10 – 19.10.2024</span>
                <ChevronLeft className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>

              {/* ימות השבוע ככרטיסיות */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { day: 'א׳', date: '13.10', active: false },
                  { day: 'ב׳', date: '14.10', active: false },
                  { day: 'ג׳', date: '15.10', active: true },
                  { day: 'ד׳', date: '16.10', active: false },
                  { day: 'ה׳', date: '17.10', active: false }
                ].map((d, i) => (
                  <div 
                    key={i} 
                    className={`py-3 rounded-2xl border transition-all ${
                      d.active 
                        ? 'bg-[#5B4B67] text-white border-[#5B4B67] shadow-sm' 
                        : 'bg-white text-slate-800 border-slate-100 shadow-xs'
                    }`}
                  >
                    <div className={`text-[10px] font-bold ${d.active ? 'text-white/80' : 'text-slate-400'}`}>{d.day}</div>
                    <div className="font-extrabold mt-0.5">{d.date}</div>
                  </div>
                ))}
              </div>

              {/* ציר זמן שעות מעודכן */}
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                {['08:00', '10:00', '13:00', '16:00'].map((hour) => {
                  const ev = scheduleEvents.find(e => e.time === hour);
                  return (
                    <div key={hour} className="flex items-start gap-3.5 border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                      <span className="text-xs font-bold text-slate-400 w-11 shrink-0 pt-1">{hour}</span>
                      <div className="flex-1">
                        {ev ? (
                          <div className={`p-3 rounded-2xl border ${ev.badgeColor}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs">{ev.title}</span>
                              <span className="text-[10px] opacity-75 font-semibold">{ev.time} – {ev.endTime}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* בר ניווט תחתון צף ומודרני (Floating Glassmorphism Navbar) */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
          <div className="w-full max-w-[400px] bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl px-4 py-2 flex items-center justify-between shadow-xl pointer-events-auto">
            
            <button 
              onClick={() => setActiveTab('today')}
              className={`flex flex-col items-center py-1 transition-all ${activeTab === 'today' ? 'text-[#5B4B67] font-black' : 'text-slate-400'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">היום</span>
            </button>

            <button 
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center py-1 transition-all ${activeTab === 'tasks' ? 'text-[#5B4B67] font-black' : 'text-slate-400'}`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">משימות</span>
            </button>

            {/* כפתור פלוס מרכזי מודרני מוגבה */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 rounded-2xl bg-[#5B4B67] text-white flex items-center justify-center shadow-md shadow-[#5B4B67]/30 active:scale-90 transition-transform -mt-5"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              onClick={() => setActiveTab('leaves')}
              className={`flex flex-col items-center py-1 transition-all ${activeTab === 'leaves' ? 'text-[#5B4B67] font-black' : 'text-slate-400'}`}
            >
              <Palmtree className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">חופשות</span>
            </button>

            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center py-1 transition-all ${activeTab === 'schedule' ? 'text-[#5B4B67] font-black' : 'text-slate-400'}`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">לו״ז</span>
            </button>

          </div>
        </div>

        {/* ================= מודאל הוספה מהירה ================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-slate-900">הוספה חדשה</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'הוספת משימה', desc: 'יצירת משימה עם יעד ותמונות', bg: 'bg-[#F3EEF9]', text: 'text-[#5B4B67]', icon: CheckSquare },
                  { title: 'הוספת חופשה', desc: 'רישום ימי חופש לחייל או מפקד', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Palmtree },
                  { title: 'הוספת אירוע בלו״ז', desc: 'שיבוץ אימון, תדריך או פגישה', bg: 'bg-sky-50', text: 'text-sky-700', icon: Calendar }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setIsAddModalOpen(false)}
                    className={`w-full ${item.bg} p-3.5 rounded-2xl flex items-center gap-3.5 text-right active:scale-[0.98] transition-transform`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-white shadow-2xs ${item.text} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= מודאל פרטי משימה ================= */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-[#FAF9F6] overflow-y-auto flex flex-col justify-between p-4 max-w-[440px] mx-auto">
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setSelectedTask(null)} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">פרטי משימה</h2>
                <div className="w-10" />
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">!</div>
                  <h1 className="text-lg font-black text-slate-900">{selectedTask.title}</h1>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold">תאריך יעד</span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">{selectedTask.dueDate}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold">אחראי/ת</span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">{selectedTask.responsibleName}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-800">פירוט משימה</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedTask.description || 'אין פירוט נוסף.'}
                </p>
              </div>

              {selectedTask.imageUrl && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-extrabold text-slate-800">תמונות וקבצים מצורפים</span>
                  <img src={selectedTask.imageUrl} alt="" className="w-full h-44 rounded-2xl object-cover" />
                </div>
              )}
            </div>

            <div className="pt-4 pb-6">
              <button 
                onClick={() => setSelectedTask(null)}
                className="w-full bg-[#5B4B67] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-[#5B4B67]/20 active:scale-[0.98] transition-transform"
              >
                סיום ועריכה
              </button>
            </div>
          </div>
        )}

        {/* ================= מודאל עריכת הודעת הבאנר ================= */}
        {isEditingBanner && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-1">
                <button onClick={() => setIsEditingBanner(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-slate-900">עריכת הודעת הבאנר</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">הודעה שתוצג בראש הדף:</label>
                <input 
                  type="text" 
                  value={tempBannerInput}
                  onChange={(e) => setTempBannerInput(e.target.value)}
                  placeholder="לדוגמה: יום טוב ומנצח! ✨"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-[#5B4B67]"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button 
                  onClick={handleSaveBanner}
                  className="flex-1 bg-[#5B4B67] text-white py-2.5 rounded-2xl font-bold text-xs shadow-xs active:scale-95 transition-transform"
                >
                  שמור שינויים
                </button>
                <button 
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs active:scale-95 transition-transform"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
