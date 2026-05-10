import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrors({});
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let errorMessage = err.message || 'Failed to sign in with Google';
      
      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'The request action is invalid. This might be a configuration issue in the Firebase console.';
      } else if (err.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        errorMessage = `Unauthorized domain: "${hostname}". Please add this EXACT domain to your Firebase Console under Authentication > Settings > Authorized domains.`;
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please enable Google provider in your Firebase Console under Authentication > Sign-in method.';
      }
      
      setErrors({ signup: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email address';
    if (formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Failed to create account';
      
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-up is not enabled. Please enable Email/Password provider in your Firebase Console under Authentication > Sign-in method.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please use a different email or log in.';
      }
      
      setErrors({ signup: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
          <Briefcase size={24} />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">WorkMania</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-bg-card border border-border-accent rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join thousands of freelancers working smarter</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {errors.signup && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm p-3 rounded-xl mb-6">
              {errors.signup}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className={`w-full bg-slate-900/50 border ${errors.name ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50`}
                placeholder="Robert Fox"
              />
            </div>
            {errors.name && <p className="text-rose-500 text-xs ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className={`w-full bg-slate-900/50 border ${errors.email ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50`}
                placeholder="robert@example.com"
              />
            </div>
            {errors.email && <p className="text-rose-500 text-xs ml-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                className={`w-full bg-slate-900/50 border ${errors.password ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50`}
                placeholder="••••••••"
              />
            </div>
            <PasswordStrength password={formData.password} />
            {errors.password && <p className="text-rose-500 text-xs ml-1">{errors.password}</p>}
          </div>

          <div className="flex items-start gap-2 py-2">
            <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary" />
            <label className="text-xs text-slate-500 leading-normal">
              I agree to the <span className="text-primary hover:underline cursor-pointer">Terms of Service</span> and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 text-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={20} />
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
          Already have an account? <Link to="/login" className="text-primary font-bold hover:text-cyan-300 transition-colors">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = password.length >= 8 ? (password.match(/[0-9]/) ? (password.match(/[^A-Za-z0-9]/) ? 3 : 2) : 1) : 0;
  const colors = ['bg-slate-800', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
  return (
    <div className="flex gap-1 mt-2 px-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? colors[strength] : 'bg-slate-800'}`} />
      ))}
    </div>
  );
}
