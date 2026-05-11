import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: ReactNode;
  key?: string | number;
}

export function Card({ children, title, subtitle, className = '', headerAction }: CardProps) {
  return (
    <div className={`card-base ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            {title && <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-snug">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="ml-2">{headerAction}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'gray', className = '' }: { children: ReactNode, variant?: 'success' | 'warning' | 'danger' | 'primary' | 'gray', className?: string }) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    gray: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
