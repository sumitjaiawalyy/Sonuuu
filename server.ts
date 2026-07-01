import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: any = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.log("Supabase credentials missing. Running in Memory/LocalStorage Fallback mode.");
}

// Memory-based fallback database stores for zero-downtime and local-mode experience
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UserMem {
  id: string;
  username: string;
  email: string;
  password?: string;
  balance: number;
  role: string;
  created_at: string;
}

interface BetMem {
  id: string;
  username: string;
  game_name: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  status: string;
  created_at: string;
}

interface DepositMem {
  id: string;
  username: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

interface WithdrawalMem {
  id: string;
  username: string;
  amount: number;
  status: string;
  payment_method: string;
  payout_details: string;
  created_at: string;
}

const memoryDb = {
  users: [] as UserMem[],
  bets: [] as BetMem[],
  deposits: [] as DepositMem[],
  withdrawals: [] as WithdrawalMem[]
};

// Seed initial memory data
memoryDb.users.push({
  id: "demo-admin",
  username: "admin",
  email: "admin@damrubet.com",
  password: "admin",
  balance: 10000.00,
  role: "admin",
  created_at: new Date().toISOString()
});

memoryDb.users.push({
  id: "demo-player",
  username: "Player_Damru",
  email: "player@damrubet.com",
  password: "password",
  balance: 1000.00,
  role: "player",
  created_at: new Date().toISOString()
});

memoryDb.bets.push(
  {
    id: "bet-1",
    username: "Player_Damru",
    game_name: "Limbo",
    bet_amount: 100,
    multiplier: 1.5,
    payout: 150,
    status: "won",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "bet-2",
    username: "Player_Damru",
    game_name: "Matka",
    bet_amount: 50,
    multiplier: 0,
    payout: 0,
    status: "lost",
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
);

memoryDb.deposits.push({
  id: "dep-1",
  username: "Player_Damru",
  amount: 1000,
  status: "approved",
  payment_method: "UPI (Google Pay)",
  transaction_id: "TXN1234567890",
  created_at: new Date(Date.now() - 86400000).toISOString()
});

memoryDb.withdrawals.push({
  id: "wd-1",
  username: "Player_Damru",
  amount: 200,
  status: "pending",
  payment_method: "Bank Transfer",
  payout_details: "A/C: 9876543210, IFSC: SBIN0001234",
  created_at: new Date().toISOString()
});

// Helper: Try Supabase, fallback to memory
async function queryUsers() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_users").select("*").order("created_at", { ascending: false });
      if (!error) return { data, source: "supabase" };
      console.warn("Supabase query error (possibly table doesn't exist yet):", error.message);
    } catch (e: any) {
      console.warn("Supabase exception:", e.message);
    }
  }
  return { data: memoryDb.users, source: "memory" };
}

async function queryUserByUsername(username: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_users").select("*").eq("username", username).single();
      if (!error && data) return { data, source: "supabase" };
    } catch (e) {}
  }
  const found = memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  return { data: found || null, source: "memory" };
}

async function queryUserByEmail(email: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_users").select("*").eq("email", email).single();
      if (!error && data) return { data, source: "supabase" };
    } catch (e) {}
  }
  const found = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return { data: found || null, source: "memory" };
}

async function insertUser(user: UserMem) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_users").insert([user]).select().single();
      if (!error) return { data, source: "supabase" };
      console.warn("Supabase user insert warning (possibly table damru_users needs to be created in your Supabase SQL editor):", error.message || error);
    } catch (e) {}
  }
  memoryDb.users.push(user);
  return { data: user, source: "memory" };
}

async function updateUserBalance(username: string, newBalance: number) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_users").update({ balance: newBalance }).eq("username", username).select().single();
      if (!error) return { data, source: "supabase" };
      console.warn("Supabase user update balance warning (possibly table damru_users needs to be created in your Supabase SQL editor):", error.message || error);
    } catch (e) {}
  }
  const idx = memoryDb.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    memoryDb.users[idx].balance = newBalance;
    return { data: memoryDb.users[idx], source: "memory" };
  }
  return { data: null, source: "memory" };
}

async function queryBets() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_bets").select("*").order("created_at", { ascending: false });
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  return { data: memoryDb.bets, source: "memory" };
}

async function queryBetsByUser(username: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_bets").select("*").eq("username", username).order("created_at", { ascending: false });
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  const filtered = memoryDb.bets.filter(b => b.username.toLowerCase() === username.toLowerCase());
  return { data: filtered, source: "memory" };
}

async function insertBet(bet: BetMem) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_bets").insert([bet]).select().single();
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  memoryDb.bets.unshift(bet);
  return { data: bet, source: "memory" };
}

async function queryDeposits() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_deposits").select("*").order("created_at", { ascending: false });
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  return { data: memoryDb.deposits, source: "memory" };
}

async function insertDeposit(deposit: DepositMem) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_deposits").insert([deposit]).select().single();
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  memoryDb.deposits.unshift(deposit);
  return { data: deposit, source: "memory" };
}

