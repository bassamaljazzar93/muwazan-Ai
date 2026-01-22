
import React, { useMemo } from 'react';
import { Language } from '../types';

interface WaterTrackerProps {
  amount: number;
  goal: number;
  onAdd: (ml: number) => void;
  mode: 'normal' | 'ramadan';
  t: any;
  lang: Language;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ amount, goal, onAdd, mode, t, lang }) => {
  const percentage = Math.min(100, (amount / goal) * 100);
  
  const reminderMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (mode === 'ramadan') {
      if (hour >= 18 && hour < 23) return t.waterReminders.iftar;
      return t.waterReminders.fasting;
    }
    return t.waterReminders.normal;
  }, [mode, amount, t]);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm relative animate-in fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">{t.waterTracker}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{mode === 'ramadan' ? t.waterRamadanGoal : t.waterGoal}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-blue-600">{(amount / 1000).toFixed(1)} <span className="text-sm text-slate-400">{t.liter}</span></p>
        </div>
      </div>
      <div className="relative h-3 bg-slate-50 rounded-full mb-4 overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${percentage}%` }} /></div>
      <div className="p-3 bg-blue-50 rounded-xl mb-4 text-[10px] font-bold text-blue-800 leading-relaxed">{reminderMessage}</div>
      <div className="grid grid-cols-3 gap-2">
        {[250, 500, 750].map(ml => (
          <button key={ml} onClick={() => onAdd(ml)} className="p-3 bg-slate-50 rounded-xl border font-black text-xs text-slate-500 hover:bg-blue-50">+{ml}ml</button>
        ))}
      </div>
    </div>
  );
};

export default WaterTracker;
