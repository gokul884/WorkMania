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
      { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-text-main', bg: 'bg-white/5', trend: '0', trendUp: true },
    ];
  }, [invoices, projects, clients]);

  return (
    <div className="space-y-6 sm:space-y-8 tablet:space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl tablet:text-4xl font-extrabold text-text-main tracking-tight leading-tight">Project Overview</h1>
          <p className="text-text-dim mt-1 text-sm sm:text-base font-medium">Welcome back. Here's what needs your attention today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary" className="py-1.5 px-4 shadow-lg shadow-primary/10">Workspace Active</Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-4 gap-3 sm:gap-4">
        <QuickActionButton icon={<Plus size={20} />} label="New Project" href="/projects" color="from-cyan-500/20 to-blue-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="Add Task" href="/tasks" color="from-purple-500/20 to-indigo-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="New Invoice" href="/invoices" color="from-emerald-500/20 to-teal-500/20" />
        <QuickActionButton icon={<Plus size={20} />} label="Add Client" href="/clients" color="from-amber-500/20 to-orange-500/20" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card-base p-5 sm:p-6 hover:border-primary/30 transition-all border-border-accent/50 group">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border border-border-accent bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <stat.icon size={26} strokeWidth={2.5} />
              </div>
              <div className={`flex items-center gap-1 text-[13px] font-extrabold px-2 py-1 rounded-lg ${stat.trendUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                <span>{stat.trend}</span>
                {stat.trendUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-text-dim text-[11px] font-bold tracking-widest uppercase opacity-70 leading-none">{stat.label}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-text-main mt-1 tracking-tighter">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 laptop:grid-cols-1">
        {/* Revenue Chart */}
        <div className="w-full h-full">
          <Card 
            title="Revenue Insight" 
            subtitle="Financial growth trends" 
            className="h-full border-border-accent/50"
          >
            <div className="h-[250px] sm:h-[300px] tablet:h-[350px] w-full mt-6">
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
