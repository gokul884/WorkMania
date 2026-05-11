import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, ArrowRight, Briefcase } from 'lucide-react';
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
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
          <Briefcase size={24} />
        </div>
        <span className="font-bold text-2xl tracking-tighter text-text-main">WorkMania</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-bg-card border border-border-accent rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">Create Account</h1>
          <p className="text-text-dim text-sm font-medium">Join thousands of freelancers working smarter</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {errors.signup && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm p-3 rounded-xl mb-6 font-medium">
              {errors.signup}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className={`w-full bg-bg-deep border ${errors.name ? 'border-rose-500' : 'border-border-accent'} rounded-xl pl-10 pr-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 font-medium`}
                placeholder="Robert Fox"
              />
            </div>
            {errors.name && <p className="text-rose-500 text-xs ml-1 font-bold">！ {errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className={`w-full bg-bg-deep border ${errors.email ? 'border-rose-500' : 'border-border-accent'} rounded-xl pl-10 pr-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 font-medium`}
                placeholder="robert@example.com"
              />
            </div>
            {errors.email && <p className="text-rose-500 text-xs ml-1 font-bold">！ {errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                className={`w-full bg-bg-deep border ${errors.password ? 'border-rose-500' : 'border-border-accent'} rounded-xl pl-10 pr-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 font-medium`}
                placeholder="••••••••"
              />
            </div>
            <PasswordStrength password={formData.password} />
            {errors.password && <p className="text-rose-500 text-xs ml-1 font-bold">！ {errors.password}</p>}
          </div>

          <div className="flex items-start gap-2 py-2">
            <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-border-accent bg-bg-deep text-primary focus:ring-primary" />
            <label className="text-xs text-text-dim leading-normal font-medium">
              I agree to the <span className="text-primary font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-primary font-bold hover:underline cursor-pointer">Privacy Policy</span>.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 sm:py-3.5 text-base sm:text-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-border-accent opacity-50"></div>
          <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-border-accent opacity-50"></div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn-secondary py-3.5 flex items-center justify-center gap-3 text-sm font-bold border-border-accent hover:bg-white/5 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <p className="mt-8 text-center text-text-dim text-sm font-medium">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">Log In</Link>
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
