import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Briefcase, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Plus,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge } from '../components/UI';
import { Project, Client, Invoice, Activity } from '../types';
import { format } from 'date-fns';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  activities: Activity[];
}

const CHART_DATA: any[] = [];

export default function Dashboard({ clients, projects, invoices, activities }: DashboardProps) {
  const stats = useMemo(() => {
    const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0);
    const pendingRevenue = invoices.filter(inv => inv.status === 'unpaid').reduce((acc, inv) => acc + inv.amount, 0);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalClients = clients.length;

    return [
      { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', trend: '0%', trendUp: true },
      { label: 'Active Projects', value: activeProjects, icon: Briefcase, color: 'text-success', bg: 'bg-emerald-500/10', trend: '0', trendUp: true },
      { label: 'Pending Invoices', value: `$${pendingRevenue.toLocaleString()}`, icon: Clock, color: 'text-warning', bg: 'bg-amber-500/10', trend: '0%', trendUp: false },
      { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-slate-300', bg: 'bg-white/5', trend: '0', trendUp: true },
    ];
  }, [invoices, projects, clients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Project Overview</h1>
          <p className="text-text-dim mt-1">Welcome back. Here's what needs your attention.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary" className="py-1 px-4">Workspace Active</Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={<Plus size={20} />} label="New Project" href="/projects" color="from-cyan-500/20 to-blue-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="Add Task" href="/tasks" color="from-purple-500/20 to-indigo-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="New Invoice" href="/invoices" color="from-emerald-500/20 to-teal-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="Add Client" href="/clients" color="from-amber-500/20 to-orange-500/20" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card-base p-6 hover:border-text-main/10 transition-colors">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-border-accent`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${stat.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span>{stat.trend}</span>
                {stat.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-text-dim text-sm font-semibold tracking-wide uppercase">{stat.label}</p>
              <h2 className="text-3xl font-bold text-text-main mt-1 tracking-tight">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Revenue Chart */}
        <div className="w-full">
          <Card title="Revenue Growth" subtitle="Monthly earnings overview" className="h-full">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-accent)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-dim)', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-dim)', fontSize: 12}} 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-accent)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{color: 'var(--text-main)'}}
                    labelStyle={{color: 'var(--text-dim)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--primary-color)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: Activity['type'] }) {
  switch (type) {
    case 'project': return <Briefcase size={18} />;
    case 'invoice': return <FileText size={18} />;
    default: return <Clock size={18} />;
  }
}

function QuickActionButton({ icon, label, href, color }: { icon: React.ReactNode, label: string, href: string, color: string }) {
  return (
    <Link 
      to={href}
      className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} border border-border-accent hover:border-text-main/10 transition-all hover:scale-[1.02] group shadow-indigo`}
    >
      <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <span className="font-bold text-sm text-text-main">{label}</span>
    </Link>
  );
}
