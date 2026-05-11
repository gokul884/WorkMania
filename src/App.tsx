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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });
  const [deadlineReminders, setDeadlineReminders] = useState<string[]>([]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
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

  const currentThemeRef = React.useRef(theme);
  useEffect(() => {
    currentThemeRef.current = theme;
  }, [theme]);

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
        
        // Persist theme from Firestore if available
        if (data.theme && data.theme !== currentThemeRef.current) {
          setTheme(data.theme);
          localStorage.setItem('theme', data.theme);
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
                  <Route path="settings" element={<SettingsPage user={user} theme={theme} setTheme={setTheme} />} />
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
    <div className="flex h-screen bg-bg-deep overflow-hidden text-text-main flex-col lg:flex-row">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-bg-deep border-b border-border-accent flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-text-dim hover:text-text-main rounded-xl hover:bg-white/5 transition-all">
              <Menu size={22} />
            </button>
            <span className="font-black text-2xl text-primary tracking-tighter">WM</span>
          </div>

          <div className="flex-1 max-w-xl hidden md:block mx-12">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search everything..." 
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
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                {result.type === 'project' ? <Briefcase size={16} className="text-primary" /> : <Users size={16} className="text-violet-400" />}
                                <span className="text-sm font-medium text-text-main">{result.name}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-2 py-0.5 bg-white/5 rounded-md">{result.type}</span>
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

          <div className="flex items-center gap-2 sm:gap-4 ml-auto lg:ml-0">
            <Link to="/notifications" className="p-2.5 text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-bg-deep animate-pulse"></span>
            </Link>
            <div className="w-px h-6 bg-border-accent mx-1 hidden xs:block"></div>
            <Link to="/settings" className="flex items-center gap-3 hover:bg-white/5 p-1 sm:p-1 rounded-xl transition-all h-11 sm:h-12 border border-transparent hover:border-border-accent">
              <div className="text-right hidden sm:block px-2">
                <p className="text-sm font-bold text-text-main truncate max-w-[150px] leading-tight">{profile?.displayName || user?.displayName || 'User'}</p>
                <p className="text-[10px] text-text-dim font-bold tracking-wider uppercase truncate max-w-[120px] mt-0.5">{user?.email}</p>
              </div>
              <img 
                src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || user?.email || 'User'}`} 
                alt="Profile" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-card border border-border-accent object-cover ring-2 ring-primary/5 shadow-inner"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>
        </header>

        {/* Mobile Search Bar Stack */}
        <div className="md:hidden bg-bg-deep px-4 py-3 border-b border-border-accent">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              className="w-full bg-bg-card border border-border-accent rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 tablet:p-6 laptop:p-8 custom-scrollbar pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card/80 backdrop-blur-xl border-t border-border-accent z-[60] px-4 flex items-center justify-around translate-y-0 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]">
          <BottomNavItem to="/" icon={<LayoutDashboard size={20} />} label="Home" active={location.pathname === '/'} />
          <BottomNavItem to="/projects" icon={<Briefcase size={20} />} label="Projects" active={location.pathname === '/projects'} />
          <BottomNavItem to="/tasks" icon={<CheckSquare size={20} />} label="Tasks" active={location.pathname === '/tasks'} />
          <BottomNavItem to="/invoices" icon={<FileText size={20} />} label="Invoices" active={location.pathname === '/invoices'} />
          <BottomNavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} />
        </div>
      </div>
    </div>
  );
}

function BottomNavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center gap-1 transition-all px-3 py-1 rounded-xl ${active ? 'text-primary' : 'text-text-dim'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-tight lowercase ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="bottom-nav-indicator"
          className="w-1 h-1 bg-primary rounded-full absolute -bottom-1"
        />
      )}
    </Link>
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
            className="lg:hidden fixed inset-0 bg-bg-deep/80 backdrop-blur-md z-[55]"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`bg-bg-card border-r border-border-accent transition-all duration-500 fixed inset-y-0 left-0 z-[60] lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 w-72 xs-plus:w-80 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:w-20'}`}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center px-6 border-b border-border-accent">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white dark:text-slate-950 shrink-0 shadow-lg shadow-primary/20">
                  <Briefcase size={22} strokeWidth={2.5} />
                </div>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col"
                  >
                    <span className="font-extrabold text-xl tracking-tighter text-text-main leading-none">WorkMania</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5 opacity-70">Workspace</span>
                  </motion.div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="lg:hidden p-2.5 text-text-dim hover:text-text-main bg-white/5 rounded-xl transition-all">
                <Menu className="rotate-90" size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5 custom-scrollbar overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={active ? 'nav-item-active' : 'nav-item'}
                  title={!isOpen ? item.label : ''}
                >
                  <item.icon size={20} className={`shrink-0 transition-transform ${active ? 'scale-110' : ''}`} />
                  {isOpen && <span className="whitespace-nowrap font-bold tracking-tight">{item.label}</span>}
                  {active && isOpen && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="ml-auto w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border-accent space-y-2 pb-8 lg:pb-4">
            <Link 
              to="/settings" 
              className={location.pathname === '/settings' ? 'nav-item-active' : 'nav-item'}
              title={!isOpen ? 'Settings' : ''}
            >
              <Settings size={20} className="shrink-0" />
              {isOpen && <span className="whitespace-nowrap font-bold tracking-tight">Settings</span>}
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full nav-item text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:scale-[0.98]"
              title={!isOpen ? 'Log Out' : ''}
            >
              <LogOut size={20} className="shrink-0" />
              {isOpen && <span className="whitespace-nowrap font-bold tracking-tight">Log Out</span>}
            </button>
            <button 
              onClick={toggle}
              className="mt-4 w-full nav-item hidden lg:flex border border-border-accent bg-bg-card shadow-sm group active:scale-[0.98]"
            >
              <Menu size={20} className={`shrink-0 transition-transform group-hover:scale-110 ${!isOpen ? 'rotate-180' : ''}`} />
              {isOpen && <span className="whitespace-nowrap font-bold tracking-tight">Collapse View</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
