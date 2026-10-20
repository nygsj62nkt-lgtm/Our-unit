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
  Clock, 
  Palmtree, 
  Camera, 
  X, 
  Check,
  Pencil
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
  color: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'tasks' | 'leaves' | 'schedule'>('today');
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'overdue' | 'done'>('all');
  const [leaveTab, setLeaveTab] = useState<'soldiers' | 'commanders'>('soldiers');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // מצב עריכת הבאנר ושמירתו בזיכרון המכשיר
  const [bannerMessage, setBannerMessage] = useState<string>(() => {
    return localStorage.getItem('unit_banner_message') || 'יום טוב! ♡';
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

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'להכין ציוד לאימון',
      dueDate: '15.10.24',
      responsibleName: 'דניאל',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=200&h=200&fit=crop',
      status: 'overdue',
      description: 'להכין את כל הציוד לאימון פלוגתי:\n- וסטים\n- קסדות\n- ציוד קשר\n- מים וחטיפים'
    },
    {
      id: '2',
      title: 'להעביר רשימת חיילים',
      dueDate: '16.10.24',
      responsibleName: 'שיר',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=200&fit=crop',
      status: 'in_progress',
      description: 'לסגור רשימה סופית של כל מחלקה 2 לקראת היציאה'
    },
    {
      id: '3',
      title: 'לתאם הסעה',
      dueDate: '18.10.24',
      responsibleName: 'לוי',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=200&fit=crop',
      status: 'completed',
      description: 'תיאום אוטובוס לבסיס צאלים מול מוקד היסעים'
    },
    {
      id: '4',
      title: 'לעדכן נהלים',
      dueDate: '20.10.24',
      responsibleName: 'מאיה',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop',
      status: 'open',
      description: 'הפצת דף נהלי בטיחות מעודכן לקראת החורף'
    },
    {
      id: '5',
      title: 'להזמין אוכל ליום גיבוש',
      dueDate: '13.10.24',
      responsibleName: 'רותם',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
      status: 'completed',
      description: 'הזמנת פריסות בוקר וצהריים מחמ״ל לוגיסטיקה'
    }
  ]);

  const leaves: Leave[] = [
    { id: '1', name: 'לוי', type: 'חופש', dateRange: '15.10 – 17.10', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', category: 'soldier' },
    { id: '2', name: 'כהן', type: 'חופש', dateRange: '22.10 – 24.10', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', category: 'soldier' },
    { id: '3', name: 'דניאל', type: 'גימלים', dateRange: '07.10 – 08.10', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', category: 'soldier' },
    { id: '4', name: 'מאיה', type: 'קורס', dateRange: '28.10 – 30.10', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', category: 'soldier' }
  ];

  const scheduleEvents: ScheduleEvent[] = [
    { id: '1', time: '08:00', endTime: '09:00', title: 'תדריך בוקר', dayIndex: 2, color: 'bg-purple-100 text-purple-900 border-purple-200' },
    { id: '2', time: '10:00', endTime: '12:00', title: 'אימון פלוגתי', dayIndex: 2, color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    { id: '3', time: '13:00', endTime: '14:00', title: 'ישיבת מפקדים', dayIndex: 2, color: 'bg-rose-100 text-rose-900 border-rose-200' },
    { id: '4', time: '16:00', endTime: '17:00', title: 'סיכום יום', dayIndex: 2, color: 'bg-blue-100 text-blue-900 border-blue-200' }
  ];

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'open') return t.status === 'open';
    if (taskFilter === 'overdue') return t.status === 'overdue';
    if (taskFilter === 'done') return t.status === 'completed';
    return true;
  });

  return (
    <div className="flex justify-center bg-[#2B2B2B] min-h-screen font-sans antialiased text-slate-800" dir="rtl">
      <div className="w-full max-w-[420px] bg-[#F7F7F9] min-h-screen flex flex-col relative pb-24 shadow-2xl">
        
        {/* תוכן המסכים */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'today' && (
            <div className="p-4 space-y-4">
              {/* כותרת עליונה */}
              <div className="flex items-center justify-between pt-2">
                <div className="w-8" />
                <div className="text-center">
                  <h1 className="text-xl font-bold text-slate-800">היום</h1>
                  <p className="text-xs text-slate-400">יום שלישי, 15 באוקטובר</p>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
                  <Bell className="w-5 h-5" />
                </button>
              </div>

              {/* באנר זריחה מדברי עם אפשרות עריכה */}
              <div 
                onClick={handleOpenEditBanner}
                className="relative h-28 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center group cursor-pointer active:scale-[0.99] transition-transform"
                title="לחץ לעריכת ההודעה"
              >
                <img 
                  src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&fit=crop" 
                  alt="זריחה" 
                  className="absolute inset-0 w-full h-full object-cover brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                <h2 className="relative text-white text-3xl font-light tracking-wide drop-shadow-md select-none font-serif text-center px-4">
                  {bannerMessage}
                </h2>

                {/* אייקון עיפרון לעריכה שמוצג בעדינות בפינה */}
                <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-xs p-1.5 rounded-full text-white/80 group-hover:text-white">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 4 כרטיסי סטטוס עליונים */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#EBF5FB] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-2xl font-black text-slate-800">3</span>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">חיילים בחופש</p>
                  </div>
                  <div className="text-sky-500">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#F3EEF9] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-2xl font-black text-slate-800">1</span>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">מפקדים בחופש</p>
                  </div>
                  <div className="text-[#6D597A]">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#EBF7EE] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-2xl font-black text-slate-800">5</span>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">משימות פתוחות</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                <div className="bg-[#FDECEB] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-2xl font-black text-slate-800">2</span>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">משימות באיחור</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* כרטיס היום בלו"ז */}
              <div className="bg-white rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">היום בלו״ז</h3>
                  <button onClick={() => setActiveTab('schedule')} className="text-xs text-slate-400 hover:text-slate-600">הצג הכל</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-xs">
                    <span className="w-14 text-slate-400 font-medium">08:00</span>
                    <span className="text-slate-700 font-semibold">תדריך בוקר</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-14 text-slate-400 font-medium">10:00</span>
                    <span className="text-slate-700 font-semibold">אימון פלוגתי</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-14 text-slate-400 font-medium">13:00</span>
                    <span className="text-slate-700 font-semibold">ישיבת מפקדים</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-14 text-slate-400 font-medium">16:00</span>
                    <span className="text-slate-700 font-semibold">סיכום יום</span>
                  </div>
                </div>
              </div>

              {/* כרטיס חיילים בחופש היום */}
              <div className="bg-white rounded-2xl p-4 shadow-xs">
                <h3 className="font-bold text-slate-800 text-sm mb-3">חיילים בחופש היום 🌴</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" alt="דניאל" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs" />
                    <span className="text-xs text-slate-700 mt-1.5 font-medium">דניאל</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="כהן" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs" />
                    <span className="text-xs text-slate-700 mt-1.5 font-medium">כהן</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" alt="לוי" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs" />
                    <span className="text-xs text-slate-700 mt-1.5 font-medium">לוי</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pt-2">
                <button className="text-slate-600"><Search className="w-5 h-5" /></button>
                <h1 className="text-xl font-bold text-slate-800">משימות</h1>
                <button className="text-slate-600"><SlidersHorizontal className="w-5 h-5" /></button>
              </div>

              {/* גלולות סינון */}
              <div className="flex items-center justify-between gap-1 bg-white p-1 rounded-xl text-xs shadow-xs">
                <button 
                  onClick={() => setTaskFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${taskFilter === 'all' ? 'bg-[#6D597A] text-white' : 'text-slate-500'}`}
                >
                  הכל
                </button>
                <button 
                  onClick={() => setTaskFilter('open')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${taskFilter === 'open' ? 'bg-[#6D597A] text-white' : 'text-slate-500'}`}
                >
                  פתוחות
                </button>
                <button 
                  onClick={() => setTaskFilter('overdue')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${taskFilter === 'overdue' ? 'bg-[#6D597A] text-white' : 'text-slate-500'}`}
                >
                  באיחור
                </button>
                <button 
                  onClick={() => setTaskFilter('done')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${taskFilter === 'done' ? 'bg-[#6D597A] text-white' : 'text-slate-500'}`}
                >
                  בוצעו
                </button>
              </div>

              {/* רשימת משימות */}
              <div className="space-y-2.5 pt-1">
                {filteredTasks.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTask(t)}
                    className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      {t.status === 'overdue' && (
                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                          <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      )}
                      {t.status === 'in_progress' && (
                        <div className="w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 shrink-0">
                          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        </div>
                      )}
                      {t.status === 'completed' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      {t.status === 'open' && (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0" />
                      )}

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{t.title}</h4>
                        <span className={`text-[11px] font-medium ${t.status === 'overdue' ? 'text-rose-500' : 'text-slate-400'}`}>
                          {t.dueDate}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <img src={t.avatarUrl} alt={t.responsibleName} className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[11px] text-slate-500">אחראי/ת: {t.responsibleName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.imageUrl && (
                        <img src={t.imageUrl} alt="צירוף" className="w-12 h-12 rounded-xl object-cover shadow-2xs" />
                      )}
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pt-2">
                <div className="w-8" />
                <h1 className="text-xl font-bold text-slate-800">חופשות</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="text-slate-700"><Plus className="w-6 h-6" /></button>
              </div>

              {/* טאבים חיילים/מפקדים */}
              <div className="flex bg-[#EFEFF1] p-1 rounded-xl text-xs font-semibold">
                <button 
                  onClick={() => setLeaveTab('soldiers')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${leaveTab === 'soldiers' ? 'bg-[#6D597A] text-white shadow-xs' : 'text-slate-600'}`}
                >
                  חיילים
                </button>
                <button 
                  onClick={() => setLeaveTab('commanders')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${leaveTab === 'commanders' ? 'bg-[#6D597A] text-white shadow-xs' : 'text-slate-600'}`}
                >
                  מפקדים
                </button>
              </div>

              {/* לוח שנה אוקטובר 2024 */}
              <div className="bg-white rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <ChevronRight className="w-5 h-5 text-slate-400 cursor-pointer" />
                  <span className="font-bold text-slate-800 text-sm">אוקטובר 2024</span>
                  <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" />
                </div>
                
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-2 font-medium">
                  <span>א׳</span><span>ב׳</span><span>ג׳</span><span>ד׳</span><span>ה׳</span><span>ו׳</span><span>ש׳</span>
                </div>
                
                <div className="grid grid-cols-7 text-center gap-y-2 text-xs font-semibold text-slate-700">
                  <span className="text-slate-300"></span><span className="text-slate-300"></span>
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
                  <span>13</span>
                  <span className="w-6 h-6 mx-auto rounded-full bg-[#6D597A] text-white flex items-center justify-center">14</span>
                  <span className="w-6 h-6 mx-auto rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center">15</span>
                  <span>16</span><span>17</span><span>18</span><span>19</span>
                  <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                  <span>27</span>
                  <span className="w-6 h-6 mx-auto rounded-full bg-[#6D597A] text-white flex items-center justify-center">28</span>
                  <span>29</span><span>30</span><span>31</span>
                </div>
              </div>

              {/* רשימת חופשות */}
              <div className="pt-2">
                <h3 className="font-bold text-slate-800 text-sm mb-2.5">רשימת חופשות</h3>
                <div className="space-y-2">
                  {leaves.map((l) => (
                    <div key={l.id} className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <img src={l.avatarUrl} alt={l.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{l.name}</h4>
                          <span className="text-[11px] text-slate-400">{l.dateRange}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                          l.type === 'חופש' ? 'bg-emerald-100 text-emerald-700' :
                          l.type === 'גימלים' ? 'bg-sky-100 text-sky-700' :
                          'bg-purple-100 text-[#6D597A]'
                        }`}>
                          {l.type}
                        </span>
                        <ChevronLeft className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pt-2">
                <div className="w-8" />
                <h1 className="text-xl font-bold text-slate-800">לו״ז שבועי</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="text-slate-700"><Plus className="w-6 h-6" /></button>
              </div>

              {/* שבוע */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl shadow-xs text-xs font-semibold text-slate-700">
                <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
                <span>13.10 – 19.10.2024</span>
                <ChevronLeft className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>

              {/* ימות השבוע */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                <div className="bg-white py-2 rounded-xl shadow-xs">
                  <div className="text-slate-400 text-[10px]">א׳</div>
                  <div className="font-bold text-slate-800 mt-0.5">13.10</div>
                </div>
                <div className="bg-white py-2 rounded-xl shadow-xs">
                  <div className="text-slate-400 text-[10px]">ב׳</div>
                  <div className="font-bold text-slate-800 mt-0.5">14.10</div>
                </div>
                <div className="bg-[#6D597A] text-white py-2 rounded-xl shadow-xs">
                  <div className="text-white/80 text-[10px]">ג׳</div>
                  <div className="font-bold mt-0.5">15.10</div>
                </div>
                <div className="bg-white py-2 rounded-xl shadow-xs">
                  <div className="text-slate-400 text-[10px]">ד׳</div>
                  <div className="font-bold text-slate-800 mt-0.5">16.10</div>
                </div>
                <div className="bg-white py-2 rounded-xl shadow-xs">
                  <div className="text-slate-400 text-[10px]">ה׳</div>
                  <div className="font-bold text-slate-800 mt-0.5">17.10</div>
                </div>
              </div>

              {/* גריד שעות */}
              <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2 text-xs">
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((hour) => {
                  const ev = scheduleEvents.find(e => e.time === hour);
                  return (
                    <div key={hour} className="flex items-start gap-3 border-b border-slate-50 pb-1.5 min-h-[32px]">
                      <span className="text-slate-400 text-[11px] w-10 font-medium shrink-0 pt-0.5">{hour}</span>
                      <div className="flex-1">
                        {ev ? (
                          <div className={`p-2 rounded-xl border text-xs font-semibold ${ev.color}`}>
                            <div>{ev.title}</div>
                            <div className="text-[10px] opacity-75 font-normal mt-0.5">{ev.time} – {ev.endTime}</div>
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

        {/* בר ניווט תחתון קבוע */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-30">
          <div className="w-full max-w-[420px] bg-white border-t border-slate-100 flex items-center justify-around py-2.5 px-3 shadow-lg pointer-events-auto">
            <button 
              onClick={() => setActiveTab('today')}
              className={`flex flex-col items-center transition-colors ${activeTab === 'today' ? 'text-[#6D597A]' : 'text-slate-400'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">היום</span>
            </button>

            <button 
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center transition-colors ${activeTab === 'tasks' ? 'text-[#6D597A]' : 'text-slate-400'}`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">משימות</span>
            </button>

            {/* כפתור פלוס עגול ובולט */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 -mt-5 rounded-full bg-[#6D597A] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              onClick={() => setActiveTab('leaves')}
              className={`flex flex-col items-center transition-colors ${activeTab === 'leaves' ? 'text-[#6D597A]' : 'text-slate-400'}`}
            >
              <Palmtree className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">חופשות</span>
            </button>

            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center transition-colors ${activeTab === 'schedule' ? 'text-[#6D597A]' : 'text-slate-400'}`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">לו״ז</span>
            </button>
          </div>
        </div>

        {/* מודאל "הוספה חדשה" */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[380px] bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-1">
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-slate-800">הוספה חדשה</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full bg-[#F3EEF9] p-4 rounded-2xl flex items-center gap-4 text-right hover:bg-[#ede5f7] transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-[#6D597A] text-white flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">הוספת משימה</h4>
                    <p className="text-xs text-slate-500 mt-0.5">צור משימה חדשה עם פירוט, תאריך יעד ותמונות</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full bg-[#EBF7EE] p-4 rounded-2xl flex items-center gap-4 text-right hover:bg-[#e2f3e6] transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Palmtree className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">הוספת חופש</h4>
                    <p className="text-xs text-slate-500 mt-0.5">הוסף חופשה לחייל או למפקד</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full bg-[#EBF5FB] p-4 rounded-2xl flex items-center gap-4 text-right hover:bg-[#e0effa] transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">הוספת אירוע לו״ז</h4>
                    <p className="text-xs text-slate-500 mt-0.5">צור אירוע חדש בלו״ז השבועי</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* מודאל "פרטי משימה" */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-[#F7F7F9] overflow-y-auto flex flex-col justify-between">
            <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
              {/* סרגל עליון */}
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setSelectedTask(null)} className="text-slate-600">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <h2 className="text-base font-bold text-slate-800">פרטי משימה</h2>
                <div className="w-6" />
              </div>

              {/* כותרת משימה וסטטוס */}
              <div className="flex items-center gap-2 pt-2">
                <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h1 className="text-lg font-black text-slate-800">{selectedTask.title}</h1>
              </div>

              {/* שדות הגדרה */}
              <div className="space-y-2.5 text-xs">
                <div className="bg-white p-3 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-400 font-medium">סטטוס</span>
                  <div className="bg-[#FDECEB] text-rose-500 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    באיחור
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-400 font-medium">תאריך יעד</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {selectedTask.dueDate}.2024
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="text-slate-400 font-medium">אחראי/ת</span>
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <img src={selectedTask.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    {selectedTask.responsibleName}
                  </div>
                </div>
              </div>

              {/* פירוט */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">פירוט</span>
                <div className="bg-white p-4 rounded-2xl text-xs text-slate-700 leading-relaxed shadow-2xs whitespace-pre-line">
                  {selectedTask.description || 'אין פירוט נוסף למשימה זו.'}
                </div>
              </div>

              {/* תמונות */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">תמונות (2)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <img 
                    src="https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=200&h=200&fit=crop" 
                    alt="תמונה 1" 
                    className="w-20 h-20 rounded-2xl object-cover shadow-xs"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=200&fit=crop" 
                    alt="תמונה 2" 
                    className="w-20 h-20 rounded-2xl object-cover shadow-xs"
                  />
                  <button className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* כפתור עדכון משימה סגול בתחתית */}
            <div className="p-4 max-w-[420px] mx-auto w-full pb-8">
              <button 
                onClick={() => setSelectedTask(null)}
                className="w-full bg-[#6D597A] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                עדכון משימה
              </button>
            </div>
          </div>
        )}

        {/* מודאל עריכת הודעת הבאנר */}
        {isEditingBanner && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-1">
                <button onClick={() => setIsEditingBanner(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-slate-800">עריכת הודעת הבאנר</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium">הודעה שתוצג בראש הדף:</label>
                <input 
                  type="text" 
                  value={tempBannerInput}
                  onChange={(e) => setTempBannerInput(e.target.value)}
                  placeholder="לדוגמה: יום טוב! ♡ או ברוכים הבאים"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#6D597A]"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button 
                  onClick={handleSaveBanner}
                  className="flex-1 bg-[#6D597A] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
                >
                  שמור שינויים
                </button>
                <button 
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs active:scale-95 transition-transform"
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
