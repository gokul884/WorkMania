import React from 'react';
import { Bell, Briefcase, CheckSquare, FileText, User, Zap, Info } from 'lucide-react';
import { Card } from '../components/UI';
import { Activity } from '../types';

interface NotificationsProps {
  activities: Activity[];
}

export default function Notifications({ activities }: NotificationsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return Briefcase;
      case 'task': return CheckSquare;
      case 'invoice': return FileText;
      case 'client': return User;
      default: return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'project': return 'text-primary bg-primary/10';
      case 'task': return 'text-amber-400 bg-amber-500/10';
      case 'invoice': return 'text-emerald-400 bg-emerald-500/10';
      case 'client': return 'text-violet-400 bg-violet-500/10';
      default: return 'text-slate-400 bg-white/5';
    }
  };

  const getTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-text-main mb-2">Notifications</h1>
        <p className="text-text-dim">Stay updated with your latest workspace activity</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getIcon(activity.type);
          const colorStyles = getColor(activity.type);
          
          return (
            <Card key={activity.id} className="hover:border-primary/20 transition-all cursor-default">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${colorStyles}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-text-main text-lg">
                      {activity.action} {activity.type}
                    </h3>
                    <span className="text-xs font-semibold text-text-dim whitespace-nowrap">
                      {getTimeLabel(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-text-dim leading-relaxed">
                    You {activity.action.toLowerCase()} the {activity.type} <span className="text-text-main font-bold">"{activity.target}"</span>.
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-20 bg-bg-card rounded-[2rem] border border-border-accent">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="text-text-dim" size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">All caught up!</h2>
          <p className="text-text-dim">No new notifications at the moment.</p>
        </div>
      )}
    </div>
  );
}
