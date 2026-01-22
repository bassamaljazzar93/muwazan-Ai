
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WeightLog, ChatMessage } from '../types';
import { GoogleGenAI } from '@google/genai';

interface ChatAdvisorProps {
  user: UserProfile;
  logs: WeightLog[];
  t: any;
  lang: string;
}

const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ user, logs, t, lang }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(() => Number(localStorage.getItem('hj_chat_count')) || 0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('hj_chat_count', msgCount.toString());
  }, [messages, msgCount]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || msgCount >= 10) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setMsgCount(prev => prev + 1);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemPrompt = `You are "Muwazan AI", a smart health assistant specialized in Gulf dietary habits and Ramadan fasting. User profile: ${user.name}, weight ${user.currentWeight}kg. Likes: ${user.likedFoods.join(', ')}. Dislikes: ${user.dislikedFoods.join(', ')}. Respond strictly in ${lang === 'ar' ? 'Arabic' : 'English'}. Be brief (max 3 sentences) and encouraging. Use Gulf Arabic expressions when in Arabic mode.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: input, config: { systemInstruction: systemPrompt } });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "..." }]);
    } catch (e) { setMessages(prev => [...prev, { role: 'model', text: "Error." }]); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border shadow-sm flex flex-col h-[70vh] animate-in fade-in">
      <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-[2.5rem]">
        <div><h3 className="text-xl font-black text-indigo-900">{t.chat.title}</h3><p className="text-[10px] font-bold text-indigo-400">{t.chat.subtitle}</p></div>
        <div className="text-right"><p className="text-[10px] font-black text-indigo-600">{10 - msgCount} {t.chat.remaining}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && <div className="text-center py-10"><p className="text-slate-800 font-black">{t.chat.welcome} {user.name}!</p></div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl font-bold text-xs ${m.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-600 text-white'}`}>{m.text}</div>
          </div>
        ))}
        {isLoading && <div className="text-indigo-500 animate-pulse text-[10px] font-black">{t.chat.thinking}</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-slate-50 rounded-b-[2.5rem] border-t flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t.chat.placeholder} className="flex-1 p-3 bg-white border rounded-xl outline-none font-bold text-xs" />
        <button onClick={sendMessage} disabled={isLoading || !input.trim() || msgCount >= 10} className="px-5 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md">OK</button>
      </div>
    </div>
  );
};

export default ChatAdvisor;
