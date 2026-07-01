/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ArrowDownRight, ArrowUpRight, Gift, ShieldAlert, Sparkles, AlertCircle, CheckCircle2, Coins } from 'lucide-react';

interface WalletAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => boolean; // Returns true if successful
  onSendTip: (username: string, amount: number) => boolean; // Returns true if successful
  onSendAdminNotification: (title: string, message: string, type: 'promo' | 'win' | 'bonus' | 'security' | 'system') => void;
  initialTab?: 'deposit' | 'withdraw' | 'tip' | 'admin';
  prefilledUsername?: string;
}

export default function WalletAdminModal({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onWithdraw,
  onSendTip,
  onSendAdminNotification,
  initialTab = 'deposit',
  prefilledUsername = '',
}: WalletAdminModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'tip' | 'admin'>(initialTab);
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>('1000');
  
  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  
  // Tip state
  const [tipUsername, setTipUsername] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('100');
  
  // Admin state
  const [adminTitle, setAdminTitle] = useState<string>('');
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [adminType, setAdminType] = useState<'promo' | 'win' | 'bonus' | 'security' | 'system'>('system');
  
  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync initial state when modal opens or params change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFeedback(null);
      if (prefilledUsername) {
        setTipUsername(prefilledUsername);
      } else {
        setTipUsername('');
      }
    }
  }, [isOpen, initialTab, prefilledUsername]);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, message: msg });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showFeedback('error', 'Please enter a valid deposit amount.');
      return;
    }
    onDeposit(amount);
    showFeedback('success', `💰 Successfully deposited ₹${amount.toFixed(2)} practice funds!`);
    setDepositAmount('1000');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showFeedback('error', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (amount > balance) {
      showFeedback('error', `Insufficient balance. You only have ₹${balance.toFixed(2)}.`);
      return;
    }
    const success = onWithdraw(amount);
    if (success) {
      showFeedback('success', `💸 Withdrawal of ₹${amount.toFixed(2)} successfully processed!`);
      setWithdrawAmount('');
    } else {
      showFeedback('error', 'Withdrawal failed. Try again.');
    }
  };

  const handleTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(tipAmount);
    const username = tipUsername.trim().replace(/^@/, '');
    
    if (!username) {
      showFeedback('error', 'Please enter a recipient username.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showFeedback('error', 'Please enter a valid tip amount.');
      return;
    }
    if (amount > balance) {
      showFeedback('error', `Insufficient balance. You only have ₹${balance.toFixed(2)}.`);
      return;
    }
    
    const success = onSendTip(username, amount);
    if (success) {
      showFeedback('success', `🎁 Tipped ₹${amount.toFixed(2)} to player @${username}!`);
      setTipUsername('');
      setTipAmount('100');
    } else {
      showFeedback('error', 'Tipping failed. Try again.');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = adminTitle.trim();
    const message = adminMessage.trim();
    
    if (!title || !message) {
      showFeedback('error', 'Please fill in both Title and Message.');
      return;
    }
    
    onSendAdminNotification(title, message, adminType);
    showFeedback('success', '📢 Custom Admin Notification dispatched successfully!');
    setAdminTitle('');
    setAdminMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Main Dialog Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-lg bg-[#0e0c15] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(219,253,78,0.03)] flex flex-col z-10"
      >
        {/* Banner header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand via-amber-400 to-[#e04efd]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#14121c]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#dbfd4e]/10 border border-[#dbfd4e]/30 flex items-center justify-center text-brand">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white tracking-wide">
                Practice Cash & Admin Desk
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                Sandbox Wallet Balance: <span className="text-[#dbfd4e] font-black">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-zinc-400 hover:text-white transition active:scale-95"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Row */}
        <div className="flex border-b border-white/5 bg-[#0a090f] p-1 gap-1 shrink-0">
          {[
            { id: 'deposit', label: 'Deposit', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
            { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { id: 'tip', label: 'Tip Player', icon: <Gift className="w-3.5 h-3.5" /> },
            { id: 'admin', label: 'Admin Desk', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setFeedback(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#dbfd4e]/10 border border-[#dbfd4e]/20 text-[#dbfd4e] shadow-[0_0_12px_rgba(219,253,78,0.08)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Feedback Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`px-6 py-3 flex items-center gap-2.5 text-xs font-semibold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-b border-red-500/20 text-red-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Forms Body */}
        <div className="p-6 overflow-y-auto max-h-[380px] bg-[#0c0a11]/40 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'deposit' && (
              <motion.form
                key="deposit-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleDepositSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Deposit Practice Amount (₹)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="Enter deposit amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-sm font-semibold font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">INR</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {['500', '1000', '5000', '10000'].map((preset) => (
                    <button
                      key={`dep-${preset}`}
                      type="button"
                      onClick={() => setDepositAmount(preset)}
                      className="py-2 bg-[#171520] hover:bg-[#201d2c] border border-white/5 rounded-xl text-xs font-bold text-zinc-300 transition hover:text-white"
                    >
                      +₹{parseInt(preset).toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-[#dbfd4e]/5 border border-[#dbfd4e]/10 rounded-2xl flex items-start gap-2.5">
                  <Coins className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    This is a **Sandbox Practice Ledger**. Depositing will instantly increase your play balance. An official **Deposit Notification** is logged in your Notification Desk!
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#dbfd4e] hover:bg-[#cbe83d] text-black font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(219,253,78,0.2)] hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                  Deposit Practice Coins
                </button>
              </motion.form>
            )}

            {activeTab === 'withdraw' && (
              <motion.form
                key="withdraw-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleWithdrawSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Withdrawal Amount (₹)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-sm font-semibold font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">INR</span>
                  </div>
                </div>

                {/* Preset chips for Withdraw */}
                <div className="grid grid-cols-4 gap-2">
                  {['100', '500', '1000', '2500'].map((preset) => (
                    <button
                      key={`wd-${preset}`}
                      type="button"
                      onClick={() => setWithdrawAmount(preset)}
                      className="py-2 bg-[#171520] hover:bg-[#201d2c] border border-white/5 rounded-xl text-xs font-bold text-zinc-300 transition hover:text-white"
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Withdrawal system is fully automatic and instant in sandbox practice mode. Withdrawing will subtract coins from your practice balance and trigger a **Withdrawal Notification**.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-zinc-100 hover:bg-white text-black font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                  Withdraw Practice Coins
                </button>
              </motion.form>
            )}

            {activeTab === 'tip' && (
              <motion.form
                key="tip-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleTipSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recipient Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs select-none">@</span>
                      <input
                        type="text"
                        required
                        placeholder="Player_Name"
                        value={tipUsername}
                        onChange={(e) => setTipUsername(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tip Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Tip amount"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-xs font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#dbfd4e]/5 border border-[#dbfd4e]/10 rounded-2xl flex items-start gap-2.5">
                  <Gift className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Tipping players in Chat helps them play when they are low on credits. Tipping will deduct coins from your balance and issue a customized **Tip Sent Notification**.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand text-black hover:bg-[#cbe83d] font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                  Send Tip
                </button>
              </motion.form>
            )}

            {activeTab === 'admin' && (
              <motion.form
                key="admin-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleAdminSubmit}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notification Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 📢 Official Matka Tournament"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Type</label>
                      <select
                        value={adminType}
                        onChange={(e) => setAdminType(e.target.value as any)}
                        className="w-full px-3 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-brand transition"
                      >
                        <option value="system">🛠️ System</option>
                        <option value="bonus">🎁 Bonus</option>
                        <option value="win">🏆 Big Win</option>
                        <option value="promo">🔥 Offer</option>
                        <option value="security">🛡️ Security</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Message Content</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Compose a custom message to dispatch to the Notification Center..."
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-[#13111b] border border-white/10 rounded-2xl text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-brand transition resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:brightness-110 font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(245,158,11,0.2)] hover:scale-[1.01] active:scale-[0.99] mt-2"
                >
                  Dispatch Admin Notification
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
