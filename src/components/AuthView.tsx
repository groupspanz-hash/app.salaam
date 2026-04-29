import React from 'react';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export default function AuthView() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-sm w-full text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">POS System</h1>
        <p className="text-slate-500 mb-8">Login to manage your store</p>

        {error && <p className="text-red-500 mb-4 text-sm">{error.message}</p>}

        <button
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
