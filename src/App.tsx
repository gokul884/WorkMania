/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  CheckSquare, 
  FileText, 
  Settings, 
  Search, 
  Bell, 
  Menu,
  LogOut,
  Loader2
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_INVOICES, 
  INITIAL_ACTIVITIES 
} from './constants';
import { Client, Project, Task, Invoice, Activity } from './types';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import SettingsPage from './pages/Settings';
import NotificationsPage from './pages/Notifications';

function ProtectedRoute({ children, user, loading }: { children: React.ReactNode, user: FirebaseUser | null, loading: boolean }) {
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/home" />;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<{ displayName?: string, avatarUrl?: string, theme?: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [deadlineReminders, setDeadlineReminders] = useState<string[]>([]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser?.uid, currentUser?.email);
      setUser(currentUser);
      setLoading(false);
    });

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => unsubscribeAuth();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setClients([]);
      setProjects([]);
      setTasks([]);
      setInvoices([]);
      setActivities([]);
      return;
    }

    const qClients = query(collection(db, 'clients'), where('userId', '==', user.uid));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });

    const qProjects = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });

    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    const qInvoices = query(collection(db, 'invoices'), where('userId', '==', user.uid));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'invoices');
    });

    const qActivities = query(collection(db, 'activities'), where('userId', '==', user.uid));
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      // Sort client-side to avoid missing index error
      docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'activities');
    });

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile(data as any);
        if (data.theme) {
          setTheme(data.theme);
        }
      }
    }, (error) => {
      console.warn('Profile read error:', error);
    });

    return () => {
      unsubscribeClients();
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeInvoices();
      unsubscribeActivities();
      unsubscribeProfile();
    };
  }, [user]);

  // Deadline Reminder Check
  useEffect(() => {
    if (!user || projects.length === 0) return;

    const checkDeadlines = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      for (const project of projects) {
        if (project.dueDate === tomorrowStr && project.status !== 'completed') {
          const reminderId = `reminder-${project.id}-${tomorrowStr}`;
          
          // Check if we already reminded for this specific project and date
          const alreadyReminded = activities.some(a => 
            a.type === 'notification' && 
            a.target === project.name && 
            a.action === 'Deadline approach'
          );

          if (!alreadyReminded) {
            try {
              await addDoc(collection(db, 'activities'), {
                userId: user.uid,
                type: 'notification',
                action: 'Deadline approach',
                target: project.name,
                timestamp: new Date().toISOString(),
                priority: 'high'
              });
              
              // Local toast notification
              if (!deadlineReminders.includes(reminderId)) {
                setDeadlineReminders(prev => [...prev, reminderId]);
              }
            } catch (error) {
              console.error('Error creating deadline notification:', error);
            }
          }
        }
      }
    };

    checkDeadlines();
  }, [projects, user, activities]);

  const contextValue = {
    clients, setClients,
    projects, setProjects,
    tasks, setTasks,
    invoices, setInvoices,
    activities, setActivities,
    user
  };

  return (
    <Router>
      <AnimatePresence>
        {deadlineReminders.length > 0 && (
          <div className="fixed top-24 right-6 z-[100] space-y-3">
            {deadlineReminders.map(id => {
              const projectId = id.split('-')[1];
              const project = projects.find(p => p.id === projectId);
              if (!project) return null;
              
              return (
                <motion.div 
                  key={id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-bg-card border-l-4 border-amber-500 shadow-2xl p-4 rounded-xl flex items-start gap-4 min-w-[320px] max-w-sm"
                >
                  <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-text-main line-clamp-1">Deadline Approaching</h4>
                    <p className="text-xs text-text-dim mt-1">
                      Project <span className="font-bold text-amber-500">"{project.name}"</span> is due tomorrow.
                    </p>
                  </div>
                  <button 
                    onClick={() => setDeadlineReminders(prev => prev.filter(r => r !== id))}
                    className="p-1 hover:bg-white/5 rounded-lg text-text-dim transition-colors"
                  >
                    <Menu className="rotate-45" size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
      <Routes>
        <Route path="/home" element={user ? <Navigate to="/" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute user={user} loading={loading}>
              <DashboardLayout 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
                user={user}
                profile={profile}
                projects={projects}
                clients={clients}
                setTheme={setTheme}
                theme={theme}
              >
                <Routes>
                  <Route index element={<Dashboard {...contextValue} />} />
                  <Route path="projects" element={<Projects {...contextValue} />} />
                  <Route path="clients" element={<Clients {...contextValue} />} />
                  <Route path="tasks" element={<Tasks {...contextValue} />} />
                  <Route path="invoices" element={<Invoices {...contextValue} />} />
                  <Route path="settings" element={<SettingsPage user={user} />} />
                  <Route path="notifications" element={<NotificationsPage activities={activities} />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function DashboardLayout({ children, isSidebarOpen, setIsSidebarOpen, user, profile, projects, clients, setTheme, theme }: { 
  children: React.ReactNode, 
  isSidebarOpen: boolean, 
  setIsSidebarOpen: (o: boolean) => void,
  user: FirebaseUser | null,
  profile: any,
  projects: Project[],
  clients: Client[],
  setTheme: (t: 'dark' | 'light') => void,
  theme: 'dark' | 'light'
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Search logic
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    
    const projectResults = projects
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => ({ id: p.id, name: p.name, type: 'project' as const, path: '/projects' }));
      
    const clientResults = clients
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(c => ({ id: c.id, name: c.name, type: 'client' as const, path: '/clients' }));
      
    return [...projectResults, ...clientResults];
  }, [searchQuery, projects, clients]);

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsSearching(false);
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-bg-deep overflow-hidden text-text-main">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-bg-deep border-b border-border-accent flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-text-dim hover:text-text-main">
              <Menu size={20} />
            </button>
            <span className="font-bold text-xl text-primary">WM</span>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                type="text" 
                placeholder="Search projects, clients..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                className="w-full bg-bg-card border border-border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
              />
              
              <AnimatePresence>
                {isSearching && searchQuery.length >= 2 && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSearching(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border-accent rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((result) => (
                            <button
                              key={`${result.type}-${result.id}`}
                              onClick={() => handleSearchResultClick(result.path)}
                              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                {result.type === 'project' ? <Briefcase size={16} className="text-primary" /> : <Users size={16} className="text-violet-400" />}
                                <span className="text-sm font-medium text-text-main">{result.name}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{result.type}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-text-dim">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-bg-deep"></span>
            </Link>
            <div className="w-px h-6 bg-border-accent mx-1"></div>
            <Link to="/settings" className="flex items-center gap-3 hover:bg-white/5 p-1 rounded-xl transition-all h-12">
              <div className="text-right hidden sm:block px-2">
                <p className="text-sm font-bold text-text-main truncate max-w-[150px]">{profile?.displayName || user?.displayName || 'User'}</p>
                <p className="text-xs text-text-dim font-medium tracking-wide uppercase truncate max-w-[120px]">{user?.email}</p>
              </div>
              <img 
                src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || user?.email || 'User'}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl bg-bg-card border border-border-accent object-cover"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Sidebar component
function Sidebar({ isOpen, toggle, setIsOpen }: { isOpen: boolean, toggle: () => void, setIsOpen: (o: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: Briefcase },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Invoices', path: '/invoices', icon: FileText },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`bg-bg-card border-r border-border-accent transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:relative ${isOpen ? 'translate-x-0 w-64 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center px-6 border-b border-border-accent">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white dark:text-slate-900 shrink-0">
                  <Briefcase size={20} />
                </div>
                {isOpen && <span className="font-bold text-xl tracking-tight text-text-main">WorkMania</span>}
              </div>
              <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-text-dim hover:text-text-main">
                <Menu className="rotate-90" size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={location.pathname === item.path ? 'nav-item-active' : 'nav-item'}
                title={!isOpen ? item.label : ''}
              >
                <item.icon size={20} className="shrink-0" />
                {isOpen && <span className="whitespace-nowrap font-semibold">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border-accent space-y-2">
            <Link 
              to="/settings" 
              className={location.pathname === '/settings' ? 'nav-item-active' : 'nav-item'}
              title={!isOpen ? 'Settings' : ''}
            >
              <Settings size={20} className="shrink-0" />
              {isOpen && <span className="whitespace-nowrap font-semibold">Settings</span>}
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full nav-item text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              title={!isOpen ? 'Log Out' : ''}
            >
              <LogOut size={20} className="shrink-0" />
              {isOpen && <span className="whitespace-nowrap font-semibold">Log Out</span>}
            </button>
            <button 
              onClick={toggle}
              className="mt-4 w-full nav-item hidden lg:flex border border-border-accent bg-bg-card shadow-sm"
            >
              <Menu size={20} className={`shrink-0 transition-transform ${!isOpen ? 'rotate-180' : ''}`} />
              {isOpen && <span className="whitespace-nowrap font-semibold">Collapse</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
