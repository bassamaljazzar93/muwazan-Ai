
import React, { useState, useEffect, useMemo } from 'react';
import { AppMode, UserProfile, WeightLog, WeeklyPlan, Meal, AuthSession, WaterLog, AppTheme, Language, DailyPlan, TrainingDay, EnergyLog } from './types';
import { DAYS_AR, DAYS_EN, NORMAL_MEALS_7DAYS, RAMADAN_MEALS_7DAYS, FOOD_OPTIONS, TRAINING_STRATEGIES } from './constants';
import CalendarView from './components/CalendarView';
import MealTable from './components/MealTable';
import ShoppingListModal from './components/ShoppingListModal';
import ActivityTable from './components/ActivityTable';
import ChatAdvisor from './components/ChatAdvisor';
import LoginView from './components/LoginView';
import WaterTracker from './components/WaterTracker';
import { GoogleGenAI, Type } from '@google/genai';
import { translations } from './i18n';

const THEMES: Record<AppTheme, { bg: string, text: string, primary: string, shadow: string, border: string, accent: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', primary: 'indigo', shadow: 'shadow-indigo-100', border: 'border-indigo-100', accent: 'bg-indigo-50' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', primary: 'emerald', shadow: 'shadow-emerald-100', border: 'border-emerald-100', accent: 'bg-emerald-50' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', primary: 'rose', shadow: 'shadow-rose-100', border: 'border-rose-100', accent: 'bg-rose-50' },
  slate: { bg: 'bg-slate-800', text: 'text-slate-800', primary: 'slate', shadow: 'shadow-slate-100', border: 'border-slate-100', accent: 'bg-slate-100' }
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthSession>(() => {
    const saved = localStorage.getItem('hj_auth');
    return saved ? JSON.parse(saved) : { email: '', isLoggedIn: false, method: 'manual' };
  });

  const [mode, setMode] = useState<AppMode>(() => (localStorage.getItem('hj_mode') as AppMode) || 'normal');
  const [initialLanguage, setInitialLanguage] = useState<Language>(() => (localStorage.getItem('hj_temp_lang') as Language) || 'ar');
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hj_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem('hj_weight_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('hj_water_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [customWeeklyPlan, setCustomWeeklyPlan] = useState<WeeklyPlan | null>(() => {
    const saved = localStorage.getItem('hj_custom_plan');
    return saved ? JSON.parse(saved) : null;
  });

  const [weeklyTips, setWeeklyTips] = useState<string[]>(() => {
    const saved = localStorage.getItem('hj_tips');
    return saved ? JSON.parse(saved) : [];
  });

  const [manualShoppingItems, setManualShoppingItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('hj_manual_shopping');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<'plan' | 'activity' | 'calendar' | 'chat' | 'settings'>('plan');
  const [showSetup, setShowSetup] = useState(!user);
  const [showShopping, setShowShopping] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const lang = user?.language || initialLanguage;
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('hj_auth', JSON.stringify(auth));
    localStorage.setItem('hj_mode', mode);
    if (user) localStorage.setItem('hj_user', JSON.stringify(user));
    localStorage.setItem('hj_weight_logs', JSON.stringify(weightLogs));
    localStorage.setItem('hj_water_logs', JSON.stringify(waterLogs));
    localStorage.setItem('hj_custom_plan', JSON.stringify(customWeeklyPlan));
    localStorage.setItem('hj_tips', JSON.stringify(weeklyTips));
    localStorage.setItem('hj_manual_shopping', JSON.stringify(manualShoppingItems));
  }, [auth, mode, user, weightLogs, waterLogs, customWeeklyPlan, weeklyTips, manualShoppingItems]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const themeColors = THEMES[user?.theme || 'indigo'];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWater = waterLogs.find(l => l.date === todayStr)?.amount || 0;
  const waterRequirementMl = Math.round((user?.currentWeight || 70) * 35);
  
  const todayEnergy = user?.energyLogs?.find(l => l.date === todayStr);

  const vitalScore = useMemo(() => {
    let score = 0;
    // Water (up to 30)
    score += Math.min(30, (todayWater / waterRequirementMl) * 30);
    // Training (up to 30)
    if (user?.trainingPlan) score += 30;
    // Energy log (up to 10)
    if (todayEnergy) score += 10;
    // Calories balance (up to 30) - placeholder logic
    score += 25;
    return Math.round(score);
  }, [todayWater, waterRequirementMl, user, todayEnergy]);

  const generateFullPlanAI = async (profile?: UserProfile, skipMeals: boolean = false) => {
    const targetUser = profile || user;
    if (!targetUser) return;
    setIsGeneratingPlan(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const bmr = (10 * Number(targetUser.currentWeight)) + (6.25 * Number(targetUser.height)) - (5 * Number(targetUser.age)) + (targetUser.gender === 'male' ? 5 : -161);
      const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[targetUser.activityLevel] || 1.375;
      const dailyTarget = Math.round(bmr * activityMult);
      const targetLangName = targetUser.language === 'ar' ? 'Arabic' : 'English';
      
      const isWeightLoss = (targetUser.currentWeight > targetUser.targetWeight + 1);
      const strategyKey = isWeightLoss ? 'weightLoss' : (targetUser.activityLevel === 'active' ? 'muscleGain' : 'fitness');
      const strategy = (TRAINING_STRATEGIES as any)[targetUser.language][strategyKey];

      const prompt = skipMeals 
        ? `FAST TRACK: Generate a studied 21-day training plan using strategy "${strategy.name}". User: ${targetUser.gender}, ${targetUser.age}yr, ${targetUser.height}cm, ${targetUser.currentWeight}kg. Language: ${targetLangName}. JSON strictly.`
        : `Generate meal & training plan for a ${targetUser.gender}. Strategy: "${strategy.name}". Calories: ${dailyTarget}. Language: ${targetLangName}. JSON strictly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ...(skipMeals ? {} : {
                plan: { type: Type.OBJECT, properties: (targetUser.language === 'ar' ? DAYS_AR : DAYS_EN).reduce((acc:any, d) => { acc[d] = { type: Type.OBJECT, properties: { breakfast: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}}, lunch: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}}, dinner: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}}, suhoor: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}}, iftar: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}}, snack: {type:Type.OBJECT, properties:{name:{type:Type.STRING}, calories:{type:Type.NUMBER}, ingredients:{type:Type.ARRAY, items:{type:Type.STRING}}}} } }; return acc; }, {}) }
              }),
              trainingPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: {type:Type.NUMBER}, title: {type:Type.STRING}, exercises: {type:Type.ARRAY, items:{type:Type.STRING}}, intensity: {type:Type.STRING}, duration: {type:Type.STRING} } } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      if (!skipMeals && data.plan) setCustomWeeklyPlan(data.plan);
      setWeeklyTips(data.tips || []);
      if (data.trainingPlan) {
        const nextRegenCount = skipMeals ? targetUser.mealRegenCount : (targetUser.mealRegenCount || 0) + 1;
        setUser({ 
          ...targetUser, 
          trainingPlan: data.trainingPlan, 
          trainingPlanGeneratedAt: new Date().toISOString(), 
          dailyCalorieTarget: dailyTarget,
          mealRegenCount: nextRegenCount
        });
      }
    } catch (e) { console.error(e); } finally { setIsGeneratingPlan(false); }
  };

  const handleEnergyLog = (level: number) => {
    if (!user) return;
    const newLogs = [...(user.energyLogs || []).filter(l => l.date !== todayStr), { date: todayStr, level, mood: level > 3 ? 'Good' : 'Tired' }];
    setUser({ ...user, energyLogs: newLogs });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const currentPlan = useMemo((): WeeklyPlan => {
    const plan: WeeklyPlan = {};
    const days = lang === 'ar' ? DAYS_AR : DAYS_EN;
    days.forEach((day, idx) => {
      const ed = customWeeklyPlan?.[day];
      const dp: DailyPlan = {};
      if (mode === 'normal') {
        const bank = NORMAL_MEALS_7DAYS[lang];
        dp.breakfast = ed?.breakfast || bank.breakfast[idx % bank.breakfast.length];
        dp.lunch = ed?.lunch || bank.lunch[idx % bank.lunch.length];
        dp.dinner = ed?.dinner || bank.dinner[idx % bank.dinner.length];
      } else {
        const bank = RAMADAN_MEALS_7DAYS[lang];
        dp.suhoor = ed?.suhoor || bank.suhoor[idx % bank.suhoor.length];
        dp.iftar = ed?.iftar || bank.iftar[idx % bank.iftar.length];
        dp.snack = ed?.snack || bank.snack[idx % bank.snack.length];
      }
      plan[day] = dp;
    });
    return plan;
  }, [mode, customWeeklyPlan, lang]);

  if (!auth.isLoggedIn) return <LoginView onLogin={(email) => setAuth({ email, isLoggedIn: true, method: 'manual' })} />;
  
  if (showSetup) return <SetupView onComplete={(u: any) => { 
    const completeUser = {...u, language: initialLanguage, mealRegenCount: 0}; 
    setUser(completeUser); 
    setShowSetup(false);
    setWeightLogs([{ date: new Date().toISOString().split('T')[0], weight: Number(u.currentWeight) }]);
    generateFullPlanAI(completeUser); 
  }} initialLang={initialLanguage} />;
  
  if (isGeneratingPlan) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
       <div className={`w-24 h-24 rounded-[2.5rem] ${themeColors.bg} flex items-center justify-center text-5xl shadow-2xl animate-bounce mb-8 text-white font-black`}>🤖</div>
       <h2 className="text-3xl font-black text-slate-800 mb-2">{lang === 'ar' ? 'جاري بناء موازنك الخاص...' : 'Building your personal balance...'}</h2>
       <p className="text-slate-400 font-bold px-4">{lang === 'ar' ? 'نستخدم استراتيجيات تدريب عالمية لضمان السرعة والدقة..' : 'Using global training strategies to ensure speed and accuracy..'}</p>
    </div>
  );

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : Number(user?.currentWeight);

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-500 ${mode === 'ramadan' ? 'bg-emerald-50/20' : 'bg-slate-50'}`}>
      <header className={`bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 px-6 py-4 transition-all ${mode === 'ramadan' ? 'border-emerald-100' : 'border-slate-100'}`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md ${mode === 'ramadan' ? 'bg-emerald-600' : themeColors.bg}`}>
              {mode === 'ramadan' ? '🌙' : 'م'}
             </div>
             <div><h1 className="text-lg font-black text-slate-800 leading-none">{t.appName}</h1><p className="text-[10px] font-bold text-slate-400 mt-1">{user?.name}</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'normal' ? 'ramadan' : 'normal')} className="px-4 py-2 rounded-xl text-xs font-black border bg-white shadow-sm transition-all hover:shadow-md">{mode === 'ramadan' ? t.ramadanMode : t.normalMode}</button>
            <button onClick={() => setShowShopping(true)} className="p-2 bg-white border rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">🛒</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-6 rounded-[2.5rem] text-white shadow-xl ${mode === 'ramadan' ? 'bg-emerald-600' : themeColors.bg} transition-all flex justify-between items-center`}>
                <div><p className="text-[10px] font-black opacity-70 uppercase tracking-widest">{t.remainingWeight}</p><h3 className="text-4xl font-black mt-1">{Math.abs(latestWeight - (user?.targetWeight || 0)).toFixed(1)} <span className="text-sm opacity-80">{t.kg}</span></h3></div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                  <span className="text-2xl font-black">{vitalScore}%</span>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div><h3 className="text-sm font-black text-slate-800">{t.energyMood}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ar' ? 'سجل حالتك الآن' : 'Log your state now'}</p></div>
                  <div className="text-2xl">{todayEnergy ? ['⚡', '🔋', '😐', '💤', '🥱'][5 - todayEnergy.level] : '✨'}</div>
                </div>
                <div className="flex justify-between gap-2 mt-4">
                  {[1, 2, 3, 4, 5].map(lv => (
                    <button key={lv} onClick={() => handleEnergyLog(lv)} className={`flex-1 py-2 rounded-xl text-lg transition-all ${todayEnergy?.level === lv ? 'bg-indigo-600 scale-110 shadow-lg' : 'bg-slate-50 grayscale opacity-60'}`}>
                      {['🥱', '💤', '😐', '🔋', '⚡'][lv-1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <WaterTracker amount={todayWater} goal={waterRequirementMl} onAdd={(ml) => setWaterLogs([...waterLogs.filter(l => l.date !== todayStr), { date: todayStr, amount: todayWater + ml }])} mode={mode} t={t} lang={lang} />
            <MealTable plan={currentPlan} mode={mode} onUpdateDay={(d, meals) => setCustomWeeklyPlan(p => ({...p, [d]: { ...p?.[d], ...meals }}))} user={user!} lang={lang} t={t} weeklyTips={weeklyTips} />
          </div>
        )}
        {activeTab === 'activity' && <ActivityTable user={user!} lang={lang} t={t} onGenerate={() => generateFullPlanAI(user!, true)} />}
        {activeTab === 'calendar' && <CalendarView logs={weightLogs} target={user!.targetWeight} onEditLog={(d, w) => setWeightLogs([...weightLogs.filter(l => l.date !== d), { date: d, weight: Number(w) }].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()))} lang={lang} />}
        {activeTab === 'chat' && <ChatAdvisor user={user!} logs={weightLogs} t={t} lang={lang} />}
        {activeTab === 'settings' && <SettingsView user={user!} onSave={(updatedUser) => { 
          const skipMeals = (user?.mealRegenCount || 0) >= 2;
          setUser(updatedUser); 
          generateFullPlanAI(updatedUser, skipMeals); 
        }} onLogout={handleLogout} theme={user?.theme || 'indigo'} onRegeneratePlan={() => {
           const skipMeals = (user?.mealRegenCount || 0) >= 2;
           generateFullPlanAI(user!, skipMeals);
        }} onInstall={() => {}} canInstall={!!deferredPrompt} t={t} lang={lang} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t px-6 py-4 flex justify-around items-center z-50 shadow-lg">
        {Object.entries(t.tabs).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === key ? (mode === 'ramadan' ? 'text-emerald-600 scale-110' : `${themeColors.text} scale-110`) : 'text-slate-400'}`}>
            <span className="text-2xl">{{plan:'🥘',activity:'🏃',chat:'✨',calendar:'📈',settings:'⚙️'}[key]}</span>
            <span className="text-[9px] font-black uppercase">{label}</span>
          </button>
        ))}
      </nav>
      {showShopping && <ShoppingListModal plan={currentPlan} onClose={() => setShowShopping(false)} manualItems={manualShoppingItems} onUpdateManual={setManualShoppingItems} lang={lang} />}
    </div>
  );
};

const SetupView: React.FC<{ onComplete: (u: UserProfile) => void; initialLang: Language }> = ({ onComplete, initialLang }) => {
  const t = translations[initialLang];
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '', age: 25, gender: 'male', height: 170, currentWeight: 70, targetWeight: 65,
    activityLevel: 'moderate', likedFoods: [], dislikedFoods: [], language: initialLang, theme: 'indigo', mealRegenCount: 0
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-black text-slate-800 mb-2">{t.setup.title}</h2>
        <p className="text-slate-500 text-sm mb-8 font-bold">{t.setup.subtitle}</p>

        {step === 1 && (
          <div className="space-y-4">
            <div><label className="block text-xs font-black text-slate-400 mb-2 uppercase">{t.setup.name}</label><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
            <button onClick={() => setStep(2)} disabled={!profile.name} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg mt-4 transition-all active:scale-95">{t.setup.next}</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div><label className="block text-xs font-black text-slate-400 mb-2 uppercase">{t.setup.height} (cm)</label><input type="number" value={profile.height} onChange={e => setProfile({...profile, height: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-400 mb-2 uppercase">{t.currentWeight}</label><input type="number" value={profile.currentWeight} onChange={e => setProfile({...profile, currentWeight: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
                <div><label className="block text-xs font-black text-slate-400 mb-2 uppercase">{t.setup.targetWeight}</label><input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
              </div>
            </div>
            <button onClick={() => onComplete(profile as UserProfile)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">إنهاء</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsView: React.FC<{ 
  user: UserProfile; onSave: (u: UserProfile) => void; onLogout: () => void; theme: AppTheme;
  onRegeneratePlan: () => void; onInstall: () => void; canInstall: boolean; t: any; lang: string;
}> = ({ user, onSave, onLogout, t }) => {
  const [edited, setEdited] = useState(user);
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm space-y-6">
        <h3 className="text-xl font-black text-slate-800 mb-4">{t.settings.title}</h3>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.name}</label><input value={edited.name} onChange={e => setEdited({...edited, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
        <button onClick={() => onSave(edited)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">{t.settings.save}</button>
      </div>
      <button onClick={onLogout} className="w-full p-4 text-rose-500 font-black text-xs uppercase hover:bg-rose-50 rounded-2xl transition-all">{t.settings.logout}</button>
    </div>
  );
};

export default App;