async function updateDepositStatusInDb(id: string, status: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_deposits").update({ status }).eq("id", id).select().single();
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  const idx = memoryDb.deposits.findIndex(d => d.id === id);
  if (idx !== -1) {
    memoryDb.deposits[idx].status = status;
    return { data: memoryDb.deposits[idx], source: "memory" };
  }
  return { data: null, source: "memory" };
}

async function queryWithdrawals() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_withdrawals").select("*").order("created_at", { ascending: false });
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  return { data: memoryDb.withdrawals, source: "memory" };
}

async function insertWithdrawal(withdrawal: WithdrawalMem) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_withdrawals").insert([withdrawal]).select().single();
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  memoryDb.withdrawals.unshift(withdrawal);
  return { data: withdrawal, source: "memory" };
}

async function updateWithdrawalStatusInDb(id: string, status: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("damru_withdrawals").update({ status }).eq("id", id).select().single();
      if (!error) return { data, source: "supabase" };
    } catch (e) {}
  }
  const idx = memoryDb.withdrawals.findIndex(w => w.id === id);
  if (idx !== -1) {
    memoryDb.withdrawals[idx].status = status;
    return { data: memoryDb.withdrawals[idx], source: "memory" };
  }
  return { data: null, source: "memory" };
}

// ---------------------- API ROUTES ----------------------

