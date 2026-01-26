import React, { useState } from "react";
import { Language } from "../types";
import { translations } from "../i18n";
import { 
  auth, 
  db, 
  serverTimestamp
} from "../firebase";

// Analytics helper
const analytics = (window as any).firebaseAnalytics;

const trackEvent = (eventName: string, params?: any) => {
  if (analytics) {
    analytics.logEvent(eventName, params);
  }
};

interface LoginViewProps {
  onLogin: (email: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lang] = useState<Language>("ar");
  const t = translations[lang];

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError(t.login.fillFields);
      return;
    }

    if (password.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        // إنشاء حساب جديد
        const cred = await auth.createUserWithEmailAndPassword(email, password);

        // إنشاء وثيقة المستخدم في Firestore
        if (cred.user) {
          await db.collection("users").doc(cred.user.uid).set({
            email: cred.user.email,
            planId: "free",
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          }, { merge: true });
          
          // Analytics: تتبع التسجيل
          trackEvent('sign_up', { method: 'email' });
          if (analytics) analytics.setUserId(cred.user.uid);
        }

        onLogin(email);
        
      } else {
        // تسجيل دخول
        const cred = await auth.signInWithEmailAndPassword(email, password);
        
        // تحديث آخر تسجيل دخول
        if (cred.user) {
          await db.collection("users").doc(cred.user.uid).update({
            lastLoginAt: serverTimestamp(),
          });
          
          // Analytics: تتبع تسجيل الدخول
          trackEvent('login', { method: 'email' });
          if (analytics) analytics.setUserId(cred.user.uid);
        }
        
        onLogin(email);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      // Analytics: تتبع الأخطاء
      trackEvent('login_error', { 
        error_code: err?.code,
        mode: mode 
      });
      
      // ترجمة رسائل الخطأ
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': lang === 'ar' ? 'البريد الإلكتروني مستخدم مسبقاً' : 'Email already in use',
        'auth/invalid-email': lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email',
        'auth/user-not-found': lang === 'ar' ? 'المستخدم غير موجود' : 'User not found',
        'auth/wrong-password': lang === 'ar' ? 'كلمة المرور خاطئة' : 'Wrong password',
        'auth/invalid-credential': lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials',
        'auth/too-many-requests': lang === 'ar' ? 'محاولات كثيرة، حاول لاحقاً' : 'Too many attempts, try later',
        'auth/network-request-failed': lang === 'ar' ? 'خطأ في الاتصال بالشبكة' : 'Network error',
      };
      
      setError(errorMessages[err?.code] || err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
            🥗
          </div>

          <h1 className="text-3xl font-black text-slate-800">
            {t.appName}
          </h1>
          <p className="text-slate-500 font-bold mt-2">
            {mode === "login" ? t.login.subtitle : t.login.signupSubtitle}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase">
              {t.login.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
              dir="ltr"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase">
              {t.login.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500"
              dir="ltr"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-60 hover:bg-indigo-700 transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </span>
            ) : mode === "login" ? t.login.loginBtn : t.login.signupBtn}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            className="text-indigo-700 font-bold hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? t.login.noAccount : t.login.haveAccount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;