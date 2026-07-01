import React, { useState, useEffect } from 'react';
import { 
  fetchAdminStats, 
  fetchAdminUsers, 
  fetchAdminBets, 
  fetchAdminDeposits, 
  fetchAdminWithdrawals, 
  updateDepositStatus, 
  updateWithdrawalStatus, 
  updateBalanceBackend,
  clearAllAdminSandbox,
  getBackendStatus,
  UserProfile,
  BetHistoryItem,
  DepositRequest,
  WithdrawalRequest,
  AdminStats
} from '../lib/api';
import { 
  Users, TrendingUp, ArrowDownLeft, ArrowUpRight, ShieldCheck, 
  Database, RefreshCw, Check, X, Search, Coins, HelpCircle, 
  ShieldAlert, Copy, Trash2, Key, Calendar, Mail, FileText 
} from 'lucide-react';

interface AdminPanelProps {
  onSendAdminNotification: (title: string, message: string, type: 'promo' | 'win' | 'bonus' | 'security' | 'system') => void;
  onRefreshGlobalBalance?: () => void;
}

export default function AdminPanel({ onSendAdminNotification, onRefreshGlobalBalance }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bets, setBets] = useState<BetHistoryItem[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'users' | 'bets' | 'deposits' | 'withdrawals' | 'sql'>('users');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Edit user balance state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [isAdjustingLoading, setIsAdjustingLoading] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, betsData, depositsData, withdrawalsData, statusData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminBets(),
        fetchAdminDeposits(),
        fetchAdminWithdrawals(),
        getBackendStatus()
      ]);

      setStats(statsData);
      setUsers(usersData);
      setBets(betsData);
      setDeposits(depositsData);
      setWithdrawals(withdrawalsData);
      setDbStatus(statusData);
    } catch (error: any) {
      console.error("Admin Panel failed to load data:", error);
      showFeedback('error', 'Failed to load some data. Please check connection or reload.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Auto refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await updateDepositStatus(id, 'approved');
      if (res.success) {
        showFeedback('success', `Deposit approved! Wallet successfully credited.`);
        onSendAdminNotification(
          "💰 Practice Deposit Approved!",
          `Your recent deposit of ₹${res.deposit.amount} has been successfully verified and credited. Enjoy playing!`,
          "system"
        );
        loadData();
        if (onRefreshGlobalBalance) onRefreshGlobalBalance();
      }
    } catch (e: any) {
      showFeedback('error', e.message || 'Approval failed');
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      const res = await updateDepositStatus(id, 'rejected');
      if (res.success) {
        showFeedback('success', `Deposit declined.`);
        loadData();
      }
    } catch (e: any) {
      showFeedback('error', e.message || 'Action failed');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await updateWithdrawalStatus(id, 'approved');
      if (res.success) {
        showFeedback('success', `Withdrawal approved and dispatched.`);
        onSendAdminNotification(
          "💸 Practice Withdrawal Approved!",
          `Your withdrawal of ₹${res.withdrawal.amount} has been fully processed and disbursed in sandbox.`,
          "system"
        );
        loadData();
      }
    } catch (e: any) {
      showFeedback('error', e.message || 'Approval failed');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    try {
      const res = await updateWithdrawalStatus(id, 'rejected');
      if (res.success) {
        showFeedback('success', `Withdrawal declined. Deducted funds successfully refunded.`);
        onSendAdminNotification(
          "❌ Withdrawal Declined",
          `Your withdrawal request of ₹${res.withdrawal.amount} has been declined. Funds refunded back to wallet.`,
          "security"
        );
        loadData();
        if (onRefreshGlobalBalance) onRefreshGlobalBalance();
      }
    } catch (e: any) {
      showFeedback('error', e.message || 'Action failed');
    }
  };

  const handleAdjustBalanceSubmit = async (username: string) => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      showFeedback('error', 'Please enter a valid non-zero adjustment amount.');
      return;
    }

    setIsAdjustingLoading(true);
    try {
      const res = await updateBalanceBackend(username, amount);
      if (res.success) {
        showFeedback('success', `Adjusted balance of @${username} by ₹${amount.toFixed(2)}.`);
        onSendAdminNotification(
          "🛠️ Admin Wallet Adjustment",
          `Your sandbox balance was manually updated by ₹${amount.toFixed(2)} by an administrator.`,
          "bonus"
        );
        setEditingUserId(null);
        setAdjustAmount('');
        loadData();
        if (onRefreshGlobalBalance) onRefreshGlobalBalance();
      }
    } catch (e: any) {
      showFeedback('error', e.message || 'Adjustment failed');
    } finally {
      setIsAdjustingLoading(false);
    }
  };

  const handleClearAllMemory = async () => {
    if (window.confirm("CRITICAL RESET: Are you sure you want to purge all bets, deposits, withdrawals and reload default users? (In-memory only)")) {
      try {
        const res = await clearAllAdminSandbox();
        if (res.success) {
          showFeedback('success', 'Purged and reseeded memory stores successfully.');
          loadData();
          if (onRefreshGlobalBalance) onRefreshGlobalBalance();
        }
      } catch (e: any) {
        showFeedback('error', e.message || 'Clear failed');
      }
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBets = bets.filter(b => 
    b.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.game_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeposits = deposits.filter(d => 
    d.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter(w => 
    w.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.payout_details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SUPABASE_SQL_CODE = `-- 1. CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS damru_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 1000.00,
  role VARCHAR(50) DEFAULT 'player',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE BETS TABLE
CREATE TABLE IF NOT EXISTS damru_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  game_name VARCHAR(255) NOT NULL,
  bet_amount NUMERIC(15, 2) NOT NULL,
  multiplier NUMERIC(10, 2) NOT NULL,
  payout NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'won' or 'lost'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS damru_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_method VARCHAR(100) DEFAULT 'UPI',
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS damru_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_method VARCHAR(100) DEFAULT 'UPI',
  payout_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY (OPTIONAL - FOR PRODUCTION SAFETY)
-- For rapid setup, you can either disable RLS in your Supabase UI 
-- or enable public policies for anon clients:
ALTER TABLE damru_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select" ON damru_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON damru_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON damru_users FOR UPDATE USING (true);

ALTER TABLE damru_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select bets" ON damru_bets FOR SELECT USING (true);
CREATE POLICY "Allow public insert bets" ON damru_bets FOR INSERT WITH CHECK (true);

ALTER TABLE damru_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select dep" ON damru_deposits FOR SELECT USING (true);
CREATE POLICY "Allow public insert dep" ON damru_deposits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update dep" ON damru_deposits FOR UPDATE USING (true);

ALTER TABLE damru_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select wd" ON damru_withdrawals FOR SELECT USING (true);
CREATE POLICY "Allow public insert wd" ON damru_withdrawals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update wd" ON damru_withdrawals FOR UPDATE USING (true);`;

  return (
    <div id="admin-panel" className="bg-[#0c0c0e] border border-white/5 rounded-3xl p-5 md:p-8 space-y-8 select-none">
      
      {/* Admin Panel Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-wider">
                Damrubet Administrative Console
              </h1>
              <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-widest animate-pulse">
                LIVE ADMIN
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Audit profiles, verify payments, approve withdrawals, and audit real-time betting activities.
            </p>
          </div>
        </div>

        {/* Database Connectivity badge & Actions */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {dbStatus?.supabaseConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SUPABASE CONNECTED (CLOUD ACTIVE)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-bold text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>HYBRID MODE (MEMORY FALLBACK ACTIVE)</span>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-zinc-400 hover:text-white transition active:scale-95 disabled:opacity-50"
            title="Force refresh database arrays"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#14121a] border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Registered Members</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-mono font-black text-white">
              {stats?.totalUsers ?? users.length}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Data source: <span className="text-brand font-mono lowercase">{stats?.source?.users || 'direct'}</span>
            </div>
          </div>
        </div>

        {/* Total Bets volume */}
        <div className="bg-[#14121a] border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Total Bets Placed</span>
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-mono font-black text-white">
              ₹{(stats?.totalVolume ?? bets.reduce((s, b) => s + b.bet_amount, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Bets logged: <span className="text-indigo-400 font-mono font-bold">{bets.length} tickets</span>
            </div>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-[#14121a] border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Gross Yield Profits</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className={`text-2xl md:text-3xl font-mono font-black ${((stats?.grossRevenue ?? 1) >= 0) ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{(stats?.grossRevenue ?? (bets.reduce((s, b) => s + b.bet_amount, 0) - bets.reduce((s, b) => s + b.payout, 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              RTP Margin: <span className="text-emerald-400 font-mono">Provably Fair Ledger</span>
            </div>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="bg-[#14121a] border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Pending Requests</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-mono font-black text-white flex items-center gap-3">
              <span className="text-amber-400" title="Pending deposits">{deposits.filter(d => d.status === 'pending').length}💰</span>
              <span className="text-zinc-500">/</span>
              <span className="text-cyan-400" title="Pending withdrawals">{withdrawals.filter(w => w.status === 'pending').length}💸</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Unsettled gateway transactions requiring approval
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner popup */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs Row Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] p-1.5 rounded-2xl border border-white/5">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'users', label: 'User Details', count: users.length },
            { id: 'bets', label: 'Bets Ledger', count: bets.length },
            { id: 'deposits', label: 'Deposit Requests', count: deposits.filter(d => d.status === 'pending').length, alert: true },
            { id: 'withdrawals', label: 'Withdrawals Requests', count: withdrawals.filter(w => w.status === 'pending').length, alert: true },
            { id: 'sql', label: 'Supabase SQL Setup', icon: <Database className="w-3.5 h-3.5" /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchTerm('');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? 'bg-brand text-black font-black shadow-glow' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                    isActive 
                      ? 'bg-black text-brand' 
                      : tab.alert 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-white/10 text-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== 'sql' && (
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#17171a] border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-brand transition"
            />
          </div>
        )}

        {activeTab === 'sql' && (
          <button
            onClick={handleClearAllMemory}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Purge Memory Stores
          </button>
        )}
      </div>

      {/* Dynamic Tab Content Views */}
      <div className="bg-[#101012] border border-white/5 rounded-2xl overflow-hidden">
        
        {/* TAB 1: USER DETAILS */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#141416]/50 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                  <th className="p-4 pl-6">Username / Email</th>
                  <th className="p-4">UUID / Role</th>
                  <th className="p-4">Security Password</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs font-semibold">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-all text-xs font-semibold">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white text-sm">@{user.username}</div>
                        <div className="text-[10px] text-zinc-500 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-600" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-[9px] text-zinc-500 truncate max-w-[100px]" title={user.id}>
                          {user.id}
                        </div>
                        <span className={`inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded border mt-1 ${
                          user.role === 'admin' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-zinc-500/10 border-white/5 text-zinc-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-zinc-400 bg-white/[0.02] border border-white/5 px-2 py-1 rounded-lg w-max select-text" title="Verify User Password">
                          <Key className="w-3.5 h-3.5 text-zinc-600" />
                          <span>{user.password || '••••••••'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-brand font-black">
                        ₹{Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {editingUserId === user.id ? (
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              placeholder="+/- Amount"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              className="w-24 px-2 py-1 bg-[#1c1c1f] border border-brand/30 rounded text-xs font-mono font-bold text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleAdjustBalanceSubmit(user.username)}
                              disabled={isAdjustingLoading}
                              className="p-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded transition"
                              title="Confirm balance adjustment"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingUserId(null); setAdjustAmount(''); }}
                              className="p-1.5 bg-zinc-700 text-white hover:bg-zinc-600 rounded transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingUserId(user.id); setAdjustAmount(''); }}
                            className="px-3 py-1.5 bg-brand/10 hover:bg-brand text-brand hover:text-black font-extrabold rounded-lg border border-brand/20 transition-all text-[11px] uppercase tracking-wider"
                          >
                            Adjust Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: BETS LEDGER */}
        {activeTab === 'bets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#141416]/50 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                  <th className="p-4 pl-6">Ticket ID</th>
                  <th className="p-4">Player</th>
                  <th className="p-4">Game Section</th>
                  <th className="p-4 text-right">Bet Amount</th>
                  <th className="p-4 text-center">Multiplier</th>
                  <th className="p-4 text-right">Payout Credit</th>
                  <th className="p-4 text-center">Outcome</th>
                  <th className="p-4 pr-6 text-right">Settled Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs font-semibold">
                {filteredBets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs font-semibold">
                      No game tickets recorded in ledger yet. Place a bet on Matka Satta or originals to view!
                    </td>
                  </tr>
                ) : (
                  filteredBets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6 font-mono text-[9px] text-zinc-500">
                        {bet.id}
                      </td>
                      <td className="p-4 text-white font-bold">
                        @{bet.username}
                      </td>
                      <td className="p-4">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider">
                          {bet.game_name}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-zinc-300">
                        ₹{Number(bet.bet_amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-center font-mono font-black text-[#dbfd4e]">
                        {Number(bet.multiplier).toFixed(2)}x
                      </td>
                      <td className={`p-4 text-right font-mono font-black ${Number(bet.payout) > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        ₹{Number(bet.payout).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                          bet.status === 'won' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right text-zinc-500 font-mono text-[10px]">
                        {new Date(bet.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DEPOSIT REQUESTS */}
        {activeTab === 'deposits' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#141416]/50 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                  <th className="p-4 pl-6">Transaction Ref</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">UPI Reference / Trx ID</th>
                  <th className="p-4 text-right">Requested Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Requested Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs font-semibold">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs font-semibold">
                      No deposit request tickets on file.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6 font-mono text-[9px] text-zinc-500">
                        {dep.id}
                      </td>
                      <td className="p-4 text-white font-bold">
                        @{dep.username}
                      </td>
                      <td className="p-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-[10px] font-mono uppercase">
                          {dep.payment_method}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-400 select-all font-bold">
                        {dep.transaction_id || <span className="text-zinc-600 italic">No Ref</span>}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-brand font-black">
                        ₹{Number(dep.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                          dep.status === 'approved' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : dep.status === 'rejected'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-zinc-500 font-mono text-[10px]">
                        {new Date(dep.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {dep.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveDeposit(dep.id)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition"
                              title="Approve transaction and Credit Balance"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(dep.id)}
                              className="p-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition"
                              title="Decline deposit request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 uppercase font-bold">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#141416]/50 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                  <th className="p-4 pl-6">Transaction Ref</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Disbursement Method</th>
                  <th className="p-4">Payout Accounts Details</th>
                  <th className="p-4 text-right">Requested Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Requested Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs font-semibold">
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs font-semibold">
                      No withdrawal request tickets on file.
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6 font-mono text-[9px] text-zinc-500">
                        {wd.id}
                      </td>
                      <td className="p-4 text-white font-bold">
                        @{wd.username}
                      </td>
                      <td className="p-4">
                        <span className="bg-zinc-800 text-cyan-400 border border-zinc-700 px-2 py-1 rounded text-[10px] font-mono uppercase">
                          {wd.payment_method}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-400 select-all leading-relaxed max-w-xs truncate" title={wd.payout_details}>
                        {wd.payout_details || <span className="text-zinc-600 italic">No details</span>}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-red-400 font-black">
                        ₹{Number(wd.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                          wd.status === 'approved' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : wd.status === 'rejected'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {wd.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-zinc-500 font-mono text-[10px]">
                        {new Date(wd.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {wd.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(wd.id)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition"
                              title="Approve withdrawal and complete payout"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(wd.id)}
                              className="p-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition"
                              title="Decline request and refund balance back to user"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 uppercase font-bold">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: SUPABASE SQL CODES */}
        {activeTab === 'sql' && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3.5 bg-brand/5 border border-brand/20 p-4 rounded-xl">
              <Database className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-brand uppercase tracking-wider">How to connect to cloud Supabase PostgreSQL database?</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Damrubet features a <strong>dual-storage engine</strong> that works beautifully on in-memory arrays by default. To connect your actual live cloud Supabase database, simple complete these two steps:
                </p>
                <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-1.5 mt-2 pl-1">
                  <li>
                    Set your environment variables in the AI Studio Secrets panel:
                    <br />
                    <code className="text-zinc-200 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[11px] select-all">SUPABASE_URL=https://xxxx.supabase.co</code> and <code className="text-zinc-200 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[11px] select-all">SUPABASE_ANON_KEY=eyJxxx</code>
                  </li>
                  <li>
                    Open your Supabase Project dashboard, navigate to the <strong>SQL Editor</strong> tab on the left sidebar, click <strong>"New Query"</strong>, paste the SQL schema code block below, and click <strong>"Run"</strong>!
                  </li>
                </ol>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SQL Schema Migration Script (Seeding Database Tables)</span>
                <button
                  onClick={copySqlToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-black hover:bg-[#cbe83d] text-xs font-black rounded-lg transition-all active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'COPIED!' : 'COPY SQL CODE'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#09090b] border border-white/5 rounded-xl text-[11px] font-mono text-zinc-400 overflow-x-auto max-h-[350px] leading-relaxed select-text">
                {SUPABASE_SQL_CODE}
              </pre>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
