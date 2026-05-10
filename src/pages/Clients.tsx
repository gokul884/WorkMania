import React, { useState, useMemo } from 'react';
import { Plus, Search, Mail, Building, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card } from '../components/UI';
import { Modal } from '../components/Modal';
import { Client, Activity } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  user: FirebaseUser | null;
}

export default function Clients({ clients, setClients, setActivities, user }: ClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const clientData = {
      userId: user.uid,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
    };

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), clientData);
      } else {
        await addDoc(collection(db, 'clients'), clientData);
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'clients');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Clients</h1>
          <p className="text-text-dim">Manage your business relationships.</p>
        </div>
        <button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Add Client</span>
        </button>
      </div>

      <div className="bg-bg-card p-1 rounded-xl border border-border-accent">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-sm text-text-main"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="relative group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-accent flex items-center justify-center text-text-dim group-hover:text-primary transition-colors">
                  <Building size={32} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-text-main truncate text-lg">{client.name}</h3>
                  <p className="text-sm text-text-dim truncate font-medium">{client.company}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(client.id)}
                className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                title="Delete Client"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-text-main">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/70">
                  <Mail size={16} />
                </div>
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/70">
                  <Building size={16} />
                </div>
                <span>Client since 2024</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                className="flex-1 btn-secondary text-sm h-10 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <button className="flex-1 btn-secondary text-sm h-10 flex items-center justify-center gap-2 text-primary hover:text-cyan-300">
                <ExternalLink size={16} />
                Portal
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Full Name</label>
            <input name="name" defaultValue={editingClient?.name} required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Email Address</label>
            <input name="email" type="email" defaultValue={editingClient?.email} required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Company Name</label>
            <input name="company" defaultValue={editingClient?.company} required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3">Cancel</button>
            <button type="submit" className="flex-1 btn-primary py-3">{editingClient ? 'Update' : 'Add Client'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
