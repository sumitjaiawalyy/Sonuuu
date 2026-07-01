/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import HeroSlider from './components/HeroSlider';
import DashboardLobby from './components/DashboardLobby';
import PopularGames from './components/PopularGames';
import Sports from './components/Sports';
import Promotions from './components/Promotions';
import Originals from './components/Originals';
import Matka from './components/Matka';
import LiveChat from './components/LiveChat';
import Footer from './components/Footer';
import GameModal from './components/games/GameModal';
import MenuDrawer from './components/MenuDrawer';
import { ActiveGameType, NotificationItem } from './types';
import { RotateCcw, Coins } from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import WalletAdminModal from './components/WalletAdminModal';
import AdminPanel from './components/AdminPanel';
import { updateBalanceBackend, requestDepositBackend, requestWithdrawalBackend, getUserProfile } from './lib/api';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Logged out by default for first-time visitors
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('damru_username');
      return cached || 'Player_Damru';
    }
    return 'Player_Damru';
  });
  const [balance, setBalance] = useState<number>(0);
  const [activeNav, setActiveNav] = useState<string>('home');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  }); // open by default only on desktop
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Auth modal controls
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'signup' }>({
    isOpen: false,
    tab: 'login',
  });

  // Active game window
  const [activeGame, setActiveGame] = useState<ActiveGameType>(null);

  // Interactive Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Wallet & Admin Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletModalTab, setWalletModalTab] = useState<'deposit' | 'withdraw' | 'tip' | 'admin'>('deposit');
  const [prefilledTipUsername, setPrefilledTipUsername] = useState<string>('');

  // Mutually exclusive toggle functions
  const handleToggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
      return next;
    });
  };

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsChatOpen(false);
        setIsMenuOpen(false);
      }
      return next;
    });
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsChatOpen(false);
        setIsNotificationsOpen(false);
      }
      return next;
    });
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const cachedBalance = localStorage.getItem('damru_balance');
    const cachedAuth = localStorage.getItem('damru_logged_in');
    
    if (cachedBalance !== null) {
      setBalance(parseFloat(cachedBalance));
    }
    if (cachedAuth !== null) {
      setIsLoggedIn(cachedAuth === 'true');
    }

    // Load or Seed Notifications
    const cachedNotifs = localStorage.getItem('damru_notifications');
    if (cachedNotifs !== null) {
      try {
        setNotifications(JSON.parse(cachedNotifs));
      } catch (err) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem('damru_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }

    // Automatically close chat on smaller screens only when crossing the 1024px width boundary
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if ((lastWidth < 1024 && currentWidth >= 1024) || (lastWidth >= 1024 && currentWidth < 1024)) {
        if (currentWidth < 1024) {
          setIsChatOpen(false);
        } else {
          setIsChatOpen(true);
        }
      }
      lastWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeNav === 'originals' || activeNav === 'matka') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const timer = setTimeout(() => {
        const element = document.getElementById(activeNav);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (activeNav === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeNav]);

  // Centralized body scroll lock for Menu, Chat (on mobile/tablet < 1024px), Notifications, and Active Game
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const checkAndLockScroll = () => {
      const isMobileChat = isChatOpen && window.innerWidth < 1024;
      const shouldLock = isMenuOpen || isNotificationsOpen || isMobileChat || !!activeGame;

      if (shouldLock) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        
        // Prevent layout shift on desktop when scrollbar disappears
        if (window.innerWidth >= 1024 && scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      } else {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };

    checkAndLockScroll();

    const handleResize = () => {
      checkAndLockScroll();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen, isNotificationsOpen, isChatOpen, activeGame]);

  const handleUpdateBalance = async (
    amount: number,
    isBet = false,
    gameName = "",
    multiplier = 0,
    payout = 0,
    status = ""
  ) => {
    let finalIsBet = isBet;
    let finalGameName = gameName;
    let finalMultiplier = multiplier;
    let finalPayout = payout;
    let finalStatus = status;

    if (!isBet && amount !== 0) {
      const currentGame = activeGame || (activeNav === 'matka' ? 'matka' : activeNav === 'sports' ? 'sports' : null);
      if (currentGame) {
        finalGameName = currentGame === 'matka' ? 'Matka Satta' : currentGame === 'sports' ? 'Sports Bet' : currentGame.toUpperCase();
        if (amount < 0) {
          finalIsBet = true;
          finalMultiplier = 0.00;
          finalPayout = 0.00;
          finalStatus = 'lost';
          sessionStorage.setItem('last_bet_amount', String(Math.abs(amount)));
        } else {
          finalIsBet = true;
          const lastBet = parseFloat(sessionStorage.getItem('last_bet_amount') || '0');
          if (lastBet > 0) {
            finalMultiplier = parseFloat((amount / lastBet).toFixed(2));
          } else {
            finalMultiplier = 2.00;
          }
          finalPayout = amount;
          finalStatus = 'won';
          sessionStorage.removeItem('last_bet_amount');
        }
      }
    }

    setBalance((prev) => {
      const updated = parseFloat((prev + amount).toFixed(2));
      localStorage.setItem('damru_balance', String(updated));
      return updated;
    });

    if (isLoggedIn && username) {
      try {
        const res = await updateBalanceBackend(username, amount, finalIsBet, finalGameName, finalMultiplier, finalPayout, finalStatus);
        if (res && res.balance !== undefined) {
          setBalance(res.balance);
          localStorage.setItem('damru_balance', String(res.balance));
        }
      } catch (err) {
        console.error("Failed to sync balance with server:", err);
      }
    }
  };

  const handleRefreshGlobalBalance = async () => {
    if (isLoggedIn && username) {
      try {
        const profile = await getUserProfile(username);
        if (profile && profile.balance !== undefined) {
          setBalance(profile.balance);
          localStorage.setItem('damru_balance', String(profile.balance));
        }
      } catch (e) {
        console.error("Balance sync failed on profile pull:", e);
      }
    }
  };

  const addNotification = (
    title: string,
    message: string,
    type: 'promo' | 'win' | 'bonus' | 'security' | 'system',
    rewardAmount?: number
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      isRead: false,
      rewardAmount,
      isClaimed: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('damru_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const handleReplenishEvent = (e: any) => {
      if (!isLoggedIn) {
        handleOpenAuth('login');
      } else {
        setWalletModalTab('deposit');
        setIsWalletModalOpen(true);
      }
    };
    window.addEventListener('replenish_balance', handleReplenishEvent);
    return () => window.removeEventListener('replenish_balance', handleReplenishEvent);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleOpenTipEvent = (e: any) => {
      const targetUser = e.detail || '';
      setPrefilledTipUsername(targetUser);
      setWalletModalTab('tip');
      setIsWalletModalOpen(true);
    };
    window.addEventListener('open_tip_user', handleOpenTipEvent);
    return () => window.removeEventListener('open_tip_user', handleOpenTipEvent);
  }, []);

  const handleLoginSuccess = (initialBalance: number, chosenUsername?: string) => {
    setIsLoggedIn(true);
    setBalance(initialBalance);
    localStorage.setItem('damru_logged_in', 'true');
    localStorage.setItem('damru_balance', String(initialBalance));

    const finalUsername = chosenUsername || 'Player_Damru';
    setUsername(finalUsername);
    localStorage.setItem('damru_username', finalUsername);

    addNotification(
      '🔑 Session Securely Established',
      `Welcome back, ${finalUsername}! Your sandbox practice credentials and verified session are active.`,
      'security'
    );
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setBalance(0);
    localStorage.setItem('damru_logged_in', 'false');
    localStorage.setItem('damru_balance', '0');

    addNotification(
      '🔒 Session Closed Successfully',
      `You have been safely signed out. Your practice progress is saved locally. See you soon!`,
      'security'
    );
  };

  const handleOpenAuth = (tab: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleDeposit = async (amount: number, method = "UPI", transactionId = "") => {
    if (isLoggedIn && username) {
      try {
        const txId = transactionId || `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        await requestDepositBackend(username, amount, method, txId);
        addNotification(
          '⏳ Deposit Request Placed',
          `Your deposit request of ₹${amount.toLocaleString()} is pending verification at the Admin Panel. Transaction ID: ${txId}`,
          'system'
        );
      } catch (err) {
        console.error("Deposit request failed:", err);
      }
    } else {
      handleUpdateBalance(amount);
      addNotification(
        '💰 Practice Deposit Successful!',
        `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} practice funds successfully credited to your wallet. Ready for action!`,
        'system'
      );
    }
  };

  const handleWithdraw = (amount: number, method = "Bank Transfer", details = ""): boolean => {
    if (balance < amount) return false;

    if (isLoggedIn && username) {
      const payoutDetails = details || "A/C: 9876543210, IFSC: SBIN0001234, Holder: Sandbox User";
      requestWithdrawalBackend(username, amount, method, payoutDetails)
        .then((res) => {
          if (res && res.nextBalance !== undefined) {
            setBalance(res.nextBalance);
            localStorage.setItem('damru_balance', String(res.nextBalance));
          }
        })
        .catch((err) => {
          console.error("Withdrawal request failed:", err);
        });

      addNotification(
        '⏳ Withdrawal Request Placed',
        `Your withdrawal request of ₹${amount.toLocaleString()} is pending approval. Standard practice credits deducted from your wallet.`,
        'system'
      );
      return true;
    } else {
      handleUpdateBalance(-amount);
      addNotification(
        '💸 Practice Withdrawal Processed!',
        `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} practice funds successfully processed and transferred.`,
        'system'
      );
      return true;
    }
  };

  const handleSendTip = (recipient: string, amount: number): boolean => {
    if (balance < amount) return false;
    handleUpdateBalance(-amount);
    addNotification(
      '🎁 Practice Tip Sent Successfully',
      `You tipped ₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} practice chips to player @${recipient}!`,
      'bonus'
    );
    return true;
  };

  const handleSendAdminNotification = (
    title: string,
    message: string,
    type: 'promo' | 'win' | 'bonus' | 'security' | 'system'
  ) => {
    addNotification(title, message, type);
  };

  // Notifications Handlers
  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem('damru_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.setItem('damru_notifications', JSON.stringify([]));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('damru_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem('damru_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClaimReward = (id: string, amount: number) => {
    if (!isLoggedIn) {
      alert("Please Sign In or Join the platform first to claim your practice chips!");
      handleOpenAuth('signup');
      return;
    }

    setNotifications((prev) => {
      const updated = prev.map((n) => 
        n.id === id ? { ...n, isClaimed: true, isRead: true } : n
      );
      localStorage.setItem('damru_notifications', JSON.stringify(updated));
      return updated;
    });
    handleUpdateBalance(amount);
    alert(`🎉 Success! ₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} practice chips added to your balance!`);
  };

  const handleRefreshSeeds = () => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    localStorage.setItem('damru_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
  };

  const replenishBalance = () => {
    setWalletModalTab('deposit');
    setIsWalletModalOpen(true);
  };

  const handleSelectNav = (nav: string) => {
    setActiveNav(nav);
    setActiveGame(null);
    if (window.innerWidth < 1024) {
      setIsChatOpen(false);
    }
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleUpdateUsername = (newName: string) => {
    setUsername(newName);
    localStorage.setItem('damru_username', newName);
  };

  const handleGoHome = () => {
    setActiveNav('home');
    setActiveGame(null);
    if (window.innerWidth < 1024) {
      setIsChatOpen(false);
    }
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    const el = document.getElementById('home');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div id="home" className="min-h-screen bg-[#0b0b0b] text-white font-sans flex flex-col relative overflow-x-clip selection:bg-brand selection:text-black">
      


      {/* Primary Sticky Header */}
      <Header
        onOpenAuth={handleOpenAuth}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userBalance={balance}
        activeNav={activeNav}
        setActiveNav={handleSelectNav}
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
        onOpenMenu={handleToggleMenu}
        onGoHome={handleGoHome}
        onToggleNotifications={handleToggleNotifications}
        unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
        isNotificationsOpen={isNotificationsOpen}
        username={username}
        onUpdateUsername={handleUpdateUsername}
      />

      {/* Bento Grid Sidebar & Main Viewport Wrapper */}
      <div className="flex flex-1 w-full relative">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={handleSelectNav}
          userBalance={balance}
          onOpenAuth={handleOpenAuth}
          isLoggedIn={isLoggedIn}
        />

        {/* Interactive Notification Center Overlay (Excludes Header and Footer, Responsive, Matches Theme) */}
        <AnimatePresence>
          {isNotificationsOpen && (
            <NotificationCenter
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearAll}
              onClaimReward={handleClaimReward}
              onMarkRead={handleMarkRead}
              onDelete={handleDeleteNotification}
            />
          )}
        </AnimatePresence>

        {/* Main Page Content Body */}
        <main className={`flex-1 min-h-[85vh] transition-all duration-300 ${isChatOpen ? 'lg:pr-[340px]' : 'pr-0'} z-10 min-w-0`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-3 md:pt-5 pb-10 space-y-12">
            
            {activeNav === 'admin' ? (
              <AdminPanel
                onSendAdminNotification={handleSendAdminNotification}
                onRefreshGlobalBalance={handleRefreshGlobalBalance}
              />
            ) : activeNav === 'originals' ? (
              <Originals
                onPlayGame={(gameId) => setActiveGame(gameId)}
                isLoggedIn={isLoggedIn}
                onOpenAuth={handleOpenAuth}
              />
            ) : activeNav === 'matka' ? (
              <Matka
                userBalance={balance}
                onUpdateBalance={handleUpdateBalance}
                isLoggedIn={isLoggedIn}
                onOpenAuth={handleOpenAuth}
              />
            ) : (
              <>
                {/* Animated Hero banner slider */}
                <HeroSlider
                  onOpenAuth={handleOpenAuth}
                  onPlayOriginal={(gameId) => setActiveGame(gameId as ActiveGameType)}
                  isLoggedIn={isLoggedIn}
                />

                {/* Dashboard Lobby: Categories, Search, and New Games */}
                <DashboardLobby
                  onPlayGame={(gameId) => setActiveGame(gameId)}
                  isLoggedIn={isLoggedIn}
                  onOpenAuth={handleOpenAuth}
                  onViewAllOriginals={() => handleSelectNav('originals')}
                  userBalance={balance}
                  onUpdateBalance={handleUpdateBalance}
                />
              </>
            )}
            
          </div>
        </main>
      </div>

      {/* Floating Collapsible Live Community Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <LiveChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            isLoggedIn={isLoggedIn}
            onOpenAuth={handleOpenAuth}
            username={username}
          />
        )}
      </AnimatePresence>

      {/* Universal Footer component */}
      <Footer
        activeNav={activeNav}
        setActiveNav={handleSelectNav}
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
        onOpenAuth={handleOpenAuth}
        onOpenMenu={handleToggleMenu}
        onGoHome={handleGoHome}
        isMenuOpen={isMenuOpen}
      />

      {/* Navigation Menu Drawer popup */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeNav={activeNav}
        setActiveNav={handleSelectNav}
        onOpenAuth={handleOpenAuth}
        isLoggedIn={isLoggedIn}
        onToggleChat={handleToggleChat}
      />



      {/* Interactive Originals Modal Container overlay */}
      <AnimatePresence>
        {activeGame && (
          <GameModal
            activeGame={activeGame}
            onClose={() => setActiveGame(null)}
            balance={balance}
            onUpdateBalance={handleUpdateBalance}
            isLoggedIn={isLoggedIn}
            onOpenAuth={handleOpenAuth}
            onSwitchGame={(game) => setActiveGame(game)}
          />
        )}
      </AnimatePresence>

      {/* Credentials Authentication overlay popup */}
      <AnimatePresence>
        {authModal.isOpen && (
          <AuthModal
            isOpen={authModal.isOpen}
            onClose={() => setAuthModal({ isOpen: false, tab: 'login' })}
            initialTab={authModal.tab}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>

      {/* Wallet, Tips & Admin Desk Sandbox controls overlay */}
      <AnimatePresence>
        {isWalletModalOpen && (
          <WalletAdminModal
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
            balance={balance}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onSendTip={handleSendTip}
            onSendAdminNotification={handleSendAdminNotification}
            initialTab={walletModalTab}
            prefilledUsername={prefilledTipUsername}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
