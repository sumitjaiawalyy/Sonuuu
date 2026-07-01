import { useState, useEffect } from 'react';
import { Gamepad2, Trophy, TrendingUp, MessageSquare, Menu, HelpCircle, Shield, Info, Youtube, Twitter, Disc, Landmark, Instagram, Github, ChevronDown, Home, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface FooterProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onOpenMenu: () => void;
  onGoHome?: () => void;
  isMenuOpen: boolean;
}

export default function Footer({
  activeNav,
  setActiveNav,
  onToggleChat,
  isChatOpen,
  onOpenAuth,
  onOpenMenu,
  onGoHome,
  isMenuOpen,
}: FooterProps) {

  const [currentLang, setCurrentLang] = useState({ code: 'en', name: 'English', flag: '🇬🇧' });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
    { code: 'pt', name: 'Portuguese (Português)', flag: '🇧🇷' },
    { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  ];

  const mobileNavItems = [
    { 
      id: 'menu', 
      label: 'Menu', 
      icon: <Menu className="w-[18px] h-[18px]" />, 
      action: onOpenMenu,
      isActiveCondition: isMenuOpen 
    },
    { 
      id: 'home', 
      label: 'Home', 
      icon: <Home className="w-[18px] h-[18px]" />, 
      action: () => {
        if (onGoHome) {
          onGoHome();
        } else {
          setActiveNav('home');
          const el = document.getElementById('home');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      },
      isActiveCondition: !isChatOpen && !isMenuOpen && activeNav === 'home'
    },
    { 
      id: 'originals', 
      label: 'Originals', 
      icon: <Gamepad2 className="w-[18px] h-[18px]" />, 
      action: () => {
        setActiveNav('originals');
      },
      isActiveCondition: !isChatOpen && !isMenuOpen && activeNav === 'originals'
    },
    { 
      id: 'matka', 
      label: 'Matka', 
      icon: <Coins className="w-[18px] h-[18px] text-amber-400" />, 
      action: () => {
        setActiveNav('matka');
      },
      isActiveCondition: !isChatOpen && !isMenuOpen && activeNav === 'matka'
    },
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: <MessageSquare className="w-[18px] h-[18px]" />, 
      action: onToggleChat, 
      isActiveCondition: isChatOpen && !isMenuOpen 
    },
  ];

  return (
    <footer id="damrubet-footer" className="bg-[#08070a] border-t border-white/5 pt-12 pb-28 md:pb-16 px-4 md:px-8 select-none">
      
      {/* Footer Content Inner Wrapper */}
      <div className="max-w-[1200px] mx-auto">
        
        {/* Brand Header and Social Icons */}
        <div className="flex flex-col items-start gap-3">
          {/* Brand Logo and Name */}
          <div className="flex items-center gap-2 cursor-pointer">
            <svg
              viewBox="0 0 100 100"
              className="h-[36px] w-auto text-[#dbfd4e] fill-current filter drop-shadow-[0_0_8px_rgba(219,253,78,0.4)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left vertical capsule */}
              <rect x="2.5" y="15" width="10" height="70" rx="5" />
              {/* Bowtie / Hourglass shape */}
              <path d="M 22 15 L 50 50 L 22 85 Z M 78 15 L 78 85 L 50 50 Z" />
              {/* Right vertical capsule */}
              <rect x="87.5" y="15" width="10" height="70" rx="5" />
            </svg>
            <span className="font-display font-black text-xl text-white tracking-widest uppercase">
              DAMRU<span className="text-[#dbfd4e]">BET</span>
            </span>
          </div>

          {/* Social Icons (Grey Circles as in screenshot) */}
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Instagram */}
            <a href="#" className="group w-9 h-9 rounded-full bg-[#16151a] border border-white/5 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <Instagram className="w-4 h-4 text-[#888] group-hover:text-white transition" />
            </a>
            {/* Telegram */}
            <a href="#" className="group w-9 h-9 rounded-full bg-[#16151a] border border-white/5 flex items-center justify-center transition-all duration-300 hover:bg-[#229ED9]/10 hover:border-[#229ED9]/20 hover:scale-105">
              <svg className="w-3.5 h-3.5 text-[#888] group-hover:text-[#229ED9] fill-current transition" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.64-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.1-3.48 3.84-1.6 4.64-1.88 5.16-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.15-.03.22z" />
              </svg>
            </a>
            {/* X (Twitter) */}
            <a href="#" className="group w-9 h-9 rounded-full bg-[#16151a] border border-white/5 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <svg className="w-3.5 h-3.5 text-[#888] group-hover:text-white fill-current transition" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Youtube */}
            <a href="#" className="group w-9 h-9 rounded-full bg-[#16151a] border border-white/5 flex items-center justify-center transition-all duration-300 hover:bg-[#FF0000]/10 hover:border-[#FF0000]/20 hover:scale-105">
              <Youtube className="w-4 h-4 text-[#888] group-hover:text-[#FF0000] transition" />
            </a>
          </div>
        </div>

        {/* Language Bar (Interactive Language Selector Dropdown) */}
        <div className="flex items-center justify-between py-6 border-b border-white/5 gap-4 mt-5 relative">
          <span className="text-sm font-bold text-white tracking-wide">Language</span>
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 bg-[#121115] border border-white/5 hover:bg-[#1c1b22] rounded-xl text-xs font-semibold text-[#888] hover:text-white transition duration-200 shadow-sm"
            >
              <span className="text-sm select-none">{currentLang.flag}</span>
              <span>{currentLang.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#555] transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsLangDropdownOpen(false)} 
                />
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#121115] border border-white/10 rounded-xl py-1.5 shadow-2xl z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left transition duration-150 hover:bg-white/5 ${
                        currentLang.code === lang.code 
                          ? 'text-[#dbfd4e] font-bold bg-[#dbfd4e]/5' 
                          : 'text-[#bdbdbd] hover:text-white'
                      }`}
                    >
                      <span className="text-sm select-none">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* The Bento-style Columns Grid (4-quadrant layout with borders, perfect alignment and spacing as per screenshot) */}
        <div className="grid grid-cols-2 md:grid-cols-4 text-left mt-4">
          {/* Resources Column */}
          <div className="border-r border-b md:border-b-0 border-white/5 py-8 md:py-12 pr-6 md:pr-8 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">Resources</h4>
            <ul className="space-y-3 text-xs text-[#888]">
              <li><a href="#" className="hover:text-white transition-colors duration-200">VIP</a></li>
              <li><button onClick={() => setActiveNav('promotions')} className="hover:text-white transition-colors duration-200 text-left">Promotions</button></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Affiliate Program</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Partnerships</a></li>
            </ul>
          </div>

          {/* Sports Column */}
          <div className="border-b md:border-r md:border-b-0 border-white/5 py-8 md:py-12 pl-6 md:pl-8 pr-0 md:pr-8 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">Sports</h4>
            <ul className="space-y-3 text-xs text-[#888]">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on cricket</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on soccer</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on football</a></li>
            </ul>
          </div>

          {/* Casino Column */}
          <div className="border-r border-white/5 py-8 md:py-12 pl-0 md:pl-8 pr-6 md:pr-8 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">Casino</h4>
            <ul className="space-y-3 text-xs text-[#888]">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on matka</a></li>
              <li><button onClick={() => setActiveNav('originals')} className="hover:text-white transition-colors duration-200 text-left">Bet on originals</button></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on market</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bet on politics</a></li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="py-8 md:py-12 pl-6 md:pl-8 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">Support</h4>
            <ul className="space-y-3 text-xs text-[#888]">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Responsible gambling</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Gambling helpline</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Self exclusion</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Provably fair</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Bug Bounty program</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
            </ul>
          </div>
        </div>

      </div>

      {/* Floating Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/90 backdrop-blur-xl border-t border-white/10 px-6 pt-[10.7px] pb-[calc(10.7px+env(safe-area-inset-bottom,0px))] flex items-center justify-between z-50 shadow-2xl">
        {mobileNavItems.map((item) => {
          const isActive = item.isActiveCondition ?? activeNav === item.id;
          return (
            <button
              id={`mobile-footer-nav-${item.id}`}
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center gap-[2px] transition-all ${
                isActive ? 'text-[#38bdf8] scale-105' : 'text-[#bdbdbd] hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#0d1f30] border border-[#2596be]/20' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-semibold tracking-wider font-display uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
