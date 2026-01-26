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

// =====================================================
// 📊 Analytics Helper
// =====================================================
const analytics = (window as any).firebaseAnalytics;

const trackEvent = (eventName: string, params?: any) => {
  if (analytics) {
    analytics.logEvent(eventName, params);
  }
};

const trackScreenView = (screenName: string) => {
  if (analytics) {
    analytics.logEvent('screen_view', { screen_name: screenName });
  }
};

// =====================================================
// 🎨 Constants
// =====================================================
const THEMES: Record<AppTheme, { bg: string, text: string, primary: string, shadow: string, border: string, accent: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', primary: 'indigo', shadow: 'shadow-indigo-100', border: 'border-indigo-100', accent: 'bg-indigo-50' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', primary: 'emerald', shadow: 'shadow-emerald-100', border: 'border-emerald-100', accent: 'bg-emerald-50' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', primary: 'rose', shadow: 'shadow-rose-100', border: 'border-rose-100', accent: 'bg-rose-50' },
  slate: { bg: 'bg-slate-800', text: 'text-slate-800', primary: 'slate', shadow: 'shadow-slate-100', border: 'border-slate-100', accent: 'bg-slate-100' }
};

const UNHEALTHY_FOODS = [
  'سكر', 'حلويات', 'مقليات', 'شيبس', 'بيتزا', 'برجر', 'مشروبات غازية', 'صودا', 'دونات', 'وجبات سريعة',
  'sugar', 'candy', 'fried', 'chips', 'pizza', 'burger', 'soda', 'donuts', 'fast food', 'junk food'
];

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
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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

  // 📊 Analytics: Track tab changes
  useEffect(() => {
    trackScreenView(activeTab);
  }, [activeTab]);

  const themeColors = THEMES[user?.theme || 'indigo'];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWater = waterLogs.find(l => l.date === todayStr)?.amount || 0;
  const waterRequirementMl = Math.round((user?.currentWeight || 70) * 35);
  const todayEnergy = user?.energyLogs?.find(l => l.date === todayStr);

  const vitalScore = useMemo(() => {
    let score = 0;
    score += Math.min(30, (todayWater / (waterRequirementMl || 2500)) * 30);
    if (user?.trainingPlan) score += 30;
    if (todayEnergy) score += 10;
    score += 30; // Base score
    return Math.min(100, Math.round(score));
  }, [todayWater, waterRequirementMl, user, todayEnergy]);

  const generateFullPlanAI = async (profile?: UserProfile, skipMeals: boolean = false) => {
    const targetUser = profile || user;
    if (!targetUser) return;
    setIsGeneratingPlan(true);
    
    // 📊 Analytics: Track plan generation start
    trackEvent('plan_generation_started', { 
      skipMeals, 
      activityLevel: targetUser.activityLevel 
    });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const bmr = (10 * Number(targetUser.currentWeight)) + (6.25 * Number(targetUser.height)) - (5 * Number(targetUser.age)) + (targetUser.gender === 'male' ? 5 : -161);
      const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[targetUser.activityLevel] || 1.375;
      const dailyTarget = Math.round(bmr * activityMult);
      const targetLangName = targetUser.language === 'ar' ? 'Arabic' : 'English';
      
      const isWeightLoss = (targetUser.currentWeight > targetUser.targetWeight + 0.5);
      const strategyKey = isWeightLoss ? 'weightLoss' : (targetUser.activityLevel === 'active' ? 'muscleGain' : 'fitness');
      const strategy = (TRAINING_STRATEGIES as any)[targetUser.language][strategyKey];

      const prompt = skipMeals 
        ? `FAST TRACK: Generate a studied 21-day training plan for a ${targetUser.gender} using strategy "${strategy.name}". User: ${targetUser.age}yr, ${targetUser.height}cm, ${targetUser.currentWeight}kg. Language: ${targetLangName}. JSON strictly.`
        : `Generate meal & 21-day training plan for a ${targetUser.gender}. Strategy: "${strategy.name}". Target Daily Calories: ${dailyTarget}. Preferences: Likes ${targetUser.likedFoods.join(',')}, Dislikes ${targetUser.dislikedFoods.join(',')}. IMPORTANT: Respond strictly in ${targetLangName}. Keep meal names very short (MAX 6 WORDS). No long descriptions. JSON strictly.`;

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
      // Corrected extraction of text output from GenerateContentResponse
      const data = JSON.parse(response.text || '{}');
      if (!skipMeals && data.plan) setCustomWeeklyPlan(data.plan);
      setWeeklyTips(data.tips || []);
      if (data.trainingPlan) {
        const nextRegenCount = (targetUser.mealRegenCount || 0) + 1;
        setUser({ 
          ...targetUser, 
          trainingPlan: data.trainingPlan, 
          trainingPlanGeneratedAt: new Date().toISOString(), 
          dailyCalorieTarget: dailyTarget,
          mealRegenCount: nextRegenCount
        });
      }
      
      // 📊 Analytics: Track successful generation
      trackEvent('plan_generation_completed', { 
        skipMeals, 
        strategy: strategyKey,
        dailyCalories: dailyTarget
      });
      
    } catch (e) { 
      console.error(e);
      // 📊 Analytics: Track error
      trackEvent('plan_generation_error', { error: String(e) });
    } finally { 
      setIsGeneratingPlan(false); 
    }
  };

  const handleEnergyLog = (level: number) => {
    if (!user) return;
    const newLogs = [...(user.energyLogs || []).filter(l => l.date !== todayStr), { date: todayStr, level, mood: level > 3 ? 'Good' : 'Tired' }];
    setUser({ ...user, energyLogs: newLogs });
    
    // 📊 Analytics: Track energy log
    trackEvent('energy_logged', { level, mood: level > 3 ? 'good' : 'tired' });
  };

  const handleLogout = () => {
    // 📊 Analytics: Track logout
    trackEvent('logout');
    
    localStorage.clear();
    window.location.reload();
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      // 📊 Analytics: Track PWA install
      trackEvent('pwa_install_prompt', { outcome });
      
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  // 📊 Handler for mode change with analytics
  const handleModeChange = () => {
    const newMode = mode === 'normal' ? 'ramadan' : 'normal';
    setMode(newMode);
    trackEvent('mode_changed', { mode: newMode });
  };

  // 📊 Handler for water add with analytics
  const handleWaterAdd = (ml: number) => {
    const newTotal = todayWater + ml;
    setWaterLogs([...waterLogs.filter(l => l.date !== todayStr), { date: todayStr, amount: newTotal }]);
    
    trackEvent('water_added', { 
      amount: ml, 
      total: newTotal,
      goal: waterRequirementMl,
      percentage: Math.round((newTotal / waterRequirementMl) * 100)
    });
    
    // Check if goal achieved
    if (newTotal >= waterRequirementMl && todayWater < waterRequirementMl) {
      trackEvent('water_goal_achieved', { goal: waterRequirementMl });
    }
  };

  // 📊 Handler for tab change with analytics
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    trackEvent('tab_changed', { tab });
  };

  // 📊 Handler for shopping open with analytics
  const handleShoppingOpen = () => {
    setShowShopping(true);
    trackEvent('shopping_list_opened');
  };

  // 📊 Handler for weight log with analytics
  const handleWeightLog = (d: string, w: number) => {
    setWeightLogs([...weightLogs.filter(l => l.date !== d), { date: d, weight: Number(w) }].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()));
    
    trackEvent('weight_logged', { 
      weight: w, 
      date: d,
      remainingToGoal: Math.abs(Number(w) - (user?.targetWeight || 0))
    });
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
    const completeUser = {...u, mealRegenCount: 0}; 
    setUser(completeUser); 
    setShowSetup(false);
    setWeightLogs([{ date: new Date().toISOString().split('T')[0], weight: Number(u.currentWeight) }]);
    generateFullPlanAI(completeUser);
    
    // 📊 Analytics: Track profile setup complete
    trackEvent('profile_setup_complete', {
      gender: u.gender,
      activityLevel: u.activityLevel,
      goalType: u.currentWeight > u.targetWeight ? 'lose' : 'gain',
      language: u.language
    });
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
            <button onClick={handleModeChange} className="px-4 py-2 rounded-xl text-xs font-black border bg-white shadow-sm transition-all hover:shadow-md">{mode === 'ramadan' ? t.ramadanMode : t.normalMode}</button>
            <button onClick={handleShoppingOpen} className="p-2 bg-white border rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">🛒</button>
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

            <WaterTracker amount={todayWater} goal={waterRequirementMl} onAdd={handleWaterAdd} mode={mode} t={t} lang={lang} />
            <MealTable plan={currentPlan} mode={mode} onUpdateDay={(d, meals) => setCustomWeeklyPlan(p => ({...p, [d]: { ...p?.[d], ...meals }}))} user={user!} lang={lang} t={t} weeklyTips={weeklyTips} />
          </div>
        )}
        {activeTab === 'activity' && <ActivityTable user={user!} lang={lang} t={t} onGenerate={() => {
          generateFullPlanAI(user!, true);
          trackEvent('workout_plan_requested');
        }} />}
        {activeTab === 'calendar' && <CalendarView logs={weightLogs} target={user!.targetWeight} onEditLog={handleWeightLog} lang={lang} />}
        {activeTab === 'chat' && <ChatAdvisor user={user!} logs={weightLogs} t={t} lang={lang} />}
        {activeTab === 'settings' && <SettingsView user={user!} onSave={(updatedUser) => { 
          const skipMeals = (user?.mealRegenCount || 0) >= 2;
          setUser(updatedUser); 
          generateFullPlanAI(updatedUser, skipMeals);
          
          // 📊 Analytics: Track settings saved
          trackEvent('settings_saved', {
            languageChanged: updatedUser.language !== user?.language,
            weightChanged: updatedUser.currentWeight !== user?.currentWeight
          });
        }} onLogout={handleLogout} theme={user?.theme || 'indigo'} onRegeneratePlan={() => {
           generateFullPlanAI(user!);
           trackEvent('plan_regenerated');
        }} onInstall={handleInstall} canInstall={!!deferredPrompt} t={t} lang={lang} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t px-6 py-4 flex justify-around items-center z-50 shadow-lg">
        {Object.entries(t.tabs).map(([key, label]) => (
          <button key={key} onClick={() => handleTabChange(key as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === key ? (mode === 'ramadan' ? 'text-emerald-600 scale-110' : `${themeColors.text} scale-110`) : 'text-slate-400'}`}>
            <span className="text-2xl">{{plan:'🥘',activity:'🏃',chat:'✨',calendar:'📈',settings:'⚙️'}[key]}</span>
            <span className="text-[9px] font-black uppercase">{label}</span>
          </button>
        ))}
      </nav>
      {showShopping && <ShoppingListModal plan={currentPlan} onClose={() => setShowShopping(false)} manualItems={manualShoppingItems} onUpdateManual={setManualShoppingItems} lang={lang} />}
    </div>
  );
};

// --- المساعد الشخصي والتجهيز المحدث ---

const SetupView: React.FC<{ onComplete: (u: UserProfile) => void; initialLang: Language }> = ({ onComplete, initialLang }) => {
  const [lang, setLang] = useState(initialLang);
  const t = translations[lang];
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '', age: 25, gender: 'male', height: 170, currentWeight: 70, targetWeight: 65,
    activityLevel: 'moderate', likedFoods: [], dislikedFoods: [], language: lang, theme: 'indigo', mealRegenCount: 0
  });

  const [foodInput, setFoodInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const addFood = (food: string, type: 'liked' | 'disliked') => {
    const isUnhealthy = UNHEALTHY_FOODS.some(u => food.toLowerCase().includes(u));
    if (isUnhealthy) {
      setWarning(t.setup.unhealthyWarning);
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    const list = type === 'liked' ? [...(profile.likedFoods || [])] : [...(profile.dislikedFoods || [])];
    if (!list.includes(food.trim())) {
      list.push(food.trim());
      setProfile({ ...profile, [type === 'liked' ? 'likedFoods' : 'dislikedFoods']: list });
    }
    setFoodInput('');
  };

  const removeFood = (food: string, type: 'liked' | 'disliked') => {
    const list = type === 'liked' ? [...(profile.likedFoods || [])] : [...(profile.dislikedFoods || [])];
    const filtered = list.filter(f => f !== food);
    setProfile({ ...profile, [type === 'liked' ? 'likedFoods' : 'dislikedFoods']: filtered });
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 font-black">🚀</div>
          <h2 className="text-2xl font-black text-slate-800">{t.setup.title}</h2>
          <p className="text-slate-500 text-xs font-bold mt-1">{t.setup.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.name}</label><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="..." className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.age}</label><input type="number" value={profile.age} onChange={e => setProfile({...profile, age: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.gender}</label>
                   <div className="flex bg-slate-50 p-1 rounded-2xl border gap-1">
                      <button onClick={() => setProfile({...profile, gender: 'male'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${profile.gender === 'male' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{t.setup.male}</button>
                      <button onClick={() => setProfile({...profile, gender: 'female'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${profile.gender === 'female' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{t.setup.female}</button>
                   </div>
                </div>
              </div>
              <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Language / اللغة</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border gap-1">
                  <button onClick={() => { setLang('ar'); setProfile({...profile, language: 'ar'}); }} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${lang === 'ar' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>العربية</button>
                  <button onClick={() => { setLang('en'); setProfile({...profile, language: 'en'}); }} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>English</button>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!profile.name} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">{t.setup.next}</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.activityLevel}</label>
                <select value={profile.activityLevel} onChange={e => setProfile({...profile, activityLevel: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm">
                  <option value="sedentary">{lang === 'ar' ? 'خامل (مكتبي)' : 'Sedentary'}</option>
                  <option value="light">{lang === 'ar' ? 'نشاط خفيف' : 'Light'}</option>
                  <option value="moderate">{lang === 'ar' ? 'نشاط متوسط' : 'Moderate'}</option>
                  <option value="active">{lang === 'ar' ? 'نشاط عالٍ' : 'Active'}</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">{t.setup.height}</label><input type="number" value={profile.height} onChange={e => setProfile({...profile, height: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-sm" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">{t.currentWeight}</label><input type="number" value={profile.currentWeight} onChange={e => setProfile({...profile, currentWeight: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-sm" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">{t.setup.targetWeight}</label><input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setStep(1)} className="px-6 py-4 border rounded-2xl font-black text-xs">{t.setup.back}</button>
               <button onClick={() => setStep(3)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">{t.setup.next}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {warning && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-xl text-center animate-bounce">{warning}</div>}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase">{t.setup.likedFoods} ❤️</label>
              <div className="flex gap-2 mb-3">
                 <input value={foodInput} onChange={e => setFoodInput(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none font-bold text-xs" placeholder={t.setup.addFoodPlaceholder} />
                 <button onClick={() => addFood(foodInput, 'liked')} className="w-10 h-10 bg-indigo-600 text-white rounded-xl font-black">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto no-scrollbar border-b pb-4">
                {/* Fixed "unknown" error by asserting FOOD_OPTIONS[lang] values are string arrays */}
                {(Object.values(FOOD_OPTIONS[lang] as Record<string, string[]>)).flat().map(food => (
                  <button key={food} onClick={() => addFood(food, 'liked')} className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${profile.likedFoods?.includes(food) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>+{food}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.likedFoods?.map(f => (
                  <span key={f} onClick={() => removeFood(f, 'liked')} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100 cursor-pointer">#{f} ✕</span>
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase">{t.setup.dislikedFoods} 🚫</label>
              <div className="flex flex-wrap gap-2">
                {profile.dislikedFoods?.map(f => (
                  <span key={f} onClick={() => removeFood(f, 'disliked')} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100 cursor-pointer">#{f} ✕</span>
                ))}
              </div>
            </div>

            <button onClick={() => onComplete(profile as UserProfile)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">{t.setup.finish}</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsView: React.FC<{ 
  user: UserProfile; onSave: (u: UserProfile) => void; onLogout: () => void; theme: AppTheme;
  onRegeneratePlan: () => void; onInstall: () => void; canInstall: boolean; t: any; lang: Language;
}> = ({ user, onSave, onLogout, onInstall, canInstall, t, lang }) => {
  const [edited, setEdited] = useState(user);
  const [foodInput, setFoodInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const addFood = (food: string, type: 'liked' | 'disliked') => {
    const isUnhealthy = UNHEALTHY_FOODS.some(u => food.toLowerCase().includes(u));
    if (isUnhealthy) {
      setWarning(t.setup.unhealthyWarning);
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    const list = type === 'liked' ? [...(edited.likedFoods || [])] : [...(edited.dislikedFoods || [])];
    if (!list.includes(food.trim())) {
      list.push(food.trim());
      setEdited({ ...edited, [type === 'liked' ? 'likedFoods' : 'dislikedFoods']: list });
    }
    setFoodInput('');
  };

  const removeFood = (food: string, type: 'liked' | 'disliked') => {
    const list = type === 'liked' ? [...(edited.likedFoods || [])] : [...(edited.dislikedFoods || [])];
    const filtered = list.filter(f => f !== food);
    setEdited({ ...edited, [type === 'liked' ? 'likedFoods' : 'dislikedFoods']: filtered });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm space-y-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">{t.settings.title}</h3>
           <span className="text-[10px] font-black text-slate-300 uppercase">Profile Settings</span>
        </div>

        {warning && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-xl text-center animate-bounce">{warning}</div>}

        <div className="space-y-6">
          <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.name}</label><input value={edited.name} onChange={e => setEdited({...edited, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
          
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.age}</label><input type="number" value={edited.age} onChange={e => setEdited({...edited, age: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" /></div>
             <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.gender}</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border gap-1">
                   <button onClick={() => setEdited({...edited, gender: 'male'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${edited.gender === 'male' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{t.setup.male}</button>
                   <button onClick={() => setEdited({...edited, gender: 'female'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${edited.gender === 'female' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{t.setup.female}</button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.activityLevel}</label>
              <select value={edited.activityLevel} onChange={e => setEdited({...edited, activityLevel: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm">
                <option value="sedentary">{lang === 'ar' ? 'خامل (مكتبي)' : 'Sedentary'}</option>
                <option value="light">{lang === 'ar' ? 'نشاط خفيف' : 'Light'}</option>
                <option value="moderate">{lang === 'ar' ? 'نشاط متوسط' : 'Moderate'}</option>
                <option value="active">{lang === 'ar' ? 'نشاط عالٍ' : 'Active'}</option>
              </select>
            </div>
            <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Language / اللغة</label>
              <select value={edited.language} onChange={e => setEdited({...edited, language: e.target.value as Language})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.height} (CM)</label><input type="number" value={edited.height} onChange={e => setEdited({...edited, height: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-center" /></div>
             <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.currentWeight}</label><input type="number" value={edited.currentWeight} onChange={e => setEdited({...edited, currentWeight: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-center" /></div>
             <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.targetWeight}</label><input type="number" value={edited.targetWeight} onChange={e => setEdited({...edited, targetWeight: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-bold text-center" /></div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.likedFoods} ❤️</label>
            <div className="flex gap-2 mb-3">
               <input value={foodInput} onChange={e => setFoodInput(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none font-bold text-xs" placeholder={t.setup.addFoodPlaceholder} />
               <button onClick={() => addFood(foodInput, 'liked')} className="w-10 h-10 bg-indigo-600 text-white rounded-xl font-black">+</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto no-scrollbar border-b pb-4">
              {/* Fixed "unknown" error by asserting FOOD_OPTIONS[lang] values are string arrays */}
              {(Object.values(FOOD_OPTIONS[lang] as Record<string, string[]>)).flat().map(food => (
                <button key={food} onClick={() => addFood(food, 'liked')} className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${edited.likedFoods?.includes(food) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>+{food}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {edited.likedFoods?.map(f => (
                <span key={f} onClick={() => removeFood(f, 'liked')} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100 cursor-pointer">#{f} ✕</span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">{t.setup.dislikedFoods} 🚫</label>
            <div className="flex flex-wrap gap-2">
              {edited.dislikedFoods?.map(f => (
                <span key={f} onClick={() => removeFood(f, 'disliked')} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100 cursor-pointer">#{f} ✕</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-center space-y-2">
           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{lang === 'ar' ? 'محاولات تنسيق الوجبات المتبقية:' : 'Remaining meal replan attempts:'}</p>
           <p className="text-2xl font-black text-indigo-900">{Math.max(0, 2 - (edited.mealRegenCount || 0))} / 2</p>
        </div>

        <button onClick={() => onSave(edited)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700">
           {t.settings.save} 💾
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm space-y-4">
         <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">🧘 {lang === 'ar' ? 'تواصل مع المطور' : 'Contact Developer'}</h3>
         <div className="flex flex-col gap-3">
            <a href="mailto:b_aljazzar@yahoo.com" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border hover:border-indigo-200 transition-all">
               <span className="text-xl">📧</span>
               <span className="text-xs font-bold text-slate-600">b_aljazzar@yahoo.com</span>
            </a>
            <a href="https://www.linkedin.com/in/bassam-aljazzar/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border hover:border-indigo-200 transition-all">
               <span className="text-xl">🔗</span>
               <span className="text-xs font-bold text-slate-600">Bassam Aljazzar on LinkedIn</span>
            </a>
         </div>
      </div>

      <button onClick={onLogout} className="w-full p-4 text-rose-500 font-black text-xs uppercase hover:bg-rose-50 rounded-2xl transition-all">{t.settings.logout}</button>
    </div>
  );
};

export default App;