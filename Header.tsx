import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Trophy, Sparkles, User, Wallet, Flame, Search, Coins, 
  ChevronDown, Bell, Lock, Crown, Users, TrendingUp, History, 
  Gamepad2, Settings, ShieldCheck, Headphones, LogOut 
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userBalance: number;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenMenu: () => void;
  onGoHome?: () => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  username: string;
  onUpdateUsername: (name: string) => void;
}

export default function Header({
  onOpenAuth,
  isLoggedIn,
  onLogout,
  userBalance,
  activeNav,
  setActiveNav,
  onToggleChat,
  isChatOpen,
  onOpenMenu,
  onGoHome,
  onToggleNotifications,
  unreadNotificationsCount,
  isNotificationsOpen,
  username,
  onUpdateUsername,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'originals', label: 'Originals', icon: <Flame className="w-4 h-4 text-brand" /> },
    { id: 'matka', label: 'Matka Satta', icon: <Coins className="w-4 h-4 text-amber-400" /> },
    { id: 'sports', label: 'Sports', icon: <Trophy className="w-4 h-4 text-accent-blue" /> },
    { id: 'casino', label: 'Casino', icon: <Flame className="w-4 h-4 text-[#e04efd]" /> },
    { id: 'promotions', label: 'Promotions', icon: <Sparkles className="w-4 h-4 text-brand" /> },
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    
    // Smooth scroll to target sections if they exist
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)] py-3'
          : 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between relative">
        {/* Left Side: Logo & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <div
            id="logo-container"
            className="flex items-center cursor-pointer group"
            onClick={() => {
              if (onGoHome) {
                onGoHome();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="h-[33.5px] md:h-[41.5px] w-auto text-[#dbfd4e] fill-current transition duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(219,253,78,0.4)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left vertical capsule */}
              <rect x="2.5" y="15" width="10" height="70" rx="5" />
              {/* Bowtie / Hourglass shape */}
              <path d="M 22 15 L 50 50 L 22 85 Z M 78 15 L 78 85 L 50 50 Z" />
              {/* Right vertical capsule */}
              <rect x="87.5" y="15" width="10" height="70" rx="5" />
            </svg>
          </div>

          {/* Desktop Navigation */}
          <nav id="desktop-nav" className="hidden lg:flex items-center gap-1 bg-[#121212]/80 p-1.5 rounded-full border border-white/5">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 relative ${
                    isActive ? 'text-black font-bold' : 'text-[#bdbdbd] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-[#dbfd4e] rounded-full z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 font-display">
                    {!isActive && item.icon}
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Absolutely Centered Wallet Balance Pill */}
        {isLoggedIn && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex justify-center items-center pointer-events-auto">
            {/* Contiguous Wallet & Balance Pill with brand color */}
            <div
              className="flex items-stretch rounded-lg overflow-hidden bg-[#171717] border border-[#dbfd4e]/30 h-9 md:h-10 select-none shadow-[0_0_10px_rgba(219,253,78,0.05)] origin-center"
            >
              {/* Left Part: Balance display with currency symbol and dropdown arrow */}
              <div 
                onClick={() => {
                  if (window.confirm("Do you want to instantly replenish $1,000.00 standard practice funds?")) {
                    window.dispatchEvent(new CustomEvent('replenish_balance', { detail: 1000 }));
                  }
                }}
                className="flex items-center gap-1.5 px-3 md:px-4 cursor-pointer hover:bg-white/5 transition duration-150"
                title="Click to replenish practice balance"
              >
                {/* Glowing Brand Green Icon */}
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#dbfd4e]/10 border border-[#dbfd4e]/30 flex items-center justify-center text-[#dbfd4e] shrink-0 shadow-sm">
                  <span className="font-sans text-[10px] md:text-[12px] font-black leading-none text-[#dbfd4e]">₮</span>
                </div>
                {/* Amount */}
                <span className="font-sans font-extrabold text-xs md:text-sm text-white tracking-wide shrink-0">
                  {userBalance.toFixed(2)}
                </span>
                {/* Dropdown Chevron */}
                <ChevronDown className="w-3 md:w-3.5 h-3 md:h-3.5 text-gray-400 shrink-0" />
              </div>

              {/* Right Part: Brand Color Wallet Icon Button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('replenish_balance', { detail: 1000 }));
                }}
                className="bg-[#dbfd4e] hover:bg-[#cbe83d] text-black px-3 md:px-4 transition-all duration-150 flex items-center justify-center shrink-0 border-l border-[#dbfd4e]/20"
                title="Replenish Wallet with $1,000 practice funds"
              >
                <Wallet className="w-4 h-4 md:w-4.5 md:h-4.5 text-black" />
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Auth / User Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 md:gap-3">
              {/* Profile Icon with custom Stake-style Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                    isProfileOpen 
                      ? 'bg-brand text-black border-brand shadow-[0_0_12px_rgba(219,253,78,0.3)]' 
                      : 'bg-[#2f4553]/60 hover:bg-[#2f4553] text-[#8a97a0] hover:text-white border-white/5'
                  }`}
                  title="Profile Menu"
                >
                  <User className="w-[18px] h-[18px] md:w-5 md:h-5" />
                </button>

                {/* Floating Dropdown Window */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-60 bg-[#131315] border border-white/10 rounded-xl py-2 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(219,253,78,0.02)] z-50 overflow-hidden"
                    >
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-white/5 bg-[#171719] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{username}</p>
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
                      <div className="py-1 max-h-[380px] overflow-y-auto">
                        {/* 1. Wallet */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            window.dispatchEvent(new CustomEvent('replenish_balance', { detail: 1000 }));
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-[#dbfd4e] hover:bg-brand/5 transition duration-150 text-left"
                        >
                          <Wallet className="w-4 h-4 text-brand" />
                          <span>Wallet</span>
                        </button>

                        {/* 2. Vault */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Vault Active: Securely lock and reserve standard practice credits. Current Vault Balance: 0.00 coins.");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Lock className="w-4 h-4 text-[#8a97a0]" />
                          <span>Vault</span>
                        </button>

                        {/* 3. VIP */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleNavClick('promotions');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>VIP</span>
                        </button>

                        {/* 4. Affiliate */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Affiliate Program: Earn a 50% referral share on all practice games! Share your link to start.");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Users className="w-4 h-4 text-[#2596be]" />
                          <span>Affiliate</span>
                        </button>

                        {/* 5. Statistics */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Player Statistics:\n• Active Bets: 24\n• Total Wins: 15\n• Profit/Loss: +$420.50 practice USD\n• Level: Gold Player II");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span>Statistics</span>
                        </button>

                        {/* 6. Transactions */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Transactions History:\n1. Replenish Wallet: +$1,000.00\n2. Dice Game Outcome: +$45.00\n3. Plinko Ball Drop: -$10.00");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <History className="w-4 h-4 text-[#8a97a0]" />
                          <span>Transactions</span>
                        </button>

                        {/* 7. My Bets */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("My Bets: You currently have 0 active open-market sports bets and 4 settled original games.");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Gamepad2 className="w-4 h-4 text-purple-400" />
                          <span>My Bets</span>
                        </button>

                        {/* 8. Settings */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            const newUsername = prompt("Enter custom username:", username);
                            if (newUsername && newUsername.trim()) {
                              onUpdateUsername(newUsername.trim());
                              alert(`Username successfully updated to: ${newUsername.trim()}`);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Settings className="w-4 h-4 text-[#8a97a0]" />
                          <span>Settings</span>
                        </button>

                        {/* 9. Stake Smart */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Stake Smart Security Panel:\n• System validation: PROVABLY FAIR\n• Cryptographic Hash Seed verified.\n• Secure multi-factor practice keys.");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-brand" />
                          <span>Stake Smart</span>
                        </button>

                        {/* 10. Live Support */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            alert("Live Support Assistant:\nOur AI Customer Care Agent is online and active! Drop a query in the Live Chat sidebar on the right.");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition duration-150 text-left"
                        >
                          <Headphones className="w-4 h-4 text-cyan-400" />
                          <span>Live Support</span>
                        </button>

                        {/* 11. Logout */}
                        <div className="border-t border-white/5 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition duration-150 text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notification Bell Icon */}
              <button
                id="notification-bell-btn"
                onClick={onToggleNotifications}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-lg relative flex items-center justify-center border transition-all duration-200 ${
                  isNotificationsOpen 
                    ? 'bg-brand text-black border-brand hover:bg-[#cbe83d] shadow-glow' 
                    : 'bg-[#2f4553]/60 hover:bg-[#2f4553] text-[#8a97a0] hover:text-white border-white/5'
                }`}
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px] md:w-5 md:h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border border-[#0b0b0b] animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2.5 md:px-6 md:py-3 bg-[#0d1f30] text-[#38bdf8] hover:text-[#7dd3fc] hover:bg-[#152e47] text-sm md:text-[15px] font-bold rounded-full border border-[#2596be]/20 hover:border-[#2596be]/40 transition duration-300 shadow-sm shrink-0 flex items-center justify-center"
              >
                Sign in
              </button>
              <button
                id="header-signup-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-5 py-2.5 md:px-6 md:py-3 bg-[#dbfd4e] hover:bg-[#cbe83d] text-black text-sm md:text-[15px] font-black rounded-full shadow-[0_0_20px_rgba(219,253,78,0.25)] hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center justify-center"
              >
                Join
              </button>
            </div>
          )}

          {/* Toggle Live Chat button on Desktop */}
          <button
            id="chat-toggle-header"
            onClick={onToggleChat}
            className={`p-2.5 rounded-xl border transition hidden md:flex items-center justify-center ${
              isChatOpen
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'bg-card-dark/60 border-white/5 text-[#bdbdbd] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0c0c0c] border-b border-white/10 px-4 py-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  id={`mobile-nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition ${
                    activeNav === item.id
                      ? 'bg-brand/10 border-brand/30 text-brand'
                      : 'bg-card-dark border-white/5 text-[#bdbdbd] hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {!isLoggedIn && (
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  id="mobile-login-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="flex-1 py-3 bg-card-dark border border-white/10 text-white rounded-xl text-center text-sm font-semibold"
                >
                  Login
                </button>
                <button
                  id="mobile-signup-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="flex-1 py-3 bg-brand text-black rounded-xl text-center text-sm font-bold shadow-glow"
                >
                  Sign Up
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
