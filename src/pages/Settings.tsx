import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Save, Camera, Moon, Sun } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card } from '../components/UI';
import { User as FirebaseUser } from 'firebase/auth';

interface SettingsProps {
  user: FirebaseUser | null;
}

export default function Settings({ user }: SettingsProps) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatarUrl || null);
          setTheme(data.theme || 'dark');
        } else {
          setDisplayName(user.displayName || '');
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert('File size exceeds 800KB limit');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        avatarUrl,
        theme,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Profile saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || user?.email || 'User'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-text-main uppercase tracking-wider">Settings</h1>
        <p className="text-text-dim">Manage your profile and workspace preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-2">
          <SettingsNav icon={<User size={18} />} label="Profile" active />
          <SettingsNav 
            icon={<Bell size={18} />} 
            label="Notifications" 
            onClick={() => navigate('/notifications')}
          />
        </aside>

        <div className="flex-1 space-y-6">
          <Card title="Profile Information" subtitle="Update your personal details">
            <div className="space-y-8 mt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <img 
                    src={currentAvatar} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl bg-bg-card border-2 border-border-accent shadow-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-bg-card/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-2 border-primary/50"
                  >
                    <Camera size={20} className="text-text-main" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary text-sm px-6 py-2"
                  >
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-500 font-medium">PNG, JPG or SVG. Max size 800KB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Display Name</label>
                  <input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Email Address</label>
                <input defaultValue={user?.email || ''} readOnly className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-dim outline-none cursor-not-allowed font-medium" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest ml-1">Professional Bio</label>
                <textarea 
                  className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-1 focus:ring-primary/20 min-h-[120px] transition-all leading-relaxed font-medium"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="pt-6 border-t border-border-accent">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-text-main font-bold mb-1">Interface Theme</h4>
                    <p className="text-xs text-text-dim">Switch between light and dark mode</p>
                  </div>
                  <div className="flex bg-bg-card p-1 rounded-xl border border-border-accent">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-primary text-white dark:text-slate-900 shadow-lg font-bold' : 'text-text-dim hover:text-text-main'}`}
                    >
                      <Moon size={16} />
                      <span className="text-xs">Dark</span>
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-primary text-white dark:text-slate-900 shadow-lg font-bold' : 'text-text-dim hover:text-text-main'}`}
                    >
                      <Sun size={16} />
                      <span className="text-xs">Light</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-3 px-8 py-3 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? <Save size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </Card>

          <Card title="Danger Zone" className="border-rose-500/20 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
              <div className="text-center sm:text-left">
                <h4 className="font-bold text-rose-400 text-sm uppercase tracking-wider">Delete Account</h4>
                <p className="text-sm text-rose-400/60 mt-1">Permanently delete your workspace and all its data.</p>
              </div>
              <button className="px-6 py-2.5 text-rose-400 font-bold border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-sm shrink-0">
                Delete Workspace
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsNav({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-primary text-white dark:text-slate-900 font-bold shadow-lg shadow-primary/20' 
          : 'text-text-dim hover:bg-white/5 hover:text-text-main'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
