
import React, { useState } from "react";
import { Language } from "../types";
import { translations } from "../i18n";

// Correctly importing modular auth and firestore functions from local firebase config
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  doc, 
  serverTimestamp, 
  setDoc 
} from "../firebase";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert(t.login.fillFields);
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ أنشئ/حدّث وثيقة المستخدم باستخدام UID كـ docId (أفضل من Auto-ID)
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            email: cred.user.email,
            planId: "free",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        onLogin(email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin(email);
      }
    } catch (err: any) {
      console.log(err);
      alert(err?.message || "Auth error");
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase">
              {t.login.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold"
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
              className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold"
              dir="ltr"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? t.login.loginBtn : t.login.signupBtn}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            className="text-indigo-700 font-bold"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? t.login.noAccount : t.login.haveAccount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
