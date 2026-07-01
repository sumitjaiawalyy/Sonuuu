import React from 'react';
import { LayoutDashboard, Gamepad2, Trophy, Coins, Sparkles, Shield, Compass } from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  userBalance: number;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  isLoggedIn: boolean;
}

export default function Sidebar({
  activeNav,
  setActiveNav,
  userBalance,
  onOpenAuth,
  isLoggedIn
}: SidebarProps) {
  const sidebarItems = [
    { id: 'originals', label: 'Originals', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'matka', label: 'Matka Satta', icon: <Coins className="w-5 h-5 text-amber-400 animate-pulse" /> },
    { id: 'sports', label: 'Sports', icon: <Trophy className="w-5 h-5" /> },
    { id: 'casino', label: 'Casino', icon: <Compass className="w-5 h-5" /> },
    { id: 'promotions', label: 'Promotions', icon: <Sparkles className="w-5 h-5" /> },
  ];

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-[#0e0e0e] border-r border-white/5 p-5 flex-col justify-between h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-[#555] font-black px-2 mb-3">Main Menu</div>
          
          <button
            onClick={() => scrollToSection('originals')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-display font-semibold ${
              activeNav === 'originals'
                ? 'bg-[#dbfd4e]/10 text-[#dbfd4e] border-[#dbfd4e]/20 shadow-[inset_0_0_12px_rgba(219,253,78,0.05)]'
                : 'text-[#bdbdbd] border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-sm">Dashboard</span>
          </button>

          {sidebarItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-display font-semibold ${
                  isActive
                    ? 'bg-[#dbfd4e]/10 text-[#dbfd4e] border-[#dbfd4e]/20 shadow-[inset_0_0_12px_rgba(219,253,78,0.05)]'
                    : 'text-[#bdbdbd] border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}

          {/* Secure Admin Desk Link */}
          <button
            onClick={() => scrollToSection('admin')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-display font-semibold ${
              activeNav === 'admin'
                ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[inset_0_0_12px_rgba(239,68,68,0.05)] font-black'
                : 'text-zinc-400 border-transparent hover:text-red-400 hover:bg-red-500/5'
            }`}
          >
            <Shield className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
            <span className="text-sm">Admin Panel</span>
          </button>
        </div>

        {/* Practice Wallet Card in Sidebar */}
        {isLoggedIn && (
          <div className="p-4 bg-gradient-to-br from-[#171717] to-[#0c0c0c] rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#666] font-mono font-bold tracking-wider">PRACTICE WALLET</span>
              <Coins className="w-3.5 h-3.5 text-brand" />
            </div>
            <div>
              <div className="text-xl font-mono font-black text-white">
                ${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-brand font-mono font-semibold mt-0.5">PLAY CREDITS ACTIVE</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom VIP progression card (Classic Bento styling element) */}
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-br from-[#171717] to-[#0a0a0a] rounded-2xl border border-white/5 relative overflow-hidden group">
          {/* subtle glow */}
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#dbfd4e]/5 rounded-full blur-xl group-hover:bg-[#dbfd4e]/10 transition" />
          
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase font-bold text-[#666] font-mono">VIP Tier Level</div>
            <span className="text-[9px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20">68%</span>
          </div>
          
          <div className="text-sm font-display font-black text-[#dbfd4e] mb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-brand" /> Gold Member
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#dbfd4e] h-full rounded-full shadow-[0_0_8px_#dbfd4e]" 
              style={{ width: '68%' }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[9px] text-[#555] font-mono">Gold</span>
            <span className="text-[9px] text-brand/80 font-mono font-semibold">Platinum</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-[#444] font-mono">Damrubet certified provably fair</p>
        </div>
      </div>
    </aside>
  );
}
