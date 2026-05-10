import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      // Detailed error reporting for debugging
      let errorMessage = err.message || 'Failed to sign in with Google';
      
      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'The request action is invalid. This might be a configuration issue in the Firebase console.';
      } else if (err.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        errorMessage = `Unauthorized domain: "${hostname}". Please add this EXACT domain to your Firebase Console under Authentication > Settings > Authorized domains.`;
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please enable Google provider in your Firebase Console under Authentication > Sign-in method.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Failed to sign in';
      
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-in is not enabled. Please enable Email/Password provider in your Firebase Console under Authentication > Sign-in method.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <Link to="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
          <Briefcase size={24} />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">WorkMania</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-bg-card border border-border-accent rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Log in to manage your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm p-3 rounded-xl mb-6">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50"
                placeholder="robert@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1 text-sm">
              <label className="font-semibold text-slate-300">Password</label>
              <button type="button" className="text-primary hover:text-cyan-300 transition-colors">Forgot Password?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary" />
            <label htmlFor="remember" className="text-sm text-slate-400">Remember me for 30 days</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 text-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn-secondary py-3.5 flex items-center justify-center gap-3 text-base font-semibold hover:bg-white/10 transition-all border-slate-700/50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Don't have an account? <Link to="/signup" className="text-primary font-bold hover:text-cyan-300 transition-colors">Sign up for free</Link>
        </p>
      </motion.div>
    </div>
  );
}
