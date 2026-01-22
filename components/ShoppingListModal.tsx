
import React, { useState, useMemo } from 'react';
import { WeeklyPlan, Language } from '../types';
import { translations } from '../i18n';
import { DAYS_AR, DAYS_EN } from '../constants';

interface ShoppingListModalProps {
  plan: WeeklyPlan;
  onClose: () => void;
  manualItems: string[];
  onUpdateManual: (items: string[]) => void;
  lang: Language;
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ plan, onClose, manualItems, onUpdateManual, lang }) => {
  const t = translations[lang];
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [newItemName, setNewItemName] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState(lang === 'ar' ? DAYS_AR[0] : DAYS_EN[0]);

  const shoppingList = useMemo(() => {
    const ingredients = new Set<string>();
    
    const plansToProcess = viewMode === 'weekly' 
      ? Object.values(plan) 
      : [plan[selectedDay]].filter(Boolean);

    plansToProcess.forEach(day => {
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'activity' && value && typeof value === 'object' && 'ingredients' in value) {
          const meal = value as { ingredients: any };
          if (Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ing: string) => {
              if (typeof ing === 'string') ingredients.add(ing);
            });
          }
        }
      });
    });

    const categoriesAr: Record<string, string[]> = {
      '🍗 البروتينات': [],
      '🥗 الخضروات والفواكه': [],
      '🥛 الألبان والأجبان': [],
      '🛒 البقالة الأساسية': [],
      '➕ إضافات يدوية': manualItems
    };

    const categoriesEn: Record<string, string[]> = {
      '🍗 Proteins': [],
      '🥗 Veggies & Fruits': [],
      '🥛 Dairy & Cheese': [],
      '🛒 Main Groceries': [],
      '➕ Manual Additions': manualItems
    };

    const categorized = lang === 'ar' ? categoriesAr : categoriesEn;

    ingredients.forEach(item => {
      const lowerItem = item.toLowerCase();
      if (lowerItem.includes('دجاج') || lowerItem.includes('سمك') || lowerItem.includes('بيض') || lowerItem.includes('لحم') || lowerItem.includes('تونة') || lowerItem.includes('صدور') || lowerItem.includes('chicken') || lowerItem.includes('fish') || lowerItem.includes('egg') || lowerItem.includes('meat') || lowerItem.includes('tuna')) {
        categorized[lang === 'ar' ? '🍗 البروتينات' : '🍗 Proteins'].push(item);
      } else if (lowerItem.includes('خضار') || lowerItem.includes('فواكه') || lowerItem.includes('سلطة') || lowerItem.includes('خيار') || lowerItem.includes('طماطم') || lowerItem.includes('بروكلي') || lowerItem.includes('تمر') || lowerItem.includes('veggie') || lowerItem.includes('fruit') || lowerItem.includes('salad') || lowerItem.includes('tomato') || lowerItem.includes('cucumber')) {
        categorized[lang === 'ar' ? '🥗 الخضروات والفواكه' : '🥗 Veggies & Fruits'].push(item);
      } else if (lowerItem.includes('حليب') || lowerItem.includes('زبادي') || lowerItem.includes('جبن') || lowerItem.includes('لبنة') || lowerItem.includes('milk') || lowerItem.includes('yogurt') || lowerItem.includes('cheese') || lowerItem.includes('cream')) {
        categorized[lang === 'ar' ? '🥛 الألبان والأجبان' : '🥛 Dairy & Cheese'].push(item);
      } else {
        categorized[lang === 'ar' ? '🛒 البقالة الأساسية' : '🛒 Main Groceries'].push(item);
      }
    });

    return categorized;
  }, [plan, manualItems, lang, viewMode, selectedDay]);

  const toggleItem = (item: string) => {
    const next = new Set(checkedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setCheckedItems(next);
  };

  const addItem = () => {
    if (newItemName.trim()) {
      onUpdateManual([...manualItems, newItemName.trim()]);
      setNewItemName('');
    }
  };

  const removeItem = (item: string) => {
    onUpdateManual(manualItems.filter(i => i !== item));
    const next = new Set(checkedItems);
    next.delete(item);
    setCheckedItems(next);
  };

  const days = lang === 'ar' ? DAYS_AR : DAYS_EN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-[2.5rem]">
          <div>
            <h3 className="text-2xl font-black">{t.shopping.title}</h3>
            <p className="text-indigo-100 text-xs mt-1 font-bold">{t.shopping.subtitle}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-xl font-black">✕</button>
        </div>

        {/* View Mode Switcher */}
        <div className="p-4 bg-slate-50 border-b flex flex-col gap-4">
          <div className="flex bg-white p-1 rounded-2xl border shadow-sm gap-1">
             <button 
               onClick={() => setViewMode('weekly')}
               className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
             >
               {t.shopping.fullWeek}
             </button>
             <button 
               onClick={() => setViewMode('daily')}
               className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
             >
               {t.shopping.daily}
             </button>
          </div>
          
          {viewMode === 'daily' && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {days.map(d => (
                <button 
                  key={d} 
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black border whitespace-nowrap transition-all ${selectedDay === d ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white text-slate-400'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual Add Input */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex gap-2">
            <input 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder={t.shopping.addItem} 
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold text-xs" 
            />
            <button 
              onClick={addItem}
              className="px-5 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              {t.shopping.addBtn}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* Fix: Added explicit type cast to ensure 'items' has 'length' property during empty check */}
          {(Object.entries(shoppingList) as [string, string[]][]).every(([_, items]) => items.length === 0) ? (
            <div className="text-center py-20">
               <div className="text-5xl mb-4">🛒</div>
               <p className="text-slate-400 font-black">{t.shopping.empty}</p>
            </div>
          ) : (
            (Object.entries(shoppingList) as [string, string[]][]).map(([category, items]) => (
              items.length > 0 && (
                <div key={category}>
                  <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map(item => (
                      <div 
                        key={item}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          checkedItems.has(item) ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleItem(item)}>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            checkedItems.has(item) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'
                          }`}>
                            {checkedItems.has(item) && <span className="text-white text-[10px] font-bold">✓</span>}
                          </div>
                          <span className={`text-xs font-bold ${checkedItems.has(item) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {item}
                          </span>
                        </div>
                        {category.includes('➕') && (
                          <button onClick={() => removeItem(item)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-[2.5rem] flex justify-between items-center">
           <div className="flex flex-col">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.shopping.checked}</p>
              <p className="text-sm font-black text-slate-800">{checkedItems.size} {t.shopping.items}</p>
           </div>
           <button 
             onClick={() => window.print()}
             className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs shadow-xl hover:bg-black active:scale-95 transition-all"
           >
             {t.shopping.print}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListModal;
