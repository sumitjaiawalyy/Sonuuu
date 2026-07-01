import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Volume2, VolumeX, Settings, RefreshCw, 
  HelpCircle, AlertTriangle, Play, Square, 
  BarChart2, Shield, Info, Copy, Coins 
} from 'lucide-react';

interface CoinFlipProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onClose?: () => void;
}

interface BetHistoryItem {
  id: string;
  multiplier: number;
  win: boolean;
  betAmount: number;
  chosenSide: 'heads' | 'tails';
  actualSide: 'heads' | 'tails';
  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  timestamp: string;
  username: string;
}

function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const maxWord = Math.pow(2, 32);
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii.length * 8;
  
  let value;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = function(n: number) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
      }
      k[primeCounter] = (Math.pow(candidate, 1/3) * maxWord) | 0;
      primeCounter++;
    }
  }
  
  let asciiString = ascii + '\x80';
  while (asciiString.length % 64 - 56) asciiString += '\x00';
  
  for (i = 0; i < asciiString.length; i++) {
    value = asciiString.charCodeAt(i);
    words[i >> 2] |= value << ((3 - i % 4) * 8);
  }
  words[words.length] = ((asciiLength / maxWord) | 0);
  words[words.length] = (asciiLength | 0);
  
  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] || 0)) | 0;
      const t2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + t1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (t1 + t2) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

// Provably Fair generator for Coin Flip
function calculateCoinResultSync(srvSeed: string, cliSeed: string, nce: number): 'heads' | 'tails' {
  const combined = `${srvSeed}-${cliSeed}-${nce}`;
  const hash = sha256Sync(combined);
  const val = parseInt(hash.substring(0, 8), 16);
  const rand = val / 4294967295;
  return rand < 0.5 ? 'heads' : 'tails';
}

const TetherIcon = ({ size = "normal" }: { size?: 'normal' | 'small' }) => {
  const sizeClasses = size === 'small' 
    ? "w-3.5 h-3.5 text-[8px]" 
    : "w-5 h-5 text-[10px]";
  return (
    <span className={`flex items-center justify-center bg-[#26a17b] rounded-full text-white font-black leading-none font-sans select-none shadow-sm shadow-[#26a17b]/30 shrink-0 ${sizeClasses}`}>
      ₮
    </span>
  );
};

