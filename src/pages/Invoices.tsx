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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Invoices</h1>
          <p className="text-text-dim">Track billing and payments.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="bg-bg-card p-1 rounded-xl border border-border-accent">
        <div className="p-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              type="text" 
              placeholder="Search ID or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-sm text-text-main"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2 text-sm"><Filter size={16} /> Filter</button>
            <button className="btn-secondary flex items-center gap-2 text-sm"><ArrowUpDown size={16} /> Sort</button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-xs font-bold text-text-dim uppercase tracking-widest border-y border-border-accent">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-accent">
              {filteredInvoices.map((inv) => {
                const client = clients.find(c => c.id === inv.clientId);
                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary/70" />
                        <span className="font-bold text-text-main">{inv.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={client?.avatar} alt="" className="w-8 h-8 rounded-lg bg-bg-card border border-border-accent" referrerPolicy="no-referrer" />
                        <span className="font-bold text-text-main text-sm">{client?.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-main text-sm">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getInvoiceStatusVariant(inv.status)}>{inv.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-text-dim text-sm font-medium">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-text-dim hover:text-text-main transition-all rounded-xl hover:bg-white/5">
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
                          className="p-2 text-text-dim hover:text-rose-500 transition-all rounded-xl hover:bg-white/5"
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
          {filteredInvoices.length === 0 && (
            <div className="p-12 text-center text-text-dim font-medium italic">No invoices found</div>
          )}
        </div>
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
