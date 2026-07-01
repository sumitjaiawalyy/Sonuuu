/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, X, Gift, Trophy, Flame, ShieldCheck, Info, Trash2, 
  CheckCheck, Coins, Sparkles
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClaimReward: (id: string, amount: number) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationCenter({
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onClaimReward,
  onMarkRead,
  onDelete,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Custom animation configs
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.25,
        staggerChildren: 0.04 
      }
    },
    exit: { 
      opacity: 0, 
      y: 15, 
      transition: { duration: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } }
  };

  const getIconAndColors = (type: string, isRead: boolean) => {
    switch (type) {
      case 'bonus':
        return {
          icon: <Gift className="w-4 h-4 text-brand" />,
          bgClass: 'bg-brand/10 border-brand/20',
          textClass: 'text-brand',
          badgeText: 'BONUS',
        };
      case 'win':
        return {
          icon: <Trophy className="w-4 h-4 text-amber-400" />,
          bgClass: 'bg-amber-400/10 border-amber-400/20',
          textClass: 'text-amber-400',
          badgeText: 'BIG WIN',
        };
      case 'promo':
        return {
          icon: <Flame className="w-4 h-4 text-cyan-400" />,
          bgClass: 'bg-cyan-400/10 border-cyan-400/20',
          textClass: 'text-cyan-400',
          badgeText: 'OFFER',
        };
      case 'security':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          bgClass: 'bg-emerald-400/10 border-emerald-400/20',
          textClass: 'text-emerald-400',
          badgeText: 'SECURITY',
        };
      case 'system':
      default:
        return {
          icon: <Info className="w-4 h-4 text-zinc-400" />,
          bgClass: 'bg-zinc-400/10 border-zinc-400/20',
          textClass: 'text-zinc-400',
          badgeText: 'SYSTEM',
        };
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-x-0 top-[58px] md:top-[66px] bottom-[60px] md:bottom-0 lg:left-[256px] z-[48] bg-[#0b0b0b]/98 backdrop-blur-md flex flex-col overflow-hidden"
    >
      {/* 1. Ultra-clean Header of Notification Center */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/5 bg-[#121212]/90">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-black tracking-tight text-white truncate">
              Notification Center
            </h2>
            <p className="text-[10px] text-zinc-400 truncate hidden sm:block">Receive practice coins, security alerts, and live multi highlights</p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={onClose}
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition duration-150 shrink-0"
            title="Back to lobby"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Left/Main Column: Filters, Notifications List */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-3 md:px-6 md:py-4 space-y-3">
          
          {/* Action Row: Perfectly Aligned and Responsive Mark Read and Clear */}
          <div className="flex items-center justify-between gap-3 w-full border-b border-white/5 pb-3">
            <div className="text-[11px] font-mono text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 py-1.5 px-3 text-[10px] md:text-xs font-bold bg-[#1d1d1d] hover:bg-[#252525] disabled:opacity-40 disabled:hover:bg-[#1d1d1d] disabled:cursor-not-allowed text-brand border border-brand/20 hover:border-brand/40 rounded-lg transition duration-150 shadow-sm"
              >
                <CheckCheck className="w-3.5 h-3.5 text-brand" />
                <span>Mark Read</span>
              </button>

              <button
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="flex items-center gap-1.5 py-1.5 px-3 text-[10px] md:text-xs font-bold bg-[#1d1d1d] hover:bg-red-500/10 disabled:opacity-40 disabled:hover:bg-[#1d1d1d] disabled:cursor-not-allowed text-red-400 border border-red-500/10 hover:border-red-500/30 rounded-lg transition duration-150 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* List Content Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 pb-4">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-white">No notifications</h3>
                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                    We'll keep you updated on tournament highlights and free bounties.
                  </p>
                </motion.div>
              ) : (
                notifications.map((notif) => {
                  const { icon, bgClass, textClass, badgeText } = getIconAndColors(notif.type, notif.isRead);

                  return (
                    <motion.div
                      key={notif.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layoutId={`notif-${notif.id}`}
                      onClick={() => !notif.isRead && onMarkRead(notif.id)}
                      className={`relative overflow-hidden p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                        notif.isRead 
                          ? 'bg-[#141414]/80 hover:bg-[#191919]/90 border-white/5' 
                          : 'bg-[#1b1c16]/95 hover:bg-[#21231b]/95 border-brand/20 shadow-[0_0_10px_rgba(219,253,78,0.02)]'
                      }`}
                    >
                      {/* Unread Indicator Vertical Bar */}
                      {!notif.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand" />
                      )}

                      <div className="flex gap-3 items-start">
                        {/* Circle Icon Badge */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${bgClass}`}>
                          {icon}
                        </div>

                        {/* Text description details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-black tracking-wider uppercase shrink-0 ${textClass}`}>
                              {badgeText}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                              • {notif.timestamp}
                            </span>
                          </div>

                          <h4 className={`text-xs font-bold leading-tight ${notif.isRead ? 'text-zinc-300' : 'text-white'}`}>
                            {notif.title}
                          </h4>
                          
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal break-words">
                            {notif.message}
                          </p>

                          {/* Claimable practice coins item UI */}
                          {notif.rewardAmount && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="bg-[#121212] border border-white/5 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-brand" />
                                <span className="text-[11px] font-mono font-black text-white">
                                  ₹{notif.rewardAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {notif.isClaimed ? (
                                <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 ml-1">
                                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                                  Claimed
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Avoid triggering item click read action
                                    onClaimReward(notif.id, notif.rewardAmount!);
                                  }}
                                  className="px-2.5 py-1 bg-brand hover:bg-[#cbe83d] active:scale-95 text-black font-black text-[10px] rounded-lg transition duration-150 flex items-center gap-1 shadow-sm"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Claim Bounty
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Delete Single Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering item click read action
                            onDelete(notif.id);
                          }}
                          className="p-1 text-zinc-600 hover:text-red-400 rounded transition shrink-0"
                          title="Remove notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
