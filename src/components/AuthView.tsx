import React from 'react';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export default function AuthView() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-20 h-20 bg-slate-900 rounded-[32px] mb-8 flex items-center justify-center shadow-2xl shadow-slate-200">
        <div className="w-8 h-8 border-4 border-emerald-500 rounded-lg animate-pulse" />
      </div>
      
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-2xl shadow-slate-200 max-w-sm w-full text-center">
        <h1 className="text-[28px] font-black text-slate-900 leading-none mb-3 tracking-tighter uppercase">STORE CORE</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 leading-none">Authentication Terminal</p>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <p className="text-rose-500 text-[10px] font-black uppercase leading-tight">{error.message}</p>
          </div>
        )}

        <button
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-4 rounded-[24px] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-100 uppercase tracking-widest text-[11px] disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>LOGGING IN...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </>
          )}
        </button>
        
        <p className="mt-10 text-[8px] font-black text-slate-300 uppercase tracking-widest">
          SYSTEM VERSION 2.0.4<br/>SECURE TERMINAL ACCESS
        </p>
      </div>
    </div>
  );
}
