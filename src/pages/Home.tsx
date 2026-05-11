import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, ArrowRight, Zap, Shield, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-deep text-text-main selection:bg-primary/30 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border-accent/30 bg-bg-deep/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center text-slate-900">
              <Briefcase size={18} />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-text-main">WorkMania</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/login" className="text-xs sm:text-sm font-bold text-text-dim hover:text-text-main transition-colors uppercase tracking-wider">Log In</Link>
            <Link to="/signup" className="btn-primary py-1.5 px-4 sm:px-6 text-xs sm:text-sm shadow-lg shadow-primary/20">Join for Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-text-main leading-[1.1]">
              Work Smarter, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Not Harder.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-xl text-text-dim mb-10 leading-relaxed font-medium">
              The all-in-one workspace for freelancers. Manage projects, clients, tasks, and invoices with a clean, high-polished interface designed for speed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary py-3.5 sm:py-4 px-8 text-base sm:text-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-xl shadow-primary/25">
                Get Started Now <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary py-3.5 sm:py-4 px-8 text-base sm:text-lg w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10">
                Watch Demo
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 bg-slate-900/50 backdrop-blur-md"
          >
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3" 
              alt="Dashboard Preview" 
              className="w-full h-auto opacity-80"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard 
              icon={<Zap className="text-primary" />} 
              title="Lightning Fast" 
              description="A snappy UI that stays out of your way so you can focus on billable hours."
            />
            <FeatureCard 
              icon={<Shield className="text-primary" />} 
              title="Secure Billing" 
              description="Never miss a payment again with professional, integrated invoice tracking."
            />
            <FeatureCard 
              icon={<Users className="text-primary" />} 
              title="Client Focused" 
              description="Keep all your communication and project details organized in one central hub."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-accent/20 bg-bg-deep text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Briefcase className="text-primary" size={24} />
          <span className="font-bold text-lg tracking-tight text-text-main">WorkMania</span>
        </div>
        <p className="text-text-dim text-sm font-medium opacity-60">© 2024 WorkMania Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-bg-card/50 border border-border-accent/40 hover:border-primary/30 transition-all group backdrop-blur-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-text-main">{title}</h3>
      <p className="text-text-dim leading-relaxed font-medium">{description}</p>
    </div>
  );
}
