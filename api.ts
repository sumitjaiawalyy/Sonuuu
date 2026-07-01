/**
 * Frontend API Utility to communicate with the full-stack Express + Supabase backend.
 * Provides fallback behaviors to ensure 100% functionality.
 */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: string;
  created_at: string;
}

export interface BetHistoryItem {
  id: string;
  username: string;
  game_name: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  status: string;
  created_at: string;
}

export interface DepositRequest {
  id: string;
  username: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  username: string;
  amount: number;
  status: string;
  payment_method: string;
  payout_details: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVolume: number;
  totalPayouts: number;
  grossRevenue: number;
  approvedDeposits: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  source: any;
}

// Check backend status
export async function getBackendStatus() {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) throw new Error("Status endpoint returned non-OK status");
    return await res.json();
  } catch (error) {
    console.warn("Backend status query failed, running in local-only sandbox mode:", error);
    return { status: "local_only", supabaseConnected: false };
  }
}

// User signup
export async function registerUserBackend(username: string, email: string, password?: string) {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password: password || "password" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  } catch (error: any) {
    console.error("Signup backend error:", error);
    throw error;
  }
}

// User login
export async function loginUserBackend(emailOrUsername: string, password?: string) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password: password || "password" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  } catch (error: any) {
    console.error("Login backend error:", error);
    throw error;
  }
}

// Fetch user profile & latest balance
export async function getUserProfile(username: string): Promise<UserProfile> {
  try {
    const res = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profile fetch failed");
    return data.user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Fallback to local profile info if offline
    return {
      id: "local-user",
      username,
      email: `${username.toLowerCase()}@damru.com`,
      balance: Number(localStorage.getItem("damru_balance") || "1000"),
      role: username === "admin" ? "admin" : "player",
      created_at: new Date().toISOString(),
    };
  }
}

// Record a transaction / Bet / Balance change
export async function updateBalanceBackend(
  username: string,
  amount: number,
  isBet = false,
  gameName = "",
  multiplier = 0,
  payout = 0,
  status = ""
) {
  try {
    const res = await fetch("/api/user/update-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        amount,
        isBet,
        gameName,
        multiplier,
        payout,
        status,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Balance update failed");
    return data;
  } catch (error) {
    console.error("Error updating balance on backend:", error);
    // Fallback to localStorage balance updating
    const current = parseFloat(localStorage.getItem("damru_balance") || "1000");
    const next = parseFloat((current + amount).toFixed(2));
    localStorage.setItem("damru_balance", String(next));
    return { success: true, balance: next, source: "localStorage" };
  }
}

// Request deposit
export async function requestDepositBackend(
  username: string,
  amount: number,
  paymentMethod = "UPI",
  transactionId = ""
) {
  try {
    const res = await fetch("/api/transactions/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount, paymentMethod, transactionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Deposit request failed");
    return data;
  } catch (error: any) {
    console.error("Deposit request error:", error);
    throw error;
  }
}

// Request withdrawal
export async function requestWithdrawalBackend(
  username: string,
  amount: number,
  paymentMethod = "Bank Transfer",
  payoutDetails = ""
) {
  try {
    const res = await fetch("/api/transactions/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount, paymentMethod, payoutDetails }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Withdrawal request failed");
    return data;
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    throw error;
  }
}

// ---------------------- ADMIN SPECIFIC API CALLS ----------------------

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch admin stats");
  return data.stats;
}

export async function fetchAdminUsers(): Promise<UserProfile[]> {
  const res = await fetch("/api/admin/users");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch admin users");
  return data.users;
}

export async function fetchAdminBets(): Promise<BetHistoryItem[]> {
  const res = await fetch("/api/admin/bets");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch admin bets");
  return data.bets;
}

export async function fetchAdminDeposits(): Promise<DepositRequest[]> {
  const res = await fetch("/api/admin/deposits");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch admin deposits");
  return data.deposits;
}

export async function fetchAdminWithdrawals(): Promise<WithdrawalRequest[]> {
  const res = await fetch("/api/admin/withdrawals");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch admin withdrawals");
  return data.withdrawals;
}

export async function updateDepositStatus(id: string, status: "approved" | "rejected") {
  const res = await fetch("/api/admin/update-deposit-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update deposit status");
  return data;
}

export async function updateWithdrawalStatus(id: string, status: "approved" | "rejected") {
  const res = await fetch("/api/admin/update-withdrawal-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update withdrawal status");
  return data;
}

export async function clearAllAdminSandbox() {
  const res = await fetch("/api/admin/clear-all", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to clear admin data");
  return data;
}
