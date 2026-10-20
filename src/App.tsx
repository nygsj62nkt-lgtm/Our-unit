import React, { useState, useEffect } from 'react';
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

  // מצב לעריכת הודעת הבאנר ושמירתה בזיכרון המכשיר
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
