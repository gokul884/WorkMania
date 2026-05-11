import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText, Download, MoreVertical, Filter, ArrowUpDown, Trash2 } from 'lucide-react';
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
import { Invoice, Client, InvoiceStatus } from '../types';
import { format } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';

interface InvoicesProps {
  invoices: Invoice[];
  clients: Client[];
  user: FirebaseUser | null;
}

export default function Invoices({ invoices, clients, user }: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      return inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
             client?.company.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [invoices, clients, searchTerm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const invoiceData = {
      userId: user.uid,
      clientId: formData.get('clientId') as string,
      amount: Number(formData.get('amount')),
      status: 'unpaid',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: formData.get('dueDate') as string,
    };

    try {
      await addDoc(collection(db, 'invoices'), invoiceData);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'invoices');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Invoices</h1>
          <p className="text-text-dim mt-1 font-medium">Streamline your billing and track incoming revenue.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-primary flex items-center justify-center gap-2 w-full tablet:w-auto py-3 px-6"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="bg-bg-card p-1.5 rounded-2xl border border-border-accent/50 shadow-inner">
        <div className="p-1 sm:p-2 flex flex-col tablet:flex-row gap-3 sm:gap-4 items-center justify-between">
          <div className="relative w-full tablet:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              type="text" 
              placeholder="Search by ID or client name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm sm:text-base text-text-main placeholder:text-text-dim/50 font-medium"
            />
          </div>
          <div className="flex gap-2 w-full tablet:w-auto">
            <button className="flex-1 tablet:flex-none btn-secondary flex items-center justify-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-4"><Filter size={16} /> Filter</button>
            <button className="flex-1 tablet:flex-none btn-secondary flex items-center justify-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-4"><ArrowUpDown size={16} /> Sort</button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden tablet:block overflow-x-auto custom-scrollbar mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-text-dim uppercase tracking-[0.2em] border-y border-border-accent/30">
                <th className="px-6 py-5">Invoice ID</th>
                <th className="px-6 py-5">Client Entity</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Issue Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-accent/30">
              {filteredInvoices.map((inv) => {
                const client = clients.find(c => c.id === inv.clientId);
                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText size={16} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-text-main tabular-nums">{inv.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-text-dim">
                          {client?.company.charAt(0)}
                        </div>
                        <span className="font-bold text-text-main text-sm">{client?.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-text-main text-sm tracking-tight">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getInvoiceStatusVariant(inv.status)} className="font-black tracking-widest text-[10px]">
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-dim text-xs font-black uppercase tracking-wider">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-text-dim hover:text-primary transition-all rounded-xl hover:bg-white/5">
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (!user) return;
                            try {
                              await deleteDoc(doc(db, 'invoices', inv.id));
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `invoices/${inv.id}`);
                            }
                          }}
                          className="p-2 text-text-dim hover:text-rose-400 transition-all rounded-xl hover:bg-white/5"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="tablet:hidden divide-y divide-border-accent/30 mt-2">
          {filteredInvoices.map((inv) => {
            const client = clients.find(c => c.id === inv.clientId);
            return (
              <div key={inv.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Invoice</p>
                      <h4 className="font-black text-text-main tabular-nums mt-1">{inv.id}</h4>
                    </div>
                  </div>
                  <Badge variant={getInvoiceStatusVariant(inv.status)} className="px-2 py-0.5 text-[9px]">
                    {inv.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-text-dim uppercase tracking-widest leading-none">Client</p>
                    <p className="font-bold text-text-main text-sm mt-1 truncate">{client?.company}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-text-dim uppercase tracking-widest leading-none">Issue Date</p>
                    <p className="font-bold text-text-main text-sm mt-1">{format(new Date(inv.date), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="font-black text-primary text-xl">₹{inv.amount.toLocaleString('en-IN')}</div>
                   <div className="flex gap-2">
                    <button className="p-2.5 bg-white/5 text-text-dim rounded-xl">
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        if (!user) return;
                        try {
                          await deleteDoc(doc(db, 'invoices', inv.id));
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `invoices/${inv.id}`);
                        }
                      }}
                      className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-4 border border-border-accent/30">
               <FileText size={24} className="text-text-dim/30" />
             </div>
             <p className="text-text-dim font-bold text-sm uppercase tracking-widest opacity-50 italic">No invoices found</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Invoice">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Client</label>
            <select name="clientId" className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none">
              {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Amount (₹)</label>
              <input name="amount" type="number" required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Due Date</label>
              <input name="dueDate" type="date" required className="w-full px-4 py-3 bg-bg-card border border-border-accent rounded-xl text-text-main outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3">Cancel</button>
            <button type="submit" className="flex-1 btn-primary py-3">Create Invoice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getInvoiceStatusVariant(status: InvoiceStatus) {
  switch (status) {
    case 'paid': return 'success';
    case 'unpaid': return 'warning';
    case 'overdue': return 'danger';
    default: return 'gray';
  }
}