export default function CoinFlip({
  balance,
  onUpdateBalance,
  isLoggedIn,
  onOpenAuth,
  onClose,
}: CoinFlipProps) {
  // Navigation Tabs: 'play' | 'fairness' | 'stats'
  const [activeTab, setActiveTab] = useState<'play' | 'fairness' | 'stats'>('play');

  // Audio Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Notifications logic (Compact toast style)
  const [notifications, setNotifications] = useState<{ id: string; msg: string; type: 'success' | 'warning' | 'info' }[]>([]);
  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, msg: message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // Standard interactive states
  const [betAmountInput, setBetAmountInput] = useState<string>("0.00");
  const [chosenSide, setChosenSide] = useState<'heads' | 'tails'>('heads');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [betMode, setBetMode] = useState<'manual' | 'auto'>('manual');

  // Animation visual states
  const [visualCoinFace, setVisualCoinFace] = useState<'heads' | 'tails'>('heads');
  const [visualResult, setVisualResult] = useState<'heads' | 'tails' | null>(null);
  const [winStatus, setWinStatus] = useState<boolean | null>(null);

  // Provably Fair States
  const [clientSeed, setClientSeed] = useState<string>("coinflip_client_seed_e471fa28");
  const [serverSeed, setServerSeed] = useState<string>("9fb2f3a8b438fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71ca4");
  const [serverSeedHash, setServerSeedHash] = useState<string>("");
  const [nextServerSeed, setNextServerSeed] = useState<string>("a40d58810943ebde82c0b561c28b26125a00ffdbecab32cb71cf78ef1c0e");
  const [nextServerSeedHash, setNextServerSeedHash] = useState<string>("");

  const [previousServerSeed, setPreviousServerSeed] = useState<string>("");
  const [previousServerSeedHash, setPreviousServerSeedHash] = useState<string>("");
  const [previousClientSeed, setPreviousClientSeed] = useState<string>("");

  const [totalBetsWithSeedPair, setTotalBetsWithSeedPair] = useState<number>(0);
  const nonceRef = useRef<number>(0);

  // Auto Bet State Configurations
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [autoBetsCount, setAutoBetsCount] = useState<string>('0'); // 0 = infinite
  const [remainingAutoBets, setRemainingAutoBets] = useState<number>(0);
  const [stopOnProfit, setStopOnProfit] = useState<string>('');
  const [stopOnLoss, setStopOnLoss] = useState<string>('');
  const [onWinAction, setOnWinAction] = useState<{ action: 'reset' | 'increase'; value: number }>({ action: 'reset', value: 100 });
  const [onLossAction, setOnLossAction] = useState<{ action: 'reset' | 'increase'; value: number }>({ action: 'reset', value: 100 });

  // Performance tracking states
  const startBalanceRef = useRef<number>(balance);
  const autoRunTimerRef = useRef<any>(null);

  // Statistics
  const [liveStats, setLiveStats] = useState<{
    wagered: number;
    profit: number;
    wins: number;
    losses: number;
  }>({ wagered: 0, profit: 0, wins: 0, losses: 0 });

  // History Log
  const [history, setHistory] = useState<BetHistoryItem[]>([
    {
      id: 'h1',
      multiplier: 1.98,
      win: true,
      betAmount: 10,
      chosenSide: 'heads',
      actualSide: 'heads',
      clientSeed: 'coinflip_client_seed_e471fa28',
      serverSeed: '9fb2f3a8b438fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71ca4',
      serverSeedHash: '8a9c8f9024b895a12cdbf8e0dc6123a4921471ab870cdaef93e107df038234ea',
      nonce: 1,
      timestamp: '2026-06-30 08:00:00',
      username: 'Player_Damru'
    }
  ]);
  const [selectedBet, setSelectedBet] = useState<BetHistoryItem | null>(null);
  const [isBetDetailsModalOpen, setIsBetDetailsModalOpen] = useState<boolean>(false);

  // Settings dropdown popover
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newClientSeedInput, setNewClientSeedInput] = useState<string>("");

  // Verification Tool Panel States
  const [verifyServerSeed, setVerifyServerSeed] = useState<string>("");
  const [verifyClientSeed, setVerifyClientSeed] = useState<string>("");
  const [verifyNonce, setVerifyNonce] = useState<string>("0");
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Sound generator
  const playSound = (type: 'win' | 'lose' | 'tick' | 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      let ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
      }
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        const baseFreq = 420 + Math.random() * 50;
        osc.frequency.setValueAtTime(baseFreq * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.015);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(1, now);
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        
        osc.start(now);
        osc.stop(now + 0.016);
      } else if (type === 'click') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(1000, now);
        osc1.frequency.exponentialRampToValueAtTime(300, now + 0.012);
        
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.008);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.016);
        osc2.stop(now + 0.016);
      } else if (type === 'win') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        osc2.frequency.setValueAtTime(261.63, now); // C4
        osc2.frequency.setValueAtTime(329.63, now + 0.08);
        osc2.frequency.setValueAtTime(392.00, now + 0.16);
        osc2.frequency.setValueAtTime(523.25, now + 0.24);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.3, now + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.55);
        osc2.stop(now + 0.55);
      } else if (type === 'lose') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context init failed:", e);
    }
  };

  // Initialize server seed hash on mount
  useEffect(() => {
    setServerSeedHash(sha256Sync(serverSeed));
    setNextServerSeedHash(sha256Sync(nextServerSeed));
  }, [serverSeed, nextServerSeed]);

  // Handle Copy utility
  const copyToClipboard = (text: string, label: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
    // Don't show notifications for copy of server/client seeds or hashes as per user requests in Limbo
    if (!label.toLowerCase().includes("seed") && !label.toLowerCase().includes("hash")) {
      addNotification(`${label} copied to clipboard!`, "success");
    }
  };

  // Rotate Seed Pair
  const rotateSeedPair = () => {
    playSound('click');
    setPreviousServerSeed(serverSeed);
    setPreviousServerSeedHash(serverSeedHash);
    setPreviousClientSeed(clientSeed);

    const newSrv = generateRandomHex(64);
    const nextSrv = generateRandomHex(64);

    setServerSeed(newSrv);
    setServerSeedHash(sha256Sync(newSrv));
    setNextServerSeed(nextSrv);
    setNextServerSeedHash(sha256Sync(nextSrv));

    setTotalBetsWithSeedPair(0);
    nonceRef.current = 0;
  };

  // Edit Client Seed
  const changeClientSeed = () => {
    playSound('click');
    if (!newClientSeedInput.trim()) {
      addNotification("Please enter a valid client seed", "warning");
      return;
    }
    setClientSeed(newClientSeedInput.trim());
    setNewClientSeedInput("");
  };

  // Verification Logic
  const handleVerify = () => {
    if (!verifyServerSeed.trim()) {
      setVerifyError("Please enter a Server Seed to verify");
      setCalculatedResult(null);
      return;
    }
    if (!verifyClientSeed.trim()) {
      setVerifyError("Please enter a Client Seed to verify");
      setCalculatedResult(null);
      return;
    }
    setVerifyError(null);
    const nonceVal = parseInt(verifyNonce) || 0;
    const outcome = calculateCoinResultSync(verifyServerSeed.trim(), verifyClientSeed.trim(), nonceVal);
    setCalculatedResult(outcome.toUpperCase());
  };

  // Primary bet execution
  const executeBet = useCallback(() => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }

    const betAmount = parseFloat(betAmountInput);
    if (isNaN(betAmount) || betAmount < 0) {
      addNotification("Bet amount cannot be negative", "warning");
      setIsAutoRunning(false);
      return;
    }

    if (balance < betAmount) {
      addNotification("Insufficient balance!", "warning");
      setIsAutoRunning(false);
      return;
    }

    // Lock interaction
    setIsPlaying(true);
    playSound('click');

    // Deduct bet amount
    onUpdateBalance(-betAmount);

    // Increase Nonce
    nonceRef.current += 1;
    setTotalBetsWithSeedPair((prev) => prev + 1);

    // Determine deterministic cryptographic outcome
    const outcomeSide = calculateCoinResultSync(serverSeed, clientSeed, nonceRef.current);
    const isWin = outcomeSide === chosenSide;
    const multiplier = isWin ? 1.98 : 0;
    const payout = betAmount * multiplier;

    // Trigger spinning visual sequence
    setVisualResult(null);
    setWinStatus(null);

    // Dynamic ticking sound simulated by frame updates during rotation
    let spinCount = 0;
    const tickInterval = setInterval(() => {
      setVisualCoinFace((prev) => (prev === 'heads' ? 'tails' : 'heads'));
      playSound('tick');
      spinCount++;
      if (spinCount > 10) clearInterval(tickInterval);
    }, 90);

    // Complete animation timing (approx 1.2s)
    setTimeout(() => {
      clearInterval(tickInterval);
      setVisualCoinFace(outcomeSide);
      setVisualResult(outcomeSide);
      setWinStatus(isWin);
      setIsPlaying(false);

      // Payout award
      if (payout > 0) {
        onUpdateBalance(payout);
        playSound('win');
      } else {
        playSound('lose');
      }

      // Record to history
      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

      const historyItem: BetHistoryItem = {
        id: `coin-${Date.now()}`,
        multiplier,
        win: isWin,
        betAmount,
        chosenSide,
        actualSide: outcomeSide,
        clientSeed,
        serverSeed,
        serverSeedHash,
        nonce: nonceRef.current,
        timestamp: formattedDate,
        username: 'Player_Damru',
      };

      setHistory((prev) => [historyItem, ...prev]);

      // Update statistics
      setLiveStats((prev) => ({
        wagered: parseFloat((prev.wagered + betAmount).toFixed(2)),
        profit: parseFloat((prev.profit + (payout - betAmount)).toFixed(2)),
        wins: prev.wins + (isWin ? 1 : 0),
        losses: prev.losses + (isWin ? 0 : 1),
      }));

    }, 1200);

  }, [
    isLoggedIn, betAmountInput, balance, chosenSide, serverSeed, clientSeed,
    serverSeedHash, onUpdateBalance, onOpenAuth, addNotification
  ]);

  // Double / Half Bet Actions
  const handleHalfBet = () => {
    playSound('click');
    setBetAmountInput((prev) => {
      const val = parseFloat(prev) || 0;
      return Math.max(0, parseFloat((val / 2).toFixed(2))).toString();
    });
  };

  const handleDoubleBet = () => {
    playSound('click');
    setBetAmountInput((prev) => {
      const val = parseFloat(prev) || 0;
      return parseFloat((val * 2).toFixed(2)).toString();
    });
  };

  const handleMaxBet = () => {
    playSound('click');
    setBetAmountInput(Math.min(balance, 100000).toFixed(2));
  };

  const handleMinBet = () => {
    playSound('click');
    setBetAmountInput("0.00");
  };

  // Stop Autobet cleanly
  const stopAutoBets = useCallback(() => {
    setIsAutoRunning(false);
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }
    addNotification("Auto Bet Stopped", "info");
  }, [addNotification]);

  // Start Autobet logic
  const startAutoBets = () => {
    playSound('click');
    const bAmt = parseFloat(betAmountInput);
    if (isNaN(bAmt) || bAmt < 0) {
      addNotification("Bet amount cannot be negative", "warning");
      return;
    }
    if (balance < bAmt) {
      addNotification("Insufficient balance!", "warning");
      return;
    }

    const parsedCount = parseInt(autoBetsCount) || 0;
    setRemainingAutoBets(parsedCount === 0 ? -1 : parsedCount);
    setIsAutoRunning(true);
    startBalanceRef.current = balance;
    addNotification("Auto Bet Started", "info");
  };

  // Auto Bet Loop Hook
  useEffect(() => {
    if (!isAutoRunning || isPlaying) return;

    // Check stop criteria if Advanced is toggled on
    if (showAdvanced) {
      const currentProfit = balance - startBalanceRef.current;
      if (stopOnProfit && parseFloat(stopOnProfit) > 0 && currentProfit >= parseFloat(stopOnProfit)) {
        addNotification(`Auto Bet target profit reached! (+${currentProfit.toFixed(2)})`, "success");
        stopAutoBets();
        return;
      }
      if (stopOnLoss && parseFloat(stopOnLoss) > 0 && currentProfit <= -parseFloat(stopOnLoss)) {
        addNotification(`Auto Bet stop loss reached! (-${Math.abs(currentProfit).toFixed(2)})`, "warning");
        stopAutoBets();
        return;
      }
    }

    // Check remaining bets
    if (remainingAutoBets === 0) {
      addNotification("Auto Bet sequence finished!", "success");
      stopAutoBets();
      return;
    }

    // Delay next bet slightly for visual realism
    autoRunTimerRef.current = setTimeout(() => {
      // Handle multiplier strategies on Win/Loss of last history item if it exists
      if (history.length > 0) {
        const lastBet = history[0];
        let nextBet = parseFloat(betAmountInput);
        
        if (lastBet.win) {
          if (onWinAction.action === 'increase') {
            const pct = onWinAction.value || 0;
            nextBet = nextBet * (1 + pct / 100);
          } else {
            // reset or do nothing
          }
        } else {
          if (onLossAction.action === 'increase') {
            const pct = onLossAction.value || 0;
            nextBet = nextBet * (1 + pct / 100);
          } else {
            // reset or do nothing
          }
        }
        
        const boundedBet = Math.max(0, parseFloat(nextBet.toFixed(2)));
        setBetAmountInput(boundedBet.toString());
      }

      // Execute bet
      executeBet();

      // Decrement counts if not infinite
      if (remainingAutoBets > 0) {
        setRemainingAutoBets((prev) => prev - 1);
      }
    }, 500);

    return () => {
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, [
    isAutoRunning, isPlaying, remainingAutoBets, balance, stopOnProfit,
    stopOnLoss, executeBet, history, onWinAction, showAdvanced,
    onLossAction, betAmountInput, stopAutoBets, addNotification
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full min-h-full flex flex-col gap-2 md:gap-2.5 select-none bg-bg-dark text-white p-1 justify-start relative">
      
      {/* 1. History pills (Horizontal Bar on Top) */}
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 px-2 md:px-4 h-9 select-none">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-none py-0.5">
            <AnimatePresence mode="popLayout">
              {history.slice(0, 7).map((item) => (
                <motion.span
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.7, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  onClick={() => {
                    setSelectedBet(item);
                    setIsBetDetailsModalOpen(true);
                    playSound('click');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-display font-black shrink-0 shadow-sm transition-all duration-150 cursor-pointer select-none hover:scale-105 active:scale-95 ${
                    item.win 
                      ? 'bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 text-amber-400' 
                      : 'bg-[#222]/80 hover:bg-[#333]/80 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                  title="Click to view complete bet verification & details"
                >
                  {item.actualSide.toUpperCase()}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 bg-[#171717] hover:bg-white/5 rounded-md border border-white/5 hover:border-white/10 text-[#bdbdbd] hover:text-white transition flex items-center justify-center shrink-0 w-7 h-7"
            title={soundEnabled ? "Mute Sound" : "Unmute Sound"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4.5 h-4.5" />
            ) : (
              <VolumeX className="w-4.5 h-4.5 text-rose-400" />
            )}
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 bg-[#171717] hover:bg-white/5 rounded-md border border-white/5 hover:border-white/10 text-[#bdbdbd] hover:text-white transition flex items-center justify-center shrink-0 w-7 h-7"
              title="Close Game"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Screen layout depending on Active Tab */}
      {activeTab === 'play' && (
        <>
          {/* 2. Visual Coin Flip Stage / Arena */}
          <div className="relative w-full aspect-[3.2/1] sm:aspect-[3.6/1] min-h-[140px] bg-[#0c0e12] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center p-4 shadow-xl">
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:20px_20px] pointer-events-none" />
            
            {/* Decorative ambient ring glow */}
            <div className={`absolute w-40 h-40 rounded-full blur-[45px] opacity-15 transition-colors duration-500 pointer-events-none ${
              isPlaying 
                ? 'bg-amber-400 shadow-glow animate-pulse' 
                : winStatus === true 
                  ? 'bg-emerald-400' 
                  : winStatus === false 
                    ? 'bg-rose-500' 
                    : 'bg-white/10'
            }`} />

            {/* Visual Coin Animation wrapper */}
            <div className="relative flex flex-col items-center justify-center gap-2">
              <motion.div
                animate={isPlaying ? {
                  rotateY: [0, 1800],
                  y: [0, -70, 0],
                  scale: [1, 1.15, 1],
                } : {
                  rotateY: visualCoinFace === 'heads' ? 0 : 180,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: isPlaying ? 1.2 : 0.3,
                  ease: isPlaying ? "easeInOut" : "easeOut"
                }}
                className="w-20 h-20 rounded-full cursor-pointer relative preserve-3d"
                onClick={() => !isPlaying && executeBet()}
              >
                {/* HEADS side of the coin */}
                <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border-[3.5px] border-amber-200 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] backface-hidden z-20">
                  <div className="w-14 h-14 rounded-full border border-amber-200/40 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-black text-amber-950 font-sans tracking-tight uppercase">HEADS</span>
                  </div>
                </div>

                {/* TAILS side of the coin */}
                <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-gray-300 via-slate-400 to-slate-600 border-[3.5px] border-slate-200 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(148,163,184,0.3)] rotate-y-180 backface-hidden z-10">
                  <div className="w-14 h-14 rounded-full border border-slate-200/40 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-black text-slate-950 font-sans tracking-tight uppercase">TAILS</span>
                  </div>
                </div>
              </motion.div>

              {/* Status Outcome Text */}
              <div className="min-h-[28px] mt-1 flex flex-col items-center">
                {visualResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className={`text-base font-display font-black uppercase tracking-widest ${
                      winStatus ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]' : 'text-rose-500'
                    }`}>
                      {visualResult} {winStatus ? '(WIN!)' : '(LOST)'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Multiplier: {winStatus ? '1.98x' : '0.00x'}
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider select-none">
                    {isPlaying ? "Flipping..." : "Choose Side & Flip Coin!"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Betting Panel Controls */}
          <div className="bg-[#141416]/40 border border-white/5 rounded-xl p-3 md:p-4 space-y-4">
            
            {/* Betting Side Option Selectors */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Guess Side</label>
              <div className="grid grid-cols-2 gap-2 bg-[#141414] p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  disabled={isPlaying || isAutoRunning}
                  onClick={() => { setChosenSide('heads'); playSound('click'); }}
                  className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-2 ${
                    chosenSide === 'heads'
                      ? 'bg-gradient-to-br from-amber-400/25 to-amber-600/10 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'bg-transparent border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">H</span>
                  <span>Heads (1.98x)</span>
                </button>
                <button
                  type="button"
                  disabled={isPlaying || isAutoRunning}
                  onClick={() => { setChosenSide('tails'); playSound('click'); }}
                  className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-2 ${
                    chosenSide === 'tails'
                      ? 'bg-gradient-to-br from-slate-400/25 to-slate-600/10 border border-slate-400/40 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)]'
                      : 'bg-transparent border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-400/10 border border-slate-400/30 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">T</span>
                  <span>Tails (1.98x)</span>
                </button>
              </div>
            </div>

            {/* 4. Betting controls section (Bet amount and Profit values / Number of Bets / Advanced) */}
            <div className="bg-[#141414] p-1.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
              {betMode === 'manual' ? (
                <div className="flex flex-col gap-1.5 w-full">
                  {/* Bet Amount */}
                  <div className="flex flex-col gap-0.5 text-left w-full">
                    <div className="flex items-center justify-between h-4">
                      <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Bet Amount</label>
                      <div className="text-[9.5px] text-gray-500 flex items-center gap-0.5 font-bold">
                        <span>Bal:</span>
                        <span className="text-white font-display">${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className={`flex items-center h-10 bg-[#1c1c1c] rounded-lg border overflow-hidden focus-within:border-brand/30 transition-all px-1 ${
                      parseFloat(betAmountInput) > balance 
                        ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80' 
                        : parseFloat(betAmountInput) < 0
                        ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80'
                        : 'border-white/5'
                    }`}>
                      <input
                        type="number"
                        step="0.01"
                        min="0.00"
                        disabled={isPlaying}
                        value={betAmountInput}
                        onChange={(e) => setBetAmountInput(e.target.value)}
                        className="flex-1 bg-transparent text-[13.5px] font-display font-bold text-white focus:outline-none h-full pl-1.5 min-w-0"
                      />
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isPlaying}
                          onClick={handleHalfBet}
                          className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center text-gray-300 hover:text-white"
                        >
                          ½
                        </button>
                        <button
                          type="button"
                          disabled={isPlaying}
                          onClick={handleDoubleBet}
                          className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center text-gray-300 hover:text-white animate-none"
                        >
                          2×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profit On Win (Manual) */}
                  <div className="flex flex-col gap-0.5 text-left w-full">
                    <div className="flex items-center h-4">
                      <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400 block">Profit on Win</label>
                    </div>
                    <div className="flex items-center h-10 bg-[#1c1c1c]/85 rounded-lg border border-white/5 overflow-hidden px-2.5">
                      <span className="flex-1 text-[13.5px] font-display font-bold text-brand truncate">
                        ${(parseFloat(betAmountInput) > 0 ? parseFloat(betAmountInput) * 0.98 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Auto Mode Input controls stack */
                <div className="flex flex-col gap-1.5 w-full">
                  {/* Bet Amount (Full Width in Auto Mode) */}
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center justify-between h-4">
                      <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Bet Amount</label>
                      <div className="text-[9.5px] text-gray-500 flex items-center gap-0.5 font-bold">
                        <span>Bal:</span>
                        <span className="text-white font-display">${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className={`flex items-center h-10 bg-[#1c1c1c] rounded-lg border overflow-hidden focus-within:border-brand/30 transition-all px-1 ${
                      parseFloat(betAmountInput) > balance 
                        ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80' 
                        : parseFloat(betAmountInput) < 0
                        ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80'
                        : 'border-white/5'
                    }`}>
                      <input
                        type="number"
                        step="0.01"
                        min="0.00"
                        disabled={isAutoRunning}
                        value={betAmountInput}
                        onChange={(e) => setBetAmountInput(e.target.value)}
                        className="flex-1 bg-transparent text-[13.5px] font-display font-bold text-white focus:outline-none h-full pl-1.5 min-w-0"
                      />
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isAutoRunning}
                          onClick={handleHalfBet}
                          className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center text-gray-300 hover:text-white"
                        >
                          ½
                        </button>
                        <button
                          type="button"
                          disabled={isAutoRunning}
                          onClick={handleDoubleBet}
                          className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center text-gray-300 hover:text-white animate-none"
                        >
                          2×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Number of Bets */}
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center justify-between h-4">
                      <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Number of Bets</label>
                      {isAutoRunning && (
                        <span className="text-[9.5px] text-[#dbfd4e] font-black animate-pulse font-sans">
                          Rem: {remainingAutoBets === -1 ? '∞' : remainingAutoBets}
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center h-10 bg-[#1c1c1c] rounded-lg border border-white/5 overflow-hidden focus-within:border-brand/30 transition-all">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={isAutoRunning}
                        value={autoBetsCount === '0' && !isAutoRunning ? '0' : autoBetsCount}
                        onChange={(e) => setAutoBetsCount(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent text-[13.5px] font-display font-bold text-white focus:outline-none h-full px-2.5"
                      />
                      <button
                        type="button"
                        disabled={isAutoRunning}
                        onClick={() => setAutoBetsCount('0')}
                        className="h-full px-3 text-[17px] font-black text-gray-400 hover:text-white transition flex items-center justify-center border-l border-white/5"
                        title="Infinite Bets"
                      >
                        ∞
                      </button>
                    </div>
                  </div>

                  {/* Advanced Toggle Row */}
                  <div className="flex items-center justify-between pt-0.5 select-none px-1">
                    <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                      Advanced
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(prev => !prev)}
                      className="relative inline-flex items-center cursor-pointer focus:outline-none"
                    >
                      <div className={`w-8 h-4.5 rounded-full border transition-all duration-200 relative ${
                        showAdvanced 
                          ? 'bg-[#dbfd4e]/10 border-[#dbfd4e]/30' 
                          : 'bg-[#141414] border-white/10'
                      }`}>
                        <div className={`absolute top-[1px] left-[1px] h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                          showAdvanced 
                            ? 'translate-x-3.5 bg-[#dbfd4e] shadow-glow' 
                            : 'bg-gray-500'
                        }`} />
                      </div>
                    </button>
                  </div>

                  {/* Collapsible Advanced Section inside the card */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-3"
                      >
                        <div className="border-t border-white/5 pt-2 space-y-3">
                          
                          {/* On Win */}
                          <div className="space-y-1 text-left">
                            <label className="text-[11.5px] md:text-[13.5px] font-bold text-gray-400">On Win</label>
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-7 bg-[#1c1c1c] border border-white/5 rounded-lg p-0.5 flex h-10">
                                <button
                                  type="button"
                                  disabled={isAutoRunning}
                                  onClick={() => setOnWinAction(prev => ({ ...prev, action: 'reset' }))}
                                  className={`flex-1 text-[11.5px] md:text-[13.5px] font-bold rounded-md transition duration-150 ${
                                    onWinAction.action === 'reset' 
                                      ? 'bg-[#2f4553] text-white font-black' 
                                      : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  Reset
                                </button>
                                <button
                                  type="button"
                                  disabled={isAutoRunning}
                                  onClick={() => setOnWinAction(prev => ({ ...prev, action: 'increase' }))}
                                  className={`flex-1 text-[11.5px] md:text-[13.5px] font-bold rounded-md transition duration-150 ${
                                    onWinAction.action === 'increase' 
                                      ? 'bg-[#2f4553] text-white font-black' 
                                      : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  Increase by:
                                </button>
                              </div>
                              <div className="col-span-5 relative flex items-center h-10">
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  disabled={isAutoRunning || onWinAction.action === 'reset'}
                                  value={onWinAction.value}
                                  onChange={(e) => setOnWinAction(prev => ({ ...prev, value: Math.max(0, parseFloat(e.target.value) || 0) }))}
                                  className={`w-full h-full bg-[#1c1c1c] border text-[13.5px] md:text-[15.5px] font-display font-bold text-white px-3 pr-8 rounded-lg focus:outline-none transition-all ${
                                    onWinAction.action === 'reset' 
                                      ? 'border-white/5 opacity-40 cursor-not-allowed' 
                                      : 'border-white/5 hover:border-white/10 focus:border-[#dbfd4e]/30'
                                  }`}
                                />
                                <span className="absolute right-3 text-[13.5px] font-bold text-gray-500">%</span>
                              </div>
                            </div>
                          </div>

                          {/* On Loss */}
                          <div className="space-y-1 text-left">
                            <label className="text-[11.5px] md:text-[13.5px] font-bold text-gray-400">On Loss</label>
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-7 bg-[#1c1c1c] border border-white/5 rounded-lg p-0.5 flex h-10">
                                <button
                                  type="button"
                                  disabled={isAutoRunning}
                                  onClick={() => setOnLossAction(prev => ({ ...prev, action: 'reset' }))}
                                  className={`flex-1 text-[11.5px] md:text-[13.5px] font-bold rounded-md transition duration-150 ${
                                    onLossAction.action === 'reset' 
                                      ? 'bg-[#2f4553] text-white font-black' 
                                      : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  Reset
                                </button>
                                <button
                                  type="button"
                                  disabled={isAutoRunning}
                                  onClick={() => setOnLossAction(prev => ({ ...prev, action: 'increase' }))}
                                  className={`flex-1 text-[11.5px] md:text-[13.5px] font-bold rounded-md transition duration-150 ${
                                    onLossAction.action === 'increase' 
                                      ? 'bg-[#2f4553] text-white font-black' 
                                      : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  Increase by:
                                </button>
                              </div>
                              <div className="col-span-5 relative flex items-center h-10">
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  disabled={isAutoRunning || onLossAction.action === 'reset'}
                                  value={onLossAction.value}
                                  onChange={(e) => setOnLossAction(prev => ({ ...prev, value: Math.max(0, parseFloat(e.target.value) || 0) }))}
                                  className={`w-full h-full bg-[#1c1c1c] border text-[13.5px] md:text-[15.5px] font-display font-bold text-white px-3 pr-8 rounded-lg focus:outline-none transition-all ${
                                    onLossAction.action === 'reset' 
                                      ? 'border-white/5 opacity-40 cursor-not-allowed' 
                                      : 'border-white/5 hover:border-white/10 focus:border-[#dbfd4e]/30'
                                  }`}
                                />
                                <span className="absolute right-3 text-[13.5px] font-bold text-gray-500">%</span>
                              </div>
                            </div>
                          </div>

                          {/* Stop on Profit / Loss */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Stop on Profit */}
                            <div className="space-y-1 text-left">
                              <div className="flex items-center justify-between">
                                <label className="text-[11.5px] md:text-[13.5px] font-bold text-gray-400">Stop on Profit</label>
                                <span className="text-[11.5px] text-gray-500 font-bold font-display">
                                  {stopOnProfit ? `$${parseFloat(stopOnProfit).toFixed(2)}` : '$0.00'}
                                </span>
                              </div>
                              <div className="relative flex items-center h-10">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={isAutoRunning}
                                  placeholder="0.00000000"
                                  value={stopOnProfit}
                                  onChange={(e) => setStopOnProfit(e.target.value)}
                                  className="w-full h-full bg-[#1c1c1c] border border-white/5 hover:border-white/10 text-[13.5px] md:text-[15.5px] font-display font-bold text-white pl-3 pr-9 rounded-lg focus:outline-none focus:border-[#dbfd4e]/30 transition-all"
                                />
                                <div className="absolute right-2.5">
                                  <TetherIcon />
                                </div>
                              </div>
                            </div>

                            {/* Stop on Loss */}
                            <div className="space-y-1 text-left">
                              <div className="flex items-center justify-between">
                                <label className="text-[11.5px] md:text-[13.5px] font-bold text-gray-400">Stop on Loss</label>
                                <span className="text-[11.5px] text-gray-500 font-bold font-display">
                                  {stopOnLoss ? `$${parseFloat(stopOnLoss).toFixed(2)}` : '$0.00'}
                                </span>
                              </div>
                              <div className="relative flex items-center h-10">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={isAutoRunning}
                                  placeholder="0.00000000"
                                  value={stopOnLoss}
                                  onChange={(e) => setStopOnLoss(e.target.value)}
                                  className="w-full h-full bg-[#1c1c1c] border border-white/5 hover:border-white/10 text-[13.5px] md:text-[15.5px] font-display font-bold text-white pl-3 pr-9 rounded-lg focus:outline-none focus:border-[#dbfd4e]/30 transition-all"
                                />
                                <div className="absolute right-2.5">
                                  <TetherIcon />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Launch Action Button */}
            {betMode === 'manual' ? (
              <button
                type="button"
                disabled={isPlaying}
                onClick={executeBet}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-150 transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
              >
                {isPlaying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Flipping Coin...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bet & Flip Coin</span>
                  </>
                )}
              </button>
            ) : (
              /* Auto Mode execution trigger */
              <button
                type="button"
                onClick={isAutoRunning ? stopAutoBets : startAutoBets}
                disabled={isPlaying}
                className={`w-full h-11 px-4 rounded-xl font-display font-black text-[12px] md:text-[13px] uppercase tracking-widest transition-all duration-200 transform ${
                  isLoggedIn && parseFloat(betAmountInput) > balance
                    ? 'bg-[#1c1c1c] border border-white/5 text-gray-500 cursor-not-allowed scale-[0.98]'
                    : isAutoRunning 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)]' 
                      : 'bg-brand hover:bg-[#cbe83d] text-black shadow-glow hover:shadow-[0_0_22px_rgba(219,253,78,0.6)]'
                } active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer`}
              >
                {isAutoRunning ? (
                  <>
                    <Square className="w-3 h-3 fill-current" /> Stop Autobetting
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" /> Start Autobet
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* 4. Fairness Tab Screen */}
      {activeTab === 'fairness' && (
        <div className="bg-[#141416]/40 border border-white/5 rounded-xl p-3 md:p-4 space-y-4 text-xs">
          
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Provably Fair RNG Verification</span>
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Every coin flip's result is pre-calculated mathematically using a cryptographic hash function combining the seeds and nonce. No one can manipulate it.
            </p>
          </div>

          <div className="space-y-3">
            {/* Active Server Seed Hash */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-gray-500">Active Server Seed Hash</span>
              <div className="bg-[#050506] border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-amber-400 break-all select-all flex-1 pr-3">{serverSeedHash || "Generating..."}</span>
                <button type="button" onClick={() => copyToClipboard(serverSeedHash, "Server Seed Hash")} className="text-gray-400 hover:text-white shrink-0 p-1">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Client Seed */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-gray-500">Active Client Seed</span>
              <div className="flex bg-[#050506] border border-white/10 rounded-lg overflow-hidden font-mono text-[10.5px]">
                <span className="px-3 py-1.5 text-gray-400 flex-1 break-all select-all">{clientSeed}</span>
                <button type="button" onClick={() => copyToClipboard(clientSeed, "Client Seed")} className="text-gray-400 hover:text-white shrink-0 p-2.5">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Next Server Seed Hash */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-gray-500">Next Server Seed Hash (Pre-committed)</span>
              <div className="bg-[#050506] border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-gray-400 break-all select-all flex-1 pr-3">{nextServerSeedHash}</span>
                <button type="button" onClick={() => copyToClipboard(nextServerSeedHash, "Next Seed Hash")} className="text-gray-400 hover:text-white shrink-0 p-1">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Nonce */}
            <div className="flex justify-between items-center bg-[#050506] border border-white/5 p-2 rounded-lg font-mono text-[11px]">
              <span className="text-gray-400">Total Bets on Current Pair (Nonce):</span>
              <span className="text-white font-bold">{nonceRef.current}</span>
            </div>

            {/* Rotate seed pair trigger button */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={rotateSeedPair}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate Active Seeds (Reveal Previous)</span>
              </button>
            </div>

            {/* Revealed Seeds if Rotated */}
            {previousServerSeed && (
              <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-3 space-y-2 pt-2.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 select-none">
                  <Info className="w-3.5 h-3.5" /> Previous Seed Pair (Revealed)
                </span>
                <div className="space-y-1.5 font-mono text-[10px] text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase text-[8.5px]">Prev Server Seed (Unhashed)</span>
                    <button type="button" onClick={() => copyToClipboard(previousServerSeed, "Previous Server Seed")} className="text-gray-500 hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-[#050506] p-1.5 rounded border border-white/5 break-all select-all">
                    {previousServerSeed}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase text-[8.5px]">Prev Client Seed</span>
                    <button type="button" onClick={() => copyToClipboard(previousClientSeed, "Previous Client Seed")} className="text-gray-500 hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-[#050506] p-1.5 rounded border border-white/5 break-all select-all">
                    {previousClientSeed}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Verification Tool section */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex flex-col">
                <span className="font-bold text-white uppercase tracking-wider text-[10.5px]">Verify Specific Flips</span>
                <span className="text-[9.5px] text-gray-400 mt-0.5">Paste details of any past coin flip below to mathematically verify its fair outcome.</span>
              </div>

              {verifyError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10.5px] px-3 py-2 rounded-xl font-medium flex items-center gap-2 select-none animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Client Seed Phrase</span>
                  <input
                    type="text"
                    value={verifyClientSeed}
                    onChange={(e) => {
                      setVerifyClientSeed(e.target.value);
                      if (verifyError?.includes("Client Seed")) setVerifyError(null);
                    }}
                    placeholder="Enter previous client seed phrase..."
                    className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400/30"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Server Seed (Unhashed Hex)</span>
                  <input
                    type="text"
                    value={verifyServerSeed}
                    onChange={(e) => {
                      setVerifyServerSeed(e.target.value);
                      if (verifyError?.includes("Server Seed")) setVerifyError(null);
                    }}
                    placeholder="Enter previous unhashed server seed hex..."
                    className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Nonce (Roll Count)</span>
                    <input
                      type="number"
                      value={verifyNonce}
                      onChange={(e) => setVerifyNonce(e.target.value)}
                      placeholder="1"
                      min="0"
                      className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400/30"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerify}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                  >
                    Calculate Outcome
                  </button>
                </div>

                {calculatedResult && (
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1 mt-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Provably Fair Outcome</span>
                    <span className="text-xl font-display font-black text-amber-400 tracking-widest">{calculatedResult}</span>
                    <span className="text-[9px] text-gray-500 font-mono text-center">Outcome is strictly deterministic based on hashes.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Statistics Tab Screen */}
      {activeTab === 'stats' && (
        <div className="bg-[#141416]/40 border border-white/5 rounded-xl p-3 md:p-4 space-y-4 text-xs">
          <div className="border-b border-white/5 pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Session Live Stats</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">Track your performance during this active gaming session.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setLiveStats({ wagered: 0, profit: 0, wins: 0, losses: 0 });
              }}
              className="px-2.5 py-1 bg-[#171717] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-[9.5px] font-black uppercase text-gray-400 hover:text-white transition"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-[#050506] border border-white/5 rounded-xl p-3 flex flex-col">
              <span className="text-[9px] font-bold uppercase text-gray-500">Wagered</span>
              <span className="text-sm font-mono font-bold text-white mt-1">${liveStats.wagered.toFixed(2)}</span>
            </div>
            <div className="bg-[#050506] border border-white/5 rounded-xl p-3 flex flex-col">
              <span className="text-[9px] font-bold uppercase text-gray-500">Net Profit</span>
              <span className={`text-sm font-mono font-bold mt-1 ${liveStats.profit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {liveStats.profit >= 0 ? '+' : ''}${liveStats.profit.toFixed(2)}
              </span>
            </div>
            <div className="bg-[#050506] border border-white/5 rounded-xl p-3 flex flex-col">
              <span className="text-[9px] font-bold uppercase text-gray-500">Wins</span>
              <span className="text-sm font-mono font-bold text-emerald-400 mt-1">{liveStats.wins}</span>
            </div>
            <div className="bg-[#050506] border border-white/5 rounded-xl p-3 flex flex-col">
              <span className="text-[9px] font-bold uppercase text-gray-500">Losses</span>
              <span className="text-sm font-mono font-bold text-rose-400 mt-1">{liveStats.losses}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Manual / Auto tab toggler at the bottom */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5 pb-1">
        <div className="bg-[#141414] border border-white/5 p-1 rounded-full flex w-full max-w-[240px]">
          <button
            type="button"
            disabled={isPlaying || isAutoRunning}
            onClick={() => { setBetMode('manual'); playSound('click'); }}
            className={`flex-1 text-center py-1.5 px-3 rounded-full text-[10.5px] font-black uppercase tracking-wider transition ${
              betMode === 'manual' 
                ? 'bg-[#262626] text-white border border-white/5 shadow-sm' 
                : 'text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            disabled={isPlaying || isAutoRunning}
            onClick={() => { setBetMode('auto'); playSound('click'); }}
            className={`flex-1 text-center py-1.5 px-3 rounded-full text-[10.5px] font-black uppercase tracking-wider transition ${
              betMode === 'auto' 
                ? 'bg-[#262626] text-white border border-white/5 shadow-sm' 
                : 'text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      {/* 6.5. Bottom Tab Selectors / Settings / Fairness Bar */}
      <div className="border-t border-white/5 mt-1 pt-2 px-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-lg border transition duration-150 flex items-center justify-center ${
                isSettingsOpen
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                  : 'bg-[#141414] border-white/5 text-gray-400 hover:text-white'
              }`}
              title="Game Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  className="absolute bottom-full mb-2 left-0 w-[148px] bg-[#121212]/95 border border-white/10 rounded-xl p-2 shadow-2xl z-50 text-left flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 select-none">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Settings className="w-3 h-3 text-amber-400" />
                      <span>Configure Seeds</span>
                    </h4>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Change Client Seed</span>
                    <input
                      type="text"
                      value={newClientSeedInput}
                      onChange={(e) => setNewClientSeedInput(e.target.value)}
                      placeholder="New client seed..."
                      className="w-full bg-[#050506] border border-white/10 rounded px-1.5 py-1 text-[9.5px] font-mono text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={changeClientSeed}
                      className="w-full py-1 bg-amber-400 hover:bg-amber-300 text-black text-[9px] font-black uppercase tracking-wide rounded transition cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab switches */}
          <div className="flex bg-[#141414] border border-white/5 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => { setActiveTab('play'); playSound('click'); }}
              className={`px-3 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-md transition ${
                activeTab === 'play' ? 'bg-[#222] text-amber-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('fairness'); playSound('click'); }}
              className={`px-3 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-md transition ${
                activeTab === 'fairness' ? 'bg-[#222] text-amber-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Fairness
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('stats'); playSound('click'); }}
              className={`px-3 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-md transition ${
                activeTab === 'stats' ? 'bg-[#222] text-amber-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        <div className="text-[10px] font-bold text-[#dbfd4e] tracking-wider select-none pr-1 uppercase">
          99.00% RTP
        </div>
      </div>

      {/* Floating Compact Toasts overlay */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col gap-1.5 z-50 pointer-events-none select-none max-w-[280px]">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 shadow-xl ${
                notif.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : notif.type === 'warning'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-white/5 border-white/5 text-gray-300'
              }`}
            >
              <span>{notif.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Complete verification details overlay model popup */}
      <AnimatePresence>
        {isBetDetailsModalOpen && selectedBet && (
          <div className="absolute inset-0 bg-[#070708]/90 backdrop-blur-md z-[60] flex items-center justify-center p-2 font-sans overflow-hidden select-none">
            <div onClick={() => setIsBetDetailsModalOpen(false)} className="absolute inset-0 cursor-pointer" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-sm bg-[#121214] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[95%] overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-4 bg-[#0c0c0e] shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                    selectedBet.win 
                      ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400' 
                      : 'bg-[#222]/80 border border-white/5 text-gray-500'
                  }`}>
                    {selectedBet.win ? 'W' : 'L'}
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Coin Flip Bet Details</h4>
                    <p className="text-[9.5px] text-gray-500 mt-0.5 font-semibold uppercase font-mono">Provably Fair Outcome</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBetDetailsModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body Content */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin text-xs text-[#bdbdbd]">
                {/* High impact winning card banner */}
                <div className={`rounded-xl p-3.5 border flex flex-col items-center gap-1 shrink-0 ${
                  selectedBet.win 
                    ? 'bg-amber-400/5 border-amber-400/10 text-amber-400' 
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-500'
                }`}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Winning Payout</span>
                  <span className="text-2xl font-display font-black tracking-tight text-white">
                    {selectedBet.win ? '1.98x' : '0.00x'}
                  </span>
                  <p className={`text-xs font-semibold ${selectedBet.win ? 'text-amber-400' : 'text-gray-400'}`}>
                    {selectedBet.win 
                      ? `+$${(selectedBet.betAmount * 1.98).toFixed(2)}` 
                      : `-$${selectedBet.betAmount.toFixed(2)}`
                    }
                  </p>
                  <div className="flex gap-2 text-[9.5px] font-bold uppercase tracking-wider text-gray-500 mt-1.5 border-t border-white/5 pt-1.5 w-full justify-around">
                    <span>Choice: <strong className="text-white">{selectedBet.chosenSide}</strong></span>
                    <span>Flip: <strong className="text-white">{selectedBet.actualSide}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white/5 border border-white/5 rounded-xl p-2">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Player</span>
                    <p className="font-bold text-white break-all">{selectedBet.username}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 border border-white/5 rounded-xl p-2">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Time Played</span>
                    <p className="font-bold text-white break-all">{selectedBet.timestamp}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white/5 border border-white/5 rounded-xl p-2">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Bet ID</span>
                    <p className="font-mono text-white text-[10px] break-all">#{selectedBet.id.substring(5, 15)}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 border border-white/5 rounded-xl p-2">
                    <span className="text-[8px] font-bold uppercase text-gray-500">Nonce (Bet Rank)</span>
                    <p className="font-mono text-white text-[10px] font-bold break-all">{selectedBet.nonce}</p>
                  </div>
                </div>

                {/* Client Seed */}
                <div className="space-y-1">
                  <span className="text-[8.5px] font-bold uppercase text-gray-500">Client Seed</span>
                  <div className="flex gap-1.5 items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                    <p className="text-[10.5px] font-mono font-medium text-gray-300 break-all flex-1 min-w-0">
                      {selectedBet.clientSeed}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedBet.clientSeed, "Client Seed")}
                      className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Server Seed (Unhashed) - Only shown if rotated */}
                {selectedBet.serverSeed && selectedBet.serverSeed !== serverSeed && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-[8.5px] font-bold uppercase text-gray-500">Server Seed (Unhashed)</span>
                      <span className="text-[8.5px] text-emerald-400 font-bold uppercase tracking-wide">Revealed ✓</span>
                    </div>
                    <div className="flex gap-1.5 items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                      <p className="text-[10.5px] font-mono font-medium text-gray-300 break-all flex-1 min-w-0">
                        {selectedBet.serverSeed}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedBet.serverSeed, "Server Seed")}
                        className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Server Seed Hash */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[8.5px] font-bold uppercase text-gray-500">Server Seed Hash</span>
                  </div>
                  <div className="flex gap-1.5 items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                    <p className="text-[10.5px] font-mono font-medium text-gray-300 break-all flex-1 min-w-0">
                      {selectedBet.serverSeedHash}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedBet.serverSeedHash, "Server Seed Hash")}
                      className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
