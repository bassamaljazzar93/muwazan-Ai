
import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyPlan, AppMode, Meal, UserProfile, DailyPlan } from '../types';
import { DAYS_AR, DAYS_EN, NORMAL_MEALS_7DAYS, RAMADAN_MEALS_7DAYS } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';

interface MealTableProps {
  plan: WeeklyPlan;
  mode: AppMode;
  user: UserProfile;
  onUpdateDay: (day: string, meals: Partial<DailyPlan>) => void;
  lang: string;
  t: any;
  weeklyTips: string[];
}

const MealTable: React.FC<MealTableProps> = ({ plan, mode, onUpdateDay, user, lang, t, weeklyTips }) => {
  const days = lang === 'ar' ? DAYS_AR : DAYS_EN;
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [isRefreshingDay, setIsRefreshingDay] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; mealName: string; content?: any }>({ isOpen: false, mealName: '' });
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  
  const mealKeys = mode === 'normal' 
    ? ['breakfast', 'lunch', 'dinner'] 
    : ['suhoor', 'iftar', 'snack'];

  const mealLabels: Record<string, string> = lang === 'ar' ? {
    breakfast: '🌅 الإفطار', lunch: '🍽️ الغداء', dinner: '🌙 العشاء الخفيف',
    suhoor: '🌅 السحور الصحي', iftar: '🌙 الإفطار', snack: '🍎 سناك خفيف'
  } : {
    breakfast: '🌅 Breakfast', lunch: '🍽️ Lunch', dinner: '🌙 Light Dinner',
    suhoor: '🌅 Healthy Suhoor', iftar: '🌙 Iftar', snack: '🍎 Light Snack'
  };

  const dynamicTips = useMemo(() => {
    if (weeklyTips && weeklyTips.length > 0) {
      return weeklyTips.map((text, i) => ({
        icon: ['✨', '⚖️', '🌙', '🏃', '💧', '🍎', '🧘'][i % 7],
        title: lang === 'ar' ? 'نصيحة مخصصة' : 'Personalized Tip',
        text
      }));
    }
    return [{ icon: '⚖️', title: lang === 'ar' ? 'موازن AI' : 'Muwazan AI', text: lang === 'ar' ? 'تنسيق اليوم بالكامل يضمن لك توزيعاً ذكياً للسعرات.' : 'Daily coordination ensures smart calorie distribution.' }];
  }, [weeklyTips, lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % dynamicTips.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [dynamicTips]);

  const currentDayMeals = plan[selectedDay] || {};
  const calorieTarget = user.dailyCalorieTarget || 2000;

  const fetchRecipe = async (meal: any) => {
    setRecipeModal({ isOpen: true, mealName: meal.name });
    setIsGeneratingRecipe(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a healthy recipe for "${meal.name}". Components: ${meal.ingredients.join(',')}. Target calories: ${meal.calories}. Provide instructions in ${lang === 'ar' ? 'Arabic with a friendly Gulf tone' : 'English'}. JSON strictly.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              note: { type: Type.STRING }
            }
          }
        }
      });
      setRecipeModal(p => ({ ...p, content: JSON.parse(response.text || '{}') }));
    } catch (e) { console.error(e); } finally { setIsGeneratingRecipe(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {days.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)} className={`px-6 py-3 rounded-2xl font-bold border transition-all ${selectedDay === day ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:border-indigo-200'}`}>{day}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mealKeys.map(key => {
          const meal = (currentDayMeals as any)[key];
          return (
            <div key={key} className={`bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col min-h-[380px] transition-all relative overflow-hidden group`}>
               <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4">{mealLabels[key]}</p>
               <h4 className="text-xl font-black text-slate-800 mb-4 leading-tight min-h-[3rem]">{meal?.name || '---'}</h4>
               
               <div className="flex flex-wrap gap-1.5 mb-6">
                  {meal?.ingredients?.slice(0, 4).map((ing: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] rounded-lg border border-slate-100 font-bold">{ing}</span>
                  ))}
                  {(meal?.ingredients?.length || 0) > 4 && <span className="text-[9px] font-bold text-slate-300">+{meal.ingredients.length - 4}</span>}
               </div>

               <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg border border-orange-100 uppercase">{meal?.calories || 0} kcal</span>
                    <button 
                      onClick={() => fetchRecipe(meal)}
                      className="text-[10px] font-black text-indigo-600 uppercase underline decoration-indigo-200 underline-offset-4 hover:text-indigo-800 transition-all"
                    >
                      {t.getRecipe}
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
      
      {/* Recipe Modal */}
      {recipeModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-[2.5rem]">
              <h3 className="text-xl font-black">{t.recipeModal.title}</h3>
              <button onClick={() => setRecipeModal({ isOpen: false, mealName: '' })} className="text-2xl font-black">✕</button>
            </div>
            <div className="p-8 overflow-y-auto no-scrollbar space-y-6">
              <h4 className="text-2xl font-black text-slate-800 text-center">🥘 {recipeModal.mealName}</h4>
              {isGeneratingRecipe ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-slate-400">{t.recipeModal.loading}</p>
                </div>
              ) : recipeModal.content && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h5 className="font-black text-indigo-600 uppercase text-xs mb-3">{t.recipeModal.ingredients}</h5>
                    <ul className="space-y-2">
                      {recipeModal.content.ingredients.map((ing: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-700">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full"></span> {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-black text-indigo-600 uppercase text-xs mb-3">{t.recipeModal.instructions}</h5>
                    <div className="space-y-4">
                      {recipeModal.content.steps.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {recipeModal.content.note && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] font-black text-emerald-700">
                      💡 {recipeModal.content.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex items-center gap-6 shadow-2xl relative overflow-hidden min-h-[140px] transition-all duration-700">
        <div key={activeTipIndex} className="flex items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-700 w-full">
          <div className="text-4xl bg-white/10 w-16 h-16 flex items-center justify-center rounded-2xl shrink-0">
            {dynamicTips[activeTipIndex].icon}
          </div>
          <div className="flex-1">
             <h4 className="font-black text-indigo-300 text-sm uppercase tracking-wider mb-1">{dynamicTips[activeTipIndex].title}</h4>
             <p className="text-indigo-100/70 text-xs leading-relaxed font-bold">{dynamicTips[activeTipIndex].text}</p>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {dynamicTips.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${activeTipIndex === i ? 'w-4 bg-indigo-400' : 'w-1 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealTable;
