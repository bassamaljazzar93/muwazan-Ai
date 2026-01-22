
import React, { useState, useMemo } from 'react';
import { UserProfile, TrainingDay } from '../types';

interface ActivityTableProps {
  user: UserProfile;
  lang: string;
  t: any;
  onGenerate?: () => void;
}

const ActivityTable: React.FC<ActivityTableProps> = ({ user, lang, t, onGenerate }) => {
  const trainingPlan = user.trainingPlan || [];
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const currentWeekDays = useMemo(() => {
    const startIdx = (selectedWeek - 1) * 7;
    return trainingPlan.slice(startIdx, startIdx + 7);
  }, [trainingPlan, selectedWeek]);

  const currentDay = currentWeekDays[selectedDayIndex] || null;

  if (trainingPlan.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm animate-in fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">🏃‍♂️</div>
        <h3 className="text-2xl font-black text-slate-800 mb-3">{lang === 'ar' ? 'بناء خطة التدريب الذكية' : 'Building Smart Training Plan'}</h3>
        <p className="text-slate-400 font-bold mb-8 max-w-xs leading-relaxed">
          {lang === 'ar' 
            ? 'سأقوم ببناء خطة تدريبية مدروسة لمدة 21 يوماً بناءً على بياناتك المسجلة في الإعدادات.' 
            : 'I will build a studied 21-day training plan based on your recorded settings.'}
        </p>
        
        <button 
          onClick={onGenerate}
          className="px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-lg"
        >
          <span>✨</span>
          {lang === 'ar' ? 'بناء خطة التمرين الآن' : 'Build Workout Plan Now'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* اختيار الأسبوع */}
      <div className="flex bg-white p-2 rounded-2xl border shadow-sm gap-2">
        {[1, 2, 3].map(w => (
          <button 
            key={w} 
            onClick={() => { setSelectedWeek(w); setSelectedDayIndex(0); }}
            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${selectedWeek === w ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            {lang === 'ar' ? `الأسبوع ${w}` : `Week ${w}`}
          </button>
        ))}
      </div>

      {/* اختيار اليوم في الأسبوع */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {currentWeekDays.map((d, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedDayIndex(i)}
            className={`px-6 py-3 rounded-2xl font-bold border transition-all whitespace-nowrap ${selectedDayIndex === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500'}`}
          >
            {lang === 'ar' ? `اليوم ${d.day}` : `Day ${d.day}`}
          </button>
        ))}
      </div>

      {/* عرض تفاصيل اليوم التدريبي */}
      {currentDay && (
        <div key={currentDay.day} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="text-3xl">🔥</span> {currentDay.title}
            </h3>
            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${
              currentDay.intensity === 'high' ? 'bg-rose-50 text-rose-600' : 
              currentDay.intensity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {currentDay.intensity} Intensity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Duration</p>
                  <p className="text-lg font-black text-slate-800">{currentDay.duration}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Stage</p>
                  <p className="text-lg font-black text-indigo-700">{lang === 'ar' ? `المرحلة ${selectedWeek}` : `Phase ${selectedWeek}`}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'التمارين المقترحة' : 'Suggested Exercises'}</p>
                <div className="space-y-2">
                  {currentDay.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border hover:border-indigo-200 transition-all hover:scale-[1.02]">
                       <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-indigo-600 shadow-sm">{i+1}</div>
                       <p className="font-bold text-slate-700 text-sm">{ex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex-1">
                <h5 className="font-black text-emerald-900 mb-4 flex items-center gap-2">💡 {lang === 'ar' ? 'توجيهات المرحلة:' : 'Phase Guidance:'}</h5>
                <p className="text-emerald-800/80 text-sm leading-relaxed font-bold italic">
                  {selectedWeek === 1 && (lang === 'ar' ? 'هذا الأسبوع مخصص للتهيئة البدنية وتعويد العضلات على الحركة.' : 'This week is for physical preparation and getting muscles used to movement.')}
                  {selectedWeek === 2 && (lang === 'ar' ? 'الآن نزيد من وتيرة التحدي لبناء القوة والتحمل.' : 'Now we increase the challenge to build strength and endurance.')}
                  {selectedWeek === 3 && (lang === 'ar' ? 'مرحلة الذروة! ركز على الأداء المثالي وتحقيق أقصى استفادة.' : 'Peak phase! Focus on perfect performance and maximum gain.')}
                </p>
              </div>
              <div className="relative h-40 rounded-[2rem] overflow-hidden group">
                 <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="workout" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                    <p className="text-white text-xs font-black uppercase">{lang === 'ar' ? 'ابقَ نشطاً، ابقَ موازناً' : 'Stay Active, Stay Muwazan'}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTable;
