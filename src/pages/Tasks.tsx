import React, { useState, useMemo } from 'react';
import { Plus, Search, Calendar, Flag, CheckCircle2, Circle, MoreVertical, Trash2, X, CheckSquare } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, Badge } from '../components/UI';
import { Modal } from '../components/Modal';
import { Task, Project, Priority, Activity } from '../types';
import { format } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'motion/react';

interface TasksProps {
  tasks: Task[];
  projects: Project[];
  user: FirebaseUser | null;
}

export default function Tasks({ tasks, projects, user }: TasksProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tasks, searchTerm]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return;
    
    try {
      const nextStatus = task.status === 'done' ? 'todo' : 'done';
      await updateDoc(doc(db, 'tasks', id), {
        status: nextStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const taskData = {
      userId: user.uid,
      title: formData.get('title') as string,
      projectId: formData.get('projectId') as string,
      status: 'todo',
      priority: formData.get('priority') as Priority,
      dueDate: formData.get('dueDate') as string,
    };

    try {
      await addDoc(collection(db, 'tasks'), taskData);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Tasks</h1>
          <p className="text-text-dim mt-1 font-medium">Track your focus and manage your daily roadmap.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-primary flex items-center justify-center gap-2 w-full tablet:w-auto py-3 px-6"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex flex-col laptop:flex-row gap-6 tablet:gap-8">
        <div className="flex-1 space-y-4 sm:space-y-6 order-2 laptop:order-1">
          <div className="bg-bg-card p-1.5 rounded-2xl border border-border-accent/50 shadow-inner">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                type="text" 
                placeholder="Find a task..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm sm:text-base text-text-main placeholder:text-text-dim/50 font-medium"
              />
            </div>
          </div>

          <div className="card-base divide-y divide-border-accent/30 p-0 overflow-hidden shadow-2xl shadow-black/20">
            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
              <div key={task.id} className="p-4 sm:p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`transition-all duration-300 h-6 sm:h-7 w-6 sm:w-7 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-sm ${
                      task.status === 'done' 
                        ? 'bg-primary border-primary text-slate-950 scale-105' 
                        : 'border-border-accent hover:border-primary/50 text-transparent active:scale-90 shadow-inner'
                    }`}
                  >
                    {task.status === 'done' ? <CheckCircle2 size={16} strokeWidth={3} /> : null}
                  </button>
                  <div className="min-w-0 pr-2">
                    <h4 className={`font-bold transition-all text-sm sm:text-base leading-tight truncate ${task.status === 'done' ? 'text-text-dim/60 line-through' : 'text-text-main group-hover:text-primary'}`}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2">
                      <span className="font-extrabold text-primary/70 uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        {projects.find(p => p.id === task.projectId)?.name || 'Inbox'}
                      </span>
                      <div className="flex items-center gap-1.5 text-text-dim font-bold text-[10px] sm:text-xs">
                        <Calendar size={12} className="text-primary/40" />
                        <span className="opacity-70">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'gray'} className="px-2 py-0">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{task.priority}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="p-2 sm:p-2.5 text-text-dim hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-4 border border-border-accent/30">
                  <CheckSquare size={24} className="text-text-dim/30" />
                </div>
                <p className="text-text-dim font-bold text-sm uppercase tracking-widest opacity-50 italic">No tasks found</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full laptop:w-80 space-y-6 order-1 laptop:order-2">
          <Card title="Task Insight" subtitle="Your real-time productivity" className="border-border-accent/40 shadow-xl">
            <div className="space-y-4 pt-4">
              <SummaryItem label="Remaining" count={tasks.filter(t => t.status === 'todo').length} color="bg-slate-500" />
              <SummaryItem label="Doing" count={tasks.filter(t => t.status === 'in-progress').length} color="bg-amber-400" />
              <SummaryItem label="Done" count={tasks.filter(t => t.status === 'done').length} color="bg-emerald-400" />
            </div>
            <div className="mt-8 pt-6 border-t border-border-accent/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-text-dim uppercase tracking-widest opacity-70">Daily Progress</span>
                <span className="text-sm font-black text-primary tabular-nums">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-bg-deep rounded-full overflow-hidden border border-border-accent/30 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-1000 ease-out" 
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Task">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Task Title</label>
            <input name="title" required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="What needs to be done?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Project</label>
              <select name="projectId" className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Priority</label>
              <select name="priority" className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Due Date</label>
            <input name="dueDate" type="date" required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none" />
          </div>
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3">Cancel</button>
            <button type="submit" className="flex-1 btn-primary py-3">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SummaryItem({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-text-dim">{label}</span>
      </div>
      <span className="text-sm font-bold text-text-main">{count}</span>
    </div>
  );
}

function getPriorityColor(priority: Priority) {
  switch (priority) {
    case 'high': return 'text-rose-500';
    case 'medium': return 'text-amber-500';
    default: return 'text-emerald-500';
  }
}
