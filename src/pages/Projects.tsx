import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  IndianRupee, 
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react';
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
import { Project, Client, Status, Activity } from '../types';
import { format } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';

interface ProjectsProps {
  projects: Project[];
  clients: Client[];
  activities: Activity[];
  user: FirebaseUser | null;
}

export default function Projects({ projects, clients, user }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projects, searchTerm]);

  const handleDelete = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project || !user) return;
    
    try {
      await deleteDoc(doc(db, 'projects', id));
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'project',
        action: 'deleted',
        target: project.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const projectData = {
      userId: user.uid,
      name: formData.get('name') as string,
      clientId: formData.get('clientId') as string,
      status: formData.get('status') as Status,
      budget: Number(formData.get('budget')),
      dueDate: formData.get('dueDate') as string,
      description: formData.get('description') as string,
    };

    try {
      if (editingProject) {
        // Check if status changed to completed
        const isCompletedNow = projectData.status === 'completed' && editingProject.status !== 'completed';
        
        await updateDoc(doc(db, 'projects', editingProject.id), projectData);
        await addDoc(collection(db, 'activities'), {
          userId: user.uid,
          type: 'project',
          action: 'updated',
          target: projectData.name,
          timestamp: new Date().toISOString()
        });

        // Automatic Invoice Creation
        if (isCompletedNow) {
          await addDoc(collection(db, 'invoices'), {
            userId: user.uid,
            clientId: projectData.clientId,
            amount: projectData.budget,
            status: 'unpaid',
            date: format(new Date(), 'yyyy-MM-dd'),
            dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 14 days from now
            projectId: editingProject.id,
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}`
          });
          
          await addDoc(collection(db, 'activities'), {
            userId: user.uid,
            type: 'invoice',
            action: 'auto-generated',
            target: `Invoice for ${projectData.name}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        await addDoc(collection(db, 'projects'), projectData);
        await addDoc(collection(db, 'activities'), {
          userId: user.uid,
          type: 'project',
          action: 'added',
          target: projectData.name,
          timestamp: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Projects</h1>
          <p className="text-text-dim mt-1 font-medium">Manage and track all your active projects across workspace.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center justify-center gap-2 w-full tablet:w-auto py-3 px-6"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>New Project</span>
        </button>
      </div>

      <div className="bg-bg-card p-1.5 rounded-2xl border border-border-accent/50 shadow-inner">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
          <input 
            type="text" 
            placeholder="Filter projects by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent text-sm sm:text-base outline-none text-text-main placeholder:text-text-dim/50 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 gap-5 sm:gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group hover:border-primary/40 transition-all border-border-accent/40 shadow-xl hover:shadow-primary/5">
            <div className="flex justify-between items-start mb-4">
              <Badge variant={getStatusVariant(project.status)} className="px-3 py-1 text-[10px] font-bold tracking-widest">
                {project.status.toUpperCase()}
              </Badge>
              <div className="flex gap-1.5 translate-x-1 -translate-y-1">
                <button 
                  onClick={() => { setEditingProject(project); setIsModalOpen(true); }}
                  className="p-2 text-text-dim hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-text-dim hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg sm:text-xl text-text-main line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{project.name}</h3>
            <p className="text-text-dim text-sm mt-2 line-clamp-2 min-h-[40px] leading-relaxed font-medium">
              {project.description || "No description provided for this project."}
            </p>
            
            <div className="mt-6 pt-6 border-t border-border-accent/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-dim font-bold text-xs uppercase tracking-wider">
                  <Calendar size={14} className="text-primary" />
                  <span>{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1 font-black text-text-main">
                  <span className="text-primary text-base">₹</span>
                  <span className="text-lg tracking-tighter">{project.budget.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/[0.05]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold text-xs">
                  {clients.find(c => c.id === project.clientId)?.company.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-text-dim font-black uppercase tracking-widest leading-none">Client</p>
                  <p className="text-sm font-bold text-text-main truncate mt-1">
                    {clients.find(c => c.id === project.clientId)?.company}
                  </p>
                </div>
                <ChevronRight size={14} className="ml-auto text-text-dim opacity-30" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }} 
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Project Name</label>
            <input 
              name="name" 
              defaultValue={editingProject?.name} 
              required 
              className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-dim/50"
              placeholder="e.g. Brand Refresh"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Client</label>
              <select name="clientId" defaultValue={editingProject?.clientId} className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none">
                {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Status</label>
              <select name="status" defaultValue={editingProject?.status} className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Budget (₹)</label>
              <input 
                name="budget" 
                type="number" 
                defaultValue={editingProject?.budget} 
                className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Due Date</label>
              <input 
                name="dueDate" 
                type="date" 
                defaultValue={editingProject?.dueDate} 
                className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Description</label>
            <textarea 
              name="description" 
              defaultValue={editingProject?.description} 
              className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none min-h-[100px]"
              placeholder="Brief project overview..."
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 btn-secondary py-3"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary py-3">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getStatusVariant(status: Status) {
  switch (status) {
    case 'active': return 'primary';
    case 'completed': return 'success';
    case 'on-hold': return 'warning';
    default: return 'gray';
  }
}
