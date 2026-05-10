import React, { useState, useMemo } from 'react';
import { Plus, Search, Calendar, Flag, CheckCircle2, Circle, MoreVertical, Trash2, X } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tasks</h1>
          <p className="text-text-dim">Track and manage your daily todos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="bg-bg-card p-1 rounded-xl border border-border-accent">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-sm text-text-main"
              />
            </div>
          </div>

          <div className="card-base divide-y divide-border-accent p-0 overflow-hidden">
            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`transition-colors h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      task.status === 'done' 
                        ? 'bg-primary border-primary text-white dark:text-slate-900' 
                        : 'border-border-accent hover:border-primary/50 text-transparent'
                    }`}
                  >
                    {task.status === 'done' ? <X size={14} strokeWidth={3} /> : null}
                  </button>
                  <div>
                    <h4 className={`font-bold transition-all ${task.status === 'done' ? 'text-text-dim line-through' : 'text-text-main'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="font-bold text-primary/80 uppercase tracking-widest text-[10px]">
                        {projects.find(p => p.id === task.projectId)?.name}
                      </span>
                      <div className="flex items-center gap-1 text-text-dim font-medium">
                        <Calendar size={12} className="text-primary/50" />
                        <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'gray'}>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{task.priority}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-slate-500 font-medium italic">No tasks found</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 space-y-6 hidden lg:block">
          <Card title="Task Summary" subtitle="Your productivity at a glance">
            <div className="space-y-4 pt-4">
              <SummaryItem label="To Do" count={tasks.filter(t => t.status === 'todo').length} color="bg-slate-500" />
              <SummaryItem label="In Progress" count={tasks.filter(t => t.status === 'in-progress').length} color="bg-amber-400" />
              <SummaryItem label="Completed" count={tasks.filter(t => t.status === 'done').length} color="bg-emerald-400" />
            </div>
            <div className="mt-8 pt-6 border-t border-border-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Completion</span>
                <span className="text-sm font-bold text-text-main">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-bg-card rounded-full overflow-hidden border border-border-accent">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }}
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
