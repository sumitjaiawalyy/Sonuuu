import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Flame, Trophy, Gift, Users, Crown, FileText, 
  Handshake, ShieldCheck, Headphones, Globe, ChevronDown, Check, Coins
} from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  isLoggedIn: boolean;
  onToggleChat: () => void;
}

export default function MenuDrawer({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
  onOpenAuth,
  isLoggedIn,
  onToggleChat,
}: MenuDrawerProps) {
  const [activeTab, setActiveTab] = useState<'casino' | 'sports'>('casino');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown states
  const [promotionsOpen, setPromotionsOpen] = useState(false);
  const [sponsorshipsOpen, setSponsorshipsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');

  const handleNavSelection = (id: string) => {
    setActiveNav(id);
    onClose();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const languages = ['English', 'हिन्दी (Hindi)', 'Español', 'Русский', 'Deutsch', '日本語'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-Screen Immersive Menu Overlay positioned between Header & Footer */}
          <motion.div
            initial={{ y: '30px', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '30px', opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed top-[60px] md:top-[68px] bottom-[61px] md:bottom-0 left-0 right-0 bg-[#09080c] z-[48] flex flex-col overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]"
          >
            {/* Main Content Layout with responsive width constraints for visual premium look */}
            <div className="w-full max-w-2xl mx-auto h-full flex flex-col relative bg-[#0d0c11]/40 border-x border-white/[0.02]">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-7 scrollbar-thin scrollbar-thumb-white/5 pt-8">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search Damrubet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card-dark border border-white/5 focus:border-brand/40 focus:ring-1 focus:ring-brand/10 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-white/30 outline-none transition"
                  />
                </div>

                {/* Casino / Sports Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('casino');
                      handleNavSelection('originals');
                    }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition border ${
                      activeTab === 'casino'
                        ? 'bg-brand/10 text-brand border-brand/25 shadow-[inset_0_0_12px_rgba(219,253,78,0.05)]'
                        : 'bg-card-dark text-[#bdbdbd] border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Flame className="w-4 h-4" /> Casino
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('sports');
                      handleNavSelection('sports');
                    }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition border ${
                      activeTab === 'sports'
                        ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/25 shadow-[inset_0_0_12px_rgba(37,150,190,0.05)]'
                        : 'bg-card-dark text-[#bdbdbd] border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Trophy className="w-4 h-4" /> Sports
                  </button>
                </div>

                {/* Menu List */}
                <div className="space-y-1">
                  
                  {/* Promotions - Expandable */}
                  <div>
                    <button
                      onClick={() => setPromotionsOpen(!promotionsOpen)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                        promotionsOpen 
                          ? 'bg-brand/5 border-brand/20 text-brand' 
                          : 'bg-card-dark border-white/5 text-[#bdbdbd] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-4.5 h-4.5 shrink-0" />
                        <span className="text-xs font-semibold tracking-wide">Promotions</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition duration-300 ${promotionsOpen ? 'rotate-180 text-brand' : 'text-[#666]'}`} />
                    </button>
                    
                    <AnimatePresence>
                      {promotionsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-5 pr-2 pt-1 pb-2 space-y-1.5 overflow-hidden"
                        >
                          <button
                            onClick={() => handleNavSelection('promotions')}
                            className="w-full text-left py-2 px-3 text-[11px] text-[#aaa] hover:text-brand rounded-lg hover:bg-white/5 transition font-semibold"
                          >
                            🎁 Welcome Practice Bonus
                          </button>
                          <button
                            onClick={() => handleNavSelection('promotions')}
                            className="w-full text-left py-2 px-3 text-[11px] text-[#aaa] hover:text-brand rounded-lg hover:bg-white/5 transition font-semibold"
                          >
                            🚀 Weekly High-RTP Multipliers
                          </button>
                          <button
                            onClick={() => handleNavSelection('promotions')}
                            className="w-full text-left py-2 px-3 text-[11px] text-[#aaa] hover:text-brand rounded-lg hover:bg-white/5 transition font-semibold"
                          >
                            ⭐ Elite VIP Tournaments
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Affiliate */}
                  <button
                    onClick={() => {
                      handleNavSelection('promotions');
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-card-dark border border-white/5 rounded-xl text-left text-[#bdbdbd] hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4.5 h-4.5 text-accent-blue shrink-0" />
                      <span className="text-xs font-semibold tracking-wide">Affiliate Partner Program</span>
                    </div>
                  </button>

                  {/* VIP Club */}
                  <button
                    onClick={() => {
                      handleNavSelection('promotions');
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-card-dark border border-white/5 rounded-xl text-left text-[#bdbdbd] hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-4.5 h-4.5 text-brand shrink-0" />
                      <span className="text-xs font-semibold tracking-wide font-display">VIP Club Elite benefits</span>
                    </div>
                  </button>

                  {/* Satta Matka */}
                  <button
                    onClick={() => {
                      handleNavSelection('matka');
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-[#1a0e27] border border-[#d946ef]/20 rounded-xl text-left text-white hover:bg-white/5 transition animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                      <span className="text-xs font-semibold tracking-wide font-display">Damru Satta Matka</span>
                    </div>
                  </button>

                  {/* Blog */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavSelection('originals');
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-card-dark border border-white/5 rounded-xl text-left text-[#bdbdbd] hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4.5 h-4.5 text-[#e04efd] shrink-0" />
                      <span className="text-xs font-semibold tracking-wide">Our Official Blog</span>
                    </div>
                  </a>

                  <div className="border-t border-white/5 my-4" />

                  {/* Sponsorships - Expandable */}
                  <div>
                    <button
                      onClick={() => setSponsorshipsOpen(!sponsorshipsOpen)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                        sponsorshipsOpen 
                          ? 'bg-accent-blue/5 border-accent-blue/20 text-accent-blue' 
                          : 'bg-card-dark border-white/5 text-[#bdbdbd] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Handshake className="w-4.5 h-4.5 shrink-0" />
                        <span className="text-xs font-semibold tracking-wide">Sponsorships</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition duration-300 ${sponsorshipsOpen ? 'rotate-180 text-accent-blue' : 'text-[#666]'}`} />
                    </button>
                    
                    <AnimatePresence>
                      {sponsorshipsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-5 pr-2 pt-1 pb-2 space-y-1.5 overflow-hidden"
                        >
                          <div className="py-2 px-3 text-[11px] text-[#aaa] font-medium border-l border-white/10">
                            ⚽ Official Indian Football Cup Partner
                          </div>
                          <div className="py-2 px-3 text-[11px] text-[#aaa] font-medium border-l border-white/10">
                            🥊 UFC Light-Heavyweight Global Title
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Responsible Gambling */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      alert("Please play responsibly. This is a secure practice environment with infinite standard credits available.");
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-card-dark border border-white/5 rounded-xl text-left text-[#bdbdbd] hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold tracking-wide">Responsible Gambling Panel</span>
                    </div>
                  </a>

                  {/* Live Support */}
                  <button
                    onClick={() => {
                      onClose();
                      onToggleChat();
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-card-dark border border-white/5 rounded-xl text-left text-[#bdbdbd] hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Headphones className="w-4.5 h-4.5 text-brand shrink-0 animate-pulse" />
                      <span className="text-xs font-semibold tracking-wide">24/7 Premium Live Support</span>
                    </div>
                  </button>

                  {/* Language Selector */}
                  <div>
                    <button
                      onClick={() => setLanguageOpen(!languageOpen)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                        languageOpen 
                          ? 'bg-white/5 border-white/10 text-white' 
                          : 'bg-card-dark border-white/5 text-[#bdbdbd] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4.5 h-4.5 text-[#cbd5e1] shrink-0" />
                        <span className="text-xs font-semibold tracking-wide">Language: {currentLang}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition duration-300 ${languageOpen ? 'rotate-180 text-white' : 'text-[#666]'}`} />
                    </button>
                    
                    <AnimatePresence>
                      {languageOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-5 pr-2 pt-1 pb-2 grid grid-cols-2 gap-1 overflow-hidden"
                        >
                          {languages.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                setCurrentLang(lang);
                                setLanguageOpen(false);
                              }}
                              className="flex items-center justify-between py-2 px-3 text-[11px] text-[#aaa] hover:text-brand rounded-lg hover:bg-white/5 transition text-left"
                            >
                              <span>{lang}</span>
                              {currentLang === lang && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>

              {/* Drawer Footer Actions */}
              {!isLoggedIn && (
                <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth('login');
                    }}
                    className="flex-1 py-3 bg-card-dark border border-white/10 hover:bg-white/5 text-white rounded-xl text-center text-xs font-bold uppercase tracking-wider transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth('signup');
                    }}
                    className="flex-1 py-3 bg-brand hover:bg-[#cbe83d] text-black rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all shadow-glow"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
