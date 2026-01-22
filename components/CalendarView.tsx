
import React, { useState } from 'react';
import { WeightLog } from '../types';

interface CalendarViewProps {
  logs: WeightLog[];
  target: number;
  onEditLog: (date: string, weight: number) => void;
  // Added lang to props
  lang: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ logs, target, onEditLog, lang }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day > 0 && day <= daysInMonth) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = logs.find(l => l.date === dateStr);
      return { day, dateStr, log };
    }
    return null;
  });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const handleDayClick = (dateStr: string, currentWeight?: number) => {
    const promptMsg = lang === 'ar' ? `تعديل الوزن ليوم ${dateStr}:` : `Edit weight for ${dateStr}:`;
    const newVal = prompt(promptMsg, currentWeight?.toString() || "");
    if (newVal !== null && !isNaN(Number(newVal)) && Number(newVal) > 0) {
      onEditLog(dateStr, Number(newVal));
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 transition-colors">{lang === 'ar' ? '➡️' : '⬅️'}</button>
        <h3 className="text-xl font-black text-slate-800">{monthName}</h3>
        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 transition-colors">{lang === 'ar' ? '⬅️' : '➡️'}</button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-8">
        {(lang === 'ar' ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map(d => (
          <div key={d} className="text-center text-slate-400 font-black py-2 text-[10px] uppercase">{d}</div>
        ))}
        {calendarDays.map((d, i) => (
          <div 
            key={i} 
            onClick={() => d && handleDayClick(d.dateStr, d.log?.weight)}
            className={`min-h-[70px] md:min-h-[85px] p-2 rounded-2xl border transition-all flex flex-col items-center justify-start cursor-pointer group ${
              d ? 'bg-slate-50/40 border-slate-100 hover:border-indigo-300' : 'bg-transparent border-transparent'
            } ${d?.log ? 'bg-white ring-1 ring-indigo-500 shadow-md shadow-indigo-50' : ''}`}
          >
            {d && (
              <>
                <p className="text-slate-400 font-bold text-[9px] w-full text-left">{d.day}</p>
                {d.log && (
                  <div className="mt-1 flex flex-col items-center animate-in zoom-in duration-300">
                    <span className="text-sm font-black text-indigo-700 leading-none">{d.log.weight}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{lang === 'ar' ? 'كجم' : 'kg'}</span>
                    {d.log.weight <= target && <span className="mt-1 text-xs">⭐</span>}
                  </div>
                )}
                {!d.log && <span className="mt-2 text-slate-200 opacity-0 group-hover:opacity-100 text-xs">+</span>}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center gap-4 relative overflow-hidden">
        <div className="relative z-10 w-full">
          <div className="flex justify-between items-end mb-2">
            <h4 className="text-lg font-black">{lang === 'ar' ? 'طريقك للهدف 🎯' : 'Road to Goal 🎯'}</h4>
            <span className="text-xs font-bold text-indigo-300">{lastLog ? `${Math.abs(lastLog.weight - target).toFixed(1)} ${lang === 'ar' ? 'كجم متبقي' : 'kg left'}` : '--'}</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-400 transition-all duration-1000 shadow-[0_0_15px_rgba(129,140,248,0.5)]" 
              style={{ width: lastLog ? `${Math.min(100, (target / lastLog.weight) * 100)}%` : '0%' }}
            ></div>
          </div>
        </div>
        <p className="text-[10px] text-white/50 font-medium">{lang === 'ar' ? 'انقر على أي يوم لتسجيل أو تعديل وزنك' : 'Click on any day to log or edit weight'}</p>
      </div>
    </div>
  );
};

export default CalendarView;