// Server Status & Database Health
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    supabaseConfigured: isSupabaseConfigured,
    supabaseConnected: isSupabaseConfigured && supabase !== null,
    hasCreds: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString()
  });
});

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  try {
    // Check email uniqueness
    const emailCheck = await queryUserByEmail(email);
    if (emailCheck.data) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Check username uniqueness
    const userCheck = await queryUserByUsername(username);
    if (userCheck.data) {
      return res.status(400).json({ error: "This username is already taken." });
    }

    // Insert user
    const newUser: UserMem = {
      id: generateUUID(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In this sandbox we keep standard readability for the admin dashboard as requested!
      balance: 1000.00,
      role: username.trim().toLowerCase() === "admin" ? "admin" : "player",
      created_at: new Date().toISOString()
    };

    const result = await insertUser(newUser);
    res.json({ success: true, user: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "Username/Email and Password are required." });
  }

  try {
    // Check as username
    let check = await queryUserByUsername(emailOrUsername);
    if (!check.data) {
      // Check as email
      check = await queryUserByEmail(emailOrUsername);
    }

    if (!check.data) {
      return res.status(400).json({ error: "Account not found! Please Join/Sign Up first." });
    }

    if (check.data.password !== password) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    res.json({ success: true, user: check.data, source: check.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Profile & Balance
app.get("/api/user/profile", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username parameter is required." });
  }

  try {
    const result = await queryUserByUsername(username as string);
    if (!result.data) {
      return res.status(404).json({ error: "User profile not found." });
    }
    res.json({ success: true, user: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Balance & Create Bet
app.post("/api/user/update-balance", async (req, res) => {
  const { username, amount, isBet, gameName, multiplier, payout, status } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  try {
    const userResult = await queryUserByUsername(username);
    if (!userResult.data) {
      return res.status(404).json({ error: "User not found." });
    }

    const currentBalance = Number(userResult.data.balance);
    const updatedBalance = parseFloat((currentBalance + Number(amount)).toFixed(2));

    const updatedUser = await updateUserBalance(username, updatedBalance);

    // If it's a bet, also record it in the bet history
    let recordedBet = null;
    if (isBet && gameName) {
      const newBet: BetMem = {
        id: generateUUID(),
        username,
        game_name: gameName,
        bet_amount: Math.abs(Number(amount)), // negative in update-balance represents bet placement
        multiplier: Number(multiplier || 0),
        payout: Number(payout || 0),
        status: status || (Number(payout) > 0 ? "won" : "lost"),
        created_at: new Date().toISOString()
      };
      const betResult = await insertBet(newBet);
      recordedBet = betResult.data;
    }

    res.json({
      success: true,
      balance: updatedBalance,
      user: updatedUser.data,
      bet: recordedBet,
      source: updatedUser.source
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deposit Request Creator
app.post("/api/transactions/deposit", async (req, res) => {
  const { username, amount, paymentMethod, transactionId } = req.body;
  if (!username || !amount) {
    return res.status(400).json({ error: "Username and amount are required." });
  }

  try {
    const newDeposit: DepositMem = {
      id: generateUUID(),
      username,
      amount: Number(amount),
      status: "pending",
      payment_method: paymentMethod || "UPI",
      transaction_id: transactionId || "",
      created_at: new Date().toISOString()
    };

    const result = await insertDeposit(newDeposit);
    res.json({ success: true, deposit: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Withdrawal Request Creator
app.post("/api/transactions/withdraw", async (req, res) => {
  const { username, amount, paymentMethod, payoutDetails } = req.body;
  if (!username || !amount) {
    return res.status(400).json({ error: "Username and amount are required." });
  }

  try {
    // Validate if user has enough balance
    const userResult = await queryUserByUsername(username);
    if (!userResult.data) {
      return res.status(404).json({ error: "User not found." });
    }

    if (Number(userResult.data.balance) < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance for withdrawal request." });
    }

    // Deduct balance instantly upon request placement
    const currentBalance = Number(userResult.data.balance);
    const nextBalance = parseFloat((currentBalance - Number(amount)).toFixed(2));
    await updateUserBalance(username, nextBalance);

    const newWithdrawal: WithdrawalMem = {
      id: generateUUID(),
      username,
      amount: Number(amount),
      status: "pending",
      payment_method: paymentMethod || "UPI",
      payout_details: payoutDetails || "",
      created_at: new Date().toISOString()
    };

    const result = await insertWithdrawal(newWithdrawal);
    res.json({ success: true, withdrawal: result.data, nextBalance, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------- ADMIN API ENDPOINTS ----------------------

// Fetch Dashboard Statistics
app.get("/api/admin/stats", async (req, res) => {
  try {
    const usersRes = await queryUsers();
    const betsRes = await queryBets();
    const depositsRes = await queryDeposits();
    const withdrawalsRes = await queryWithdrawals();

    const users = usersRes.data;
    const bets = betsRes.data;
    const deposits = depositsRes.data;
    const withdrawals = withdrawalsRes.data;

    const totalUsers = users.length;
    const totalVolume = bets.reduce((sum, b) => sum + Number(b.bet_amount), 0);
    const totalPayouts = bets.reduce((sum, b) => sum + Number(b.payout), 0);
    const grossRevenue = totalVolume - totalPayouts;

    const approvedDeposits = deposits.filter((d: any) => d.status === "approved").reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const pendingDeposits = deposits.filter((d: any) => d.status === "pending").length;
    const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending").length;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVolume,
        totalPayouts,
        grossRevenue,
        approvedDeposits,
        pendingDeposits,
        pendingWithdrawals,
        source: {
          users: usersRes.source,
          bets: betsRes.source,
          deposits: depositsRes.source,
          withdrawals: withdrawalsRes.source
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Users List
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await queryUsers();
    res.json({ success: true, users: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Bets List
app.get("/api/admin/bets", async (req, res) => {
  try {
    const result = await queryBets();
    res.json({ success: true, bets: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Deposits List
app.get("/api/admin/deposits", async (req, res) => {
  try {
    const result = await queryDeposits();
    res.json({ success: true, deposits: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Withdrawals List
app.get("/api/admin/withdrawals", async (req, res) => {
  try {
    const result = await queryWithdrawals();
    res.json({ success: true, withdrawals: result.data, source: result.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Deposit Status (Approve / Reject)
app.post("/api/admin/update-deposit-status", async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "Deposit ID and Status are required." });
  }

  try {
    const depResult = await updateDepositStatusInDb(id, status);
    if (!depResult.data) {
      return res.status(404).json({ error: "Deposit request not found." });
    }

    const deposit = depResult.data;

    // If approved, add the deposit amount to user's balance
    if (status === "approved") {
      const userResult = await queryUserByUsername(deposit.username);
      if (userResult.data) {
        const currentBalance = Number(userResult.data.balance);
        const nextBalance = parseFloat((currentBalance + Number(deposit.amount)).toFixed(2));
        await updateUserBalance(deposit.username, nextBalance);
      }
    }

    res.json({ success: true, deposit, source: depResult.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Withdrawal Status (Approve / Reject)
app.post("/api/admin/update-withdrawal-status", async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "Withdrawal ID and Status are required." });
  }

  try {
    const wdResult = await updateWithdrawalStatusInDb(id, status);
    if (!wdResult.data) {
      return res.status(404).json({ error: "Withdrawal request not found." });
    }

    const withdrawal = wdResult.data;

    // If rejected, refund the deducted amount back to user's balance
    if (status === "rejected") {
      const userResult = await queryUserByUsername(withdrawal.username);
      if (userResult.data) {
        const currentBalance = Number(userResult.data.balance);
        const nextBalance = parseFloat((currentBalance + Number(withdrawal.amount)).toFixed(2));
        await updateUserBalance(withdrawal.username, nextBalance);
      }
    }

    res.json({ success: true, withdrawal, source: wdResult.source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset or Seed Database
app.post("/api/admin/clear-all", (req, res) => {
  memoryDb.users = [
    {
      id: "demo-admin",
      username: "admin",
      email: "admin@damrubet.com",
      password: "admin",
      balance: 10000.00,
      role: "admin",
      created_at: new Date().toISOString()
    },
    {
      id: "demo-player",
      username: "Player_Damru",
      email: "player@damrubet.com",
      password: "password",
      balance: 1000.00,
      role: "player",
      created_at: new Date().toISOString()
    }
  ];
  memoryDb.bets = [];
  memoryDb.deposits = [];
  memoryDb.withdrawals = [];
  res.json({ success: true, message: "Sandbox memory cleared successfully." });
});

// ---------------------- VITE & STATIC FILES ----------------------

// Vite integration or static assets serving
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Start Server on Port 3000 inside the promise
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in development mode on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start Vite dev server:", err);
    // Fallback listening
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT} (Vite failed to load)`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Start Server on Port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in production mode on http://localhost:${PORT}`);
  });
}
