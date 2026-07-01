import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Info, Volume2, VolumeX, RotateCcw, AlertTriangle, Zap, ArrowRight, Sparkles, Check, X, Settings, BarChart2, Shield, ChevronDown, Copy } from 'lucide-react';

interface LimboProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onClose?: () => void;
}

interface BetHistoryItem {
  id: string;
  multiplier: number;
  target: number;
  win: boolean;
  betAmount?: number;
  clientSeed?: string;
  serverSeed?: string;
  serverSeedHash?: string;
  nonce?: number;
  timestamp?: string;
  username?: string;
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

function calculateMultiplierSync(srvSeed: string, cliSeed: string, nce: number): number {
  const combined = `${srvSeed}-${cliSeed}-${nce}`;
  const hash = sha256Sync(combined);
  const val = parseInt(hash.substring(0, 8), 16);
  const rand = val / 4294967295;
  const rawResult = 0.99 / (1 - rand * 0.99);
  return parseFloat(Math.max(1.00, parseFloat(rawResult.toFixed(2))).toFixed(2));
}

export default function Limbo({ balance, onUpdateBalance, isLoggedIn, onOpenAuth, onClose }: LimboProps) {
  // Gameplay States
  const [betAmount, setBetAmount] = useState<number>(0.00);
  const [betAmountInput, setBetAmountInput] = useState<string>("0.00");
  const [targetInput, setTargetInput] = useState<string>("2.00");
  const [chanceInput, setChanceInput] = useState<string>("49.50");

  const targetMultiplier = parseFloat(targetInput) || 0;
  const winChance = parseFloat(chanceInput) || 0;

  // Validation for target multiplier and win chance
  const isTargetInvalid = isNaN(targetMultiplier) || targetMultiplier < 1.01 || targetMultiplier > 1000000;
  const isChanceInvalid = isNaN(winChance) || winChance < 0.000099 || winChance > 98.0198;
  
  // Game running state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [gameResult, setGameResult] = useState<{ win: boolean; finalVal: number } | null>(null);
  
  // Betting Modes: 'manual' | 'auto'
  const [betMode, setBetMode] = useState<'manual' | 'auto'>('manual');
  
  // Auto Bet Configuration
  const [autoBetsCount, setAutoBetsCount] = useState<string>('0'); // '0' or empty means infinite
  const [autoBetsRemaining, setAutoBetsRemaining] = useState<number>(0);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const initialBetAmountRef = useRef<number>(0.00);
  
  const [onWinAction, setOnWinAction] = useState<{ action: 'reset' | 'increase'; value: number }>({ action: 'reset', value: 100 });
  const [onLossAction, setOnLossAction] = useState<{ action: 'reset' | 'increase'; value: number }>({ action: 'reset', value: 100 });
  
  const [stopOnProfit, setStopOnProfit] = useState<string>('');
  const [stopOnLoss, setStopOnLoss] = useState<string>('');
  
  const initialBalanceRef = useRef<number>(balance);
  const autoRunTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoBetsRemainingRef = useRef<number>(autoBetsRemaining);
  const balanceRef = useRef<number>(balance);
  const showAdvancedRef = useRef<boolean>(showAdvanced);
  const stopOnProfitRef = useRef<string>(stopOnProfit);
  const stopOnLossRef = useRef<string>(stopOnLoss);

  useEffect(() => {
    autoBetsRemainingRef.current = autoBetsRemaining;
  }, [autoBetsRemaining]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    showAdvancedRef.current = showAdvanced;
    stopOnProfitRef.current = stopOnProfit;
    stopOnLossRef.current = stopOnLoss;
  }, [showAdvanced, stopOnProfit, stopOnLoss]);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [instantBet, setInstantBet] = useState<boolean>(false);
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);
  const [showMaxBet, setShowMaxBet] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsPlacement, setSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const [activeFooterTab, setActiveFooterTab] = useState<'graph' | null>(null);
  const [showLiveStats, setShowLiveStats] = useState<boolean>(false);

  // Provably Fair States
  const [clientSeed, setClientSeed] = useState<string>("limbo_client_seed_77852a3fc291");
  const [serverSeed, setServerSeed] = useState<string>("8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5");
  const [serverSeedHash, setServerSeedHash] = useState<string>("89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63");
  const [nextServerSeed, setNextServerSeed] = useState<string>("c3093b7dfa910943ebde82c0b561c28b26125a00ffdbecab32cb71cf78ef10a2");
  const [nextServerSeedHash, setNextServerSeedHash] = useState<string>("5d7f3e82b71ab20943ebef8e0dc6123a4921471ab870cdaef93e107df038234e");
  const [totalBetsWithSeedPair, setTotalBetsWithSeedPair] = useState<number>(0);
  const [previousServerSeed, setPreviousServerSeed] = useState<string>("");
  const [previousServerSeedHash, setPreviousServerSeedHash] = useState<string>("");
  const [previousClientSeed, setPreviousClientSeed] = useState<string>("");
  const [previousNonce, setPreviousNonce] = useState<number>(0);
  const [newClientSeedInput, setNewClientSeedInput] = useState<string>("");
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState<boolean>(false);
  const [fairnessTab, setFairnessTab] = useState<'overview' | 'seeds' | 'verify'>('overview');
  const [selectedBet, setSelectedBet] = useState<BetHistoryItem | null>(null);
  const [isBetDetailsModalOpen, setIsBetDetailsModalOpen] = useState<boolean>(false);

  // Verification tool states
  const [verifyServerSeed, setVerifyServerSeed] = useState<string>("");
  const [verifyClientSeed, setVerifyClientSeed] = useState<string>("");
  const [verifyNonce, setVerifyNonce] = useState<string>("0");
  const [calculatedResult, setCalculatedResult] = useState<number | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState<{
    bets: number;
    wins: number;
    losses: number;
    wagered: number;
    profit: number;
    history: number[];
  }>({
    bets: 0,
    wins: 0,
    losses: 0,
    wagered: 0,
    profit: 0,
    history: [0]
  });

  const updateLiveStats = useCallback((isWin: boolean, betAmt: number, multiplier: number) => {
    const netProfit = isWin 
      ? parseFloat((betAmt * multiplier - betAmt).toFixed(2)) 
      : -betAmt;

    setTotalBetsWithSeedPair(prev => prev + 1);

    setLiveStats((prev) => {
      const newBets = prev.bets + 1;
      const newWins = prev.wins + (isWin ? 1 : 0);
      const newLosses = prev.losses + (isWin ? 0 : 1);
      const newWagered = parseFloat((prev.wagered + betAmt).toFixed(2));
      const newProfit = parseFloat((prev.profit + netProfit).toFixed(2));
      const newHistory = [...prev.history, newProfit];
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return {
        bets: newBets,
        wins: newWins,
        losses: newLosses,
        wagered: newWagered,
        profit: newProfit,
        history: newHistory,
      };
    });
  }, []);

  const resetLiveStats = () => {
    playSound('click');
    setLiveStats({
      bets: 0,
      wins: 0,
      losses: 0,
      wagered: 0,
      profit: 0,
      history: [0]
    });
  };
  const [history, setHistory] = useState<BetHistoryItem[]>([
    { 
      id: '1', 
      multiplier: 1.05, 
      target: 2.00, 
      win: false,
      betAmount: 10.00,
      clientSeed: "limbo_client_seed_77852a3fc291",
      serverSeed: "8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5",
      serverSeedHash: "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63",
      nonce: 4,
      timestamp: "2026-06-30 07:12:35",
      username: "CryptoKing"
    },
    { 
      id: '2', 
      multiplier: 12.45, 
      target: 2.00, 
      win: true,
      betAmount: 5.00,
      clientSeed: "limbo_client_seed_77852a3fc291",
      serverSeed: "8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5",
      serverSeedHash: "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63",
      nonce: 3,
      timestamp: "2026-06-30 07:11:12",
      username: "RajaBet"
    },
    { 
      id: '3', 
      multiplier: 1.88, 
      target: 1.50, 
      win: true,
      betAmount: 25.00,
      clientSeed: "limbo_client_seed_77852a3fc291",
      serverSeed: "8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5",
      serverSeedHash: "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63",
      nonce: 2,
      timestamp: "2026-06-30 07:09:44",
      username: "Kashif_Pro"
    },
    { 
      id: '4', 
      multiplier: 4.50, 
      target: 5.00, 
      win: false,
      betAmount: 15.00,
      clientSeed: "limbo_client_seed_77852a3fc291",
      serverSeed: "8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5",
      serverSeedHash: "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63",
      nonce: 1,
      timestamp: "2026-06-30 07:05:19",
      username: "Rahul_987"
    },
    { 
      id: '5', 
      multiplier: 1.00, 
      target: 2.00, 
      win: false,
      betAmount: 1.00,
      clientSeed: "limbo_client_seed_77852a3fc291",
      serverSeed: "8ea2b8a7f433fcf648943abde400e9cfc4125a0bcde890f5dbfdfab32cb71cfdf890a5",
      serverSeedHash: "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63",
      nonce: 0,
      timestamp: "2026-06-30 07:01:02",
      username: "EuroElite"
    },
  ]);

  const settingsRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleResizeOrScroll() {
      if (isSettingsOpen && settingsRef.current) {
        const rect = settingsRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        // Popover is compact, approx 140px high.
        if (spaceAbove > 140) {
          setSettingsPlacement('top');
        } else if (spaceBelow > 140) {
          setSettingsPlacement('bottom');
        } else {
          setSettingsPlacement(spaceAbove >= spaceBelow ? 'top' : 'bottom');
        }
      }
    }

    if (isSettingsOpen) {
      handleResizeOrScroll();
      window.addEventListener('resize', handleResizeOrScroll);
      window.addEventListener('scroll', handleResizeOrScroll, true);
    }
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isSettingsOpen]);

  // Custom Elegant Notifications
  interface NotificationItem {
    id: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info', duration = 5000) => {
    setNotifications((prev) => {
      // Agar screen par pehle se hi 2 notifications dikh rahi hain, toh naye notifications ko discard kar do (no queue)
      if (prev.length >= 2) {
        return prev;
      }
      
      const id = Date.now().toString() + Math.random();
      
      setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== id));
      }, duration);
      
      return [...prev, { id, message, type }];
    });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
    if (!label.toLowerCase().includes("seed") && !label.toLowerCase().includes("hash")) {
      addNotification(`${label} copied to clipboard!`, "success");
    }
  };

  const rotateSeedPair = () => {
    setPreviousServerSeed(serverSeed);
    setPreviousServerSeedHash(serverSeedHash);
    setPreviousClientSeed(clientSeed);
    setPreviousNonce(totalBetsWithSeedPair);

    const activeSrv = nextServerSeed;
    const activeSrvHash = nextServerSeedHash;
    setServerSeed(activeSrv);
    setServerSeedHash(activeSrvHash);

    const nextSrv = generateRandomHex(64);
    const nextSrvHash = sha256Sync(nextSrv);
    setNextServerSeed(nextSrv);
    setNextServerSeedHash(nextSrvHash);

    setTotalBetsWithSeedPair(0);
  };

  const changeClientSeed = () => {
    if (!newClientSeedInput.trim()) {
      addNotification("Please enter a valid client seed", "warning");
      return;
    }
    setClientSeed(newClientSeedInput.trim());
    setNewClientSeedInput("");
  };

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
    const result = calculateMultiplierSync(verifyServerSeed.trim(), verifyClientSeed.trim(), nonceVal);
    setCalculatedResult(result);
  };

  // Audio Player
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
        // Ultra-soft "Velvet Haptic Felt Tap" tick sound (completely ear-safe and non-piercing)
        // Uses a pure sine wave swept in low-mid frequencies (600Hz down to 200Hz)
        // coupled with a warm low-pass filter. Zero high-end harshness, completely non-fatiguing.
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Warm low-mid frequency range (comfort zone for human hearing)
        const baseFreq = 380 + Math.random() * 60;
        
        // Smooth slide down to synthesize a soft, rounded physical tap
        osc.frequency.setValueAtTime(baseFreq * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.015);
        
        // Strong low-pass filter to aggressively cut off any high-frequency digital pops
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);
        filter.Q.setValueAtTime(1.5, now);
        
        // Gentle warm volume decay (2x volume as requested: 0.35 -> 0.70)
        gain.gain.setValueAtTime(0.70, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        
        osc.start(now);
        osc.stop(now + 0.016);
      } else if (type === 'click') {
        // Premium "Chamber Bubble Drop" UI tap sound
        // Uses a dual-harmonic sine weave with a warm lowpass curve to sound like a soft glass button pop
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
        
        // Primary note at 1100Hz with a rapid organic decay
        osc1.frequency.setValueAtTime(1100, now);
        osc1.frequency.exponentialRampToValueAtTime(350, now + 0.012);
        
        // Harmonic octave chime at 2200Hz to add a crystalline glass tone
        osc2.frequency.setValueAtTime(2200, now);
        osc2.frequency.exponentialRampToValueAtTime(700, now + 0.008);
        
        // Warm lowpass filter to make it completely smooth, soft and non-piercing
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        
        // Volume reduced by 25% as requested (0.27 * 0.75 = ~0.20)
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
        
        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 0.015);
        osc2.stop(now + 0.015);
      } else if (type === 'win') {
        // Fast, satisfying, ascending double-chime (level-up style) for high-quality reward feeling
        const notes = [
          { freq: 523.25, delay: 0, dur: 0.12 },   // C5
          { freq: 659.25, delay: 0.04, dur: 0.12 },  // E5
          { freq: 783.99, delay: 0.08, dur: 0.12 },  // G5
          { freq: 1046.50, delay: 0.12, dur: 0.22 }  // C6
        ];
        notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.frequency.setValueAtTime(note.freq, now + note.delay);
          gain.gain.setValueAtTime(0.65, now + note.delay);
          gain.gain.linearRampToValueAtTime(0, now + note.delay + note.dur);
          
          osc.start(now + note.delay);
          osc.stop(now + note.delay + note.dur);
        });
      } else if (type === 'lose') {
        // Loss sound disabled as requested
        return;
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  // Helper US Flag Component
  const UsFlag = () => (
    <div className="flex items-center gap-1 shrink-0">
      <svg className="w-5 h-3.5 rounded-sm overflow-hidden border border-white/10" viewBox="0 0 74 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="74" height="39" fill="#B22234" />
        <path d="M0 3h74M0 9h74M0 15h74M0 21h74M0 27h74M0 33h74" stroke="#FFF" strokeWidth="3" />
        <rect width="29.6" height="21" fill="#3C3B6E" />
        <circle cx="5" cy="4" r="1.2" fill="#FFF" />
        <circle cx="10" cy="4" r="1.2" fill="#FFF" />
        <circle cx="15" cy="4" r="1.2" fill="#FFF" />
        <circle cx="20" cy="4" r="1.2" fill="#FFF" />
        <circle cx="25" cy="4" r="1.2" fill="#FFF" />
        <circle cx="7.5" cy="8" r="1.2" fill="#FFF" />
        <circle cx="12.5" cy="8" r="1.2" fill="#FFF" />
        <circle cx="17.5" cy="8" r="1.2" fill="#FFF" />
        <circle cx="22.5" cy="8" r="1.2" fill="#FFF" />
        <circle cx="5" cy="12" r="1.2" fill="#FFF" />
        <circle cx="10" cy="12" r="1.2" fill="#FFF" />
        <circle cx="15" cy="12" r="1.2" fill="#FFF" />
        <circle cx="20" cy="12" r="1.2" fill="#FFF" />
        <circle cx="25" cy="12" r="1.2" fill="#FFF" />
        <circle cx="7.5" cy="16" r="1.2" fill="#FFF" />
        <circle cx="12.5" cy="16" r="1.2" fill="#FFF" />
        <circle cx="17.5" cy="16" r="1.2" fill="#FFF" />
        <circle cx="22.5" cy="16" r="1.2" fill="#FFF" />
      </svg>
      <span className="text-[10px] font-bold text-gray-400 font-sans">USD</span>
    </div>
  );

  // Profit calculation helper
  const profitOnWin = Math.max(0, parseFloat((betAmount * (targetMultiplier - 1)).toFixed(4)));

  // Sync Target Multiplier -> Win Chance (Win Chance = 99 / Target)
  const handleTargetChange = (valStr: string) => {
    setTargetInput(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      const calculatedChance = 99 / val;
      setChanceInput(calculatedChance.toFixed(4));
    } else {
      setChanceInput('');
    }
  };

  // Format Target Multiplier on Blur to ensure at least 2 decimal places if needed
  const handleTargetBlur = () => {
    if (targetInput) {
      const val = parseFloat(targetInput);
      if (!isNaN(val)) {
        const parts = targetInput.split('.');
        if (parts.length === 1 || parts[1].length < 2) {
          setTargetInput(val.toFixed(2));
        }
      }
    }
  };

  // Sync Win Chance -> Target Multiplier (Target = 99 / Win Chance)
  const handleChanceChange = (valStr: string) => {
    setChanceInput(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      const calculatedTarget = 99 / val;
      setTargetInput(calculatedTarget.toFixed(4));
    } else {
      setTargetInput('');
    }
  };

  // Adjust Bet Amount (called by 1/2, 2x, Max buttons)
  const handleBetChange = (amount: number) => {
    const val = isNaN(amount) ? 0 : Math.max(0, parseFloat(amount.toFixed(2)));
    setBetAmount(val);
    setBetAmountInput(val === 0 ? '0.00' : val.toString());
  };

  // Direct text input for Bet Amount
  const handleBetInputDirect = (valStr: string) => {
    setBetAmountInput(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      setBetAmount(Math.max(0, parseFloat(val.toFixed(2))));
    } else {
      setBetAmount(0);
    }
  };

  // Format on blur
  const handleBetBlur = () => {
    if (betAmountInput) {
      const val = parseFloat(betAmountInput);
      if (!isNaN(val)) {
        setBetAmountInput(val.toFixed(2));
      } else {
        setBetAmountInput('0.00');
      }
    } else {
      setBetAmountInput('0.00');
    }
  };

  // Sync betAmount -> betAmountInput when programmatically changed (e.g., auto bet win/loss adjustments)
  useEffect(() => {
    const activeEl = document.activeElement;
    const isManualInputFocused = activeEl && activeEl.id === 'bet-amount-input-manual';
    const isAutoInputFocused = activeEl && activeEl.id === 'bet-amount-input-auto';
    
    if (!isManualInputFocused && !isAutoInputFocused) {
      setBetAmountInput(betAmount === 0 ? '0.00' : betAmount.toString());
    }
  }, [betAmount]);

  // Start single game bet
  const triggerBet = () => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }

    if (isPlaying) return;
    if (isTargetInvalid || isChanceInvalid) return;

    if (betAmount > 0 && betAmount < 0.01) {
      addNotification("Minimum bet is $0.01", "warning", 5000);
      return;
    }

    if (balance < betAmount) {
      addNotification("Aapka balance kam hai! Kripya deposit kijiye.", "warning", 5000);
      stopAutoBet('balance');
      return;
    }

    // Deduct bet amount
    onUpdateBalance(-betAmount);
    setIsPlaying(true);
    setGameResult(null);
    setCurrentMultiplier(1.00);
    if (!isAutoRunning) {
      playSound('click');
    }

    // 1. Generate multiplier using provably fair cryptographically secure distribution
    // Combine serverSeed, clientSeed, and totalBetsWithSeedPair (nonce)
    const combined = `${serverSeed}-${clientSeed}-${totalBetsWithSeedPair}`;
    const hash = sha256Sync(combined);
    // Take first 8 hex characters, convert to integer (max 4294967295)
    const hashVal = parseInt(hash.substring(0, 8), 16);
    const rand = hashVal / 4294967295;
    
    // Applying the 1% house edge mathematically
    const rawResult = 0.99 / (1 - rand * 0.99);
    const finalVal = parseFloat(Math.max(1.00, parseFloat(rawResult.toFixed(2))).toFixed(2));
    
    const isWin = finalVal >= targetMultiplier;

    // 2. Perform counts animation
    const hasAnimation = animationsEnabled;
    const isInstant = instantBet;

    if (!hasAnimation || (isInstant && !animationsEnabled)) {
      // Direct instant bet - show result immediately
      setCurrentMultiplier(finalVal);
      const finalResult = { win: isWin, finalVal };
      setGameResult(finalResult);
      setIsPlaying(false);

      // Sound effect
      playSound(isWin ? 'win' : 'lose');

      // Update balance if won
      if (isWin) {
        const payout = parseFloat((betAmount * targetMultiplier).toFixed(2));
        onUpdateBalance(payout);
      }

      // Add to history
      const currentUsername = typeof window !== 'undefined' ? (localStorage.getItem('damru_username') || 'Guest_Player') : 'Guest_Player';
      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

      setHistory((prev) => [
        { 
          id: Date.now().toString(), 
          multiplier: finalVal, 
          target: targetMultiplier, 
          win: isWin,
          betAmount: betAmount,
          clientSeed: clientSeed,
          serverSeed: serverSeed,
          serverSeedHash: serverSeedHash,
          nonce: totalBetsWithSeedPair,
          timestamp: formattedDate,
          username: currentUsername
        },
        ...prev.slice(0, 9),
      ]);

      // Record in Live Stats
      updateLiveStats(isWin, betAmount, targetMultiplier);

      // Process auto-bet parameters if auto is running
      if (isAutoRunning) {
        handlePostAutoBet(isWin);
      }
    } else {
      // Animation timing
      // "lekin agar player ne animation on kr ke instant bet lgaya hai to animation jaisa aa rha uska half time wala animation ayega"
      // Normal animation: 350ms, Instant+Animation: 10ms (adjusted for 2 bets per second speed)
      const duration = (isInstant && animationsEnabled) ? 10 : 350;
      const tickRate = (isInstant && animationsEnabled) ? 2 : 40;

      const startTime = performance.now();
      
      const tickInterval = setInterval(() => {
        if (!isAutoRunning) {
          playSound('tick');
        }
      }, tickRate);

      const animateMultiplier = (nowTime: number) => {
        const elapsed = nowTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        const easedProgress = Math.pow(progress, 3);
        const current = parseFloat((1.00 + (finalVal - 1.00) * easedProgress).toFixed(2));
        setCurrentMultiplier(current);

        if (progress < 1) {
          requestAnimationFrame(animateMultiplier);
        } else {
          clearInterval(tickInterval);
          setCurrentMultiplier(finalVal);
          
          const finalResult = { win: isWin, finalVal };
          setGameResult(finalResult);
          setIsPlaying(false);

          playSound(isWin ? 'win' : 'lose');

          if (isWin) {
            const payout = parseFloat((betAmount * targetMultiplier).toFixed(2));
            onUpdateBalance(payout);
          }

          const currentUsername = typeof window !== 'undefined' ? (localStorage.getItem('damru_username') || 'Guest_Player') : 'Guest_Player';
          const now = new Date();
          const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

          setHistory((prev) => [
            { 
              id: Date.now().toString(), 
              multiplier: finalVal, 
              target: targetMultiplier, 
              win: isWin,
              betAmount: betAmount,
              clientSeed: clientSeed,
              serverSeed: serverSeed,
              serverSeedHash: serverSeedHash,
              nonce: totalBetsWithSeedPair,
              timestamp: formattedDate,
              username: currentUsername
            },
            ...prev.slice(0, 9),
          ]);

          // Record in Live Stats
          updateLiveStats(isWin, betAmount, targetMultiplier);

          if (isAutoRunning) {
            handlePostAutoBet(isWin);
          }
        }
      };

      requestAnimationFrame(animateMultiplier);
    }
  };

  // Auto Bet State Controls
  const toggleAutoBet = () => {
    playSound('click');
    if (isAutoRunning) {
      stopAutoBet('manual');
    } else {
      if (!isLoggedIn) {
        onOpenAuth('login');
        return;
      }
      
      if (betAmount > 0 && betAmount < 0.01) {
        addNotification("Minimum bet is $0.01", "warning", 5000);
        return;
      }
      
      const parsed = parseInt(autoBetsCount, 10);
      const totalBets = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      
      initialBalanceRef.current = balance;
      initialBetAmountRef.current = betAmount;
      setAutoBetsRemaining(totalBets === 0 ? -1 : totalBets);
      setGameResult(null);
      setIsAutoRunning(true);
      addNotification("Auto Bet Started", "info", 5000);
    }
  };

  const stopAutoBet = (reason: 'manual' | 'complete' | 'profit' | 'loss' | 'balance' = 'manual') => {
    setIsAutoRunning(false);
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }
    
    if (reason === 'manual' || reason === 'complete') {
      addNotification("Auto Bet Finished", "success", 4000);
    }
  };

  // Run subsequent auto bets
  useEffect(() => {
    if (isAutoRunning && !isPlaying && !gameResult) {
      if (autoBetsRemaining === 0) {
        stopAutoBet('complete');
        return;
      }
      triggerBet();
    }
  }, [isAutoRunning, isPlaying, gameResult, autoBetsRemaining]);

  // Handle next step adjustments on Win or Loss for Auto Bet
  const handlePostAutoBet = (wasWin: boolean) => {
    if (!isAutoRunning) return;

    // 1. Adjust bet amount for next round if advanced options are enabled
    if (showAdvanced) {
      if (wasWin) {
        if (onWinAction.action === 'increase' && onWinAction.value > 0) {
          const nextBet = betAmount * (1 + onWinAction.value / 100);
          setBetAmount(parseFloat(nextBet.toFixed(2)));
        } else {
          setBetAmount(initialBetAmountRef.current);
        }
      } else {
        if (onLossAction.action === 'increase' && onLossAction.value > 0) {
          const nextBet = betAmount * (1 + onLossAction.value / 100);
          setBetAmount(parseFloat(nextBet.toFixed(2)));
        } else {
          setBetAmount(initialBetAmountRef.current);
        }
      }
    } else {
      // If advanced is turned off or not active, always revert to initial base bet
      setBetAmount(initialBetAmountRef.current);
    }

    // 2. Decrement remaining bets
    if (autoBetsRemaining > 0) {
      setAutoBetsRemaining((prev) => prev - 1);
    }

    // 3. Clear result after short delay to trigger next run loop (configured for exactly 0.60 seconds / 600ms per bet cycle)
    const animDuration = instantBet ? 0 : (animationsEnabled ? 350 : 0);
    const autoBreak = Math.max(50, 600 - animDuration);
    
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
    }

    autoRunTimerRef.current = setTimeout(() => {
      const currentRemaining = autoBetsRemainingRef.current;
      const currentBalance = balanceRef.current;

      // Check limits first before continuing
      if (showAdvancedRef.current && stopOnProfitRef.current && parseFloat(stopOnProfitRef.current) > 0) {
        const currentProfit = currentBalance - initialBalanceRef.current;
        if (currentProfit >= parseFloat(stopOnProfitRef.current)) {
          stopAutoBet('profit');
          addNotification(`Auto Bet finished! Target profit reached: +$${currentProfit.toFixed(2)}`, "success", 6000);
          return;
        }
      }

      if (showAdvancedRef.current && stopOnLossRef.current && parseFloat(stopOnLossRef.current) > 0) {
        const currentLoss = initialBalanceRef.current - currentBalance;
        if (currentLoss >= parseFloat(stopOnLossRef.current)) {
          stopAutoBet('loss');
          addNotification(`Auto Bet stopped! Stop-loss limit reached: -$${currentLoss.toFixed(2)}`, "warning", 6000);
          return;
        }
      }

      if (currentRemaining === 0) {
        stopAutoBet('complete');
        return;
      }

      // Clear result state to trigger the next bet automatically
      setGameResult(null);
    }, autoBreak);
  };

  // Cleanup auto timer on unmount
  useEffect(() => {
    return () => {
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, []);

  return (
    <div ref={gameContainerRef} className="w-full min-h-full flex flex-col gap-2 md:gap-2.5 select-none bg-bg-dark text-white p-1 justify-start relative">
      
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
                      ? 'bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand' 
                      : 'bg-[#222]/80 hover:bg-[#333]/80 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                  title="Click to view complete bet verification & details"
                >
                  {item.multiplier.toFixed(2)}x
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

      {/* 2. Main Game Arena Display - Large Multiplier */}
      <div className="relative w-full aspect-[3.6/1] sm:aspect-[4.2/1] min-h-[85px] bg-[#0c0e12] border border-white/5 rounded-xl overflow-hidden flex flex-col items-center justify-center p-2 shadow-xl">
        
        {/* Subtle grid background to look like Stake */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:20px_20px] pointer-events-none" />
        
        {/* Decorative ambient ring glow that reflects the game state */}
        <div className={`absolute w-80 h-10 rounded-full blur-[25px] opacity-20 transition-colors duration-500 pointer-events-none ${
          isPlaying 
            ? 'bg-accent-blue' 
            : gameResult?.win 
              ? 'bg-brand shadow-glow' 
              : gameResult && !gameResult.win 
                ? 'bg-rose-500' 
                : 'bg-white'
        }`} />

        {/* Dynamic Multiplier Value (Replicating exact Stake's text scale & animations) */}
        <motion.div 
          key={currentMultiplier}
          className="relative z-10 flex flex-col items-center"
        >
          <span className={`text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight select-all transition-all duration-75 ${
            isPlaying 
              ? 'text-white' 
              : gameResult?.win 
                ? 'text-brand drop-shadow-[0_0_20px_rgba(219,253,78,0.4)]' 
                : gameResult && !gameResult.win 
                  ? 'text-rose-500/80' 
                  : 'text-white'
          }`}>
            {currentMultiplier.toFixed(2)}<span className="text-xl sm:text-2xl font-bold ml-1">×</span>
          </span>
        </motion.div>
      </div>

      {/* 3. Inputs panel - Dual layout for Target Multiplier and Win Chance */}
      <div className="grid grid-cols-2 gap-2 bg-[#141414] p-1.5 rounded-xl border border-white/5">
        
        {/* Target Multiplier */}
        <div className="space-y-0.5 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Target</label>
            <span className="text-[9px] font-semibold text-gray-600 font-sans">Min: 1.01x</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              disabled={isPlaying || isAutoRunning}
              value={targetInput}
              onChange={(e) => handleTargetChange(e.target.value)}
              onBlur={handleTargetBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTargetBlur();
                  e.currentTarget.blur();
                }
              }}
              className={`w-full h-10 bg-[#1c1c1c] disabled:opacity-50 border text-[13.5px] font-display font-bold px-2 rounded-lg focus:outline-none transition-all pr-6 ${
                isTargetInvalid 
                  ? 'border-rose-500 text-rose-500 focus:border-rose-500/80' 
                  : 'border-white/5 hover:border-white/10 focus:border-brand/40 text-white'
              }`}
            />
            <span className={`absolute right-2.5 text-[13.5px] font-bold transition-colors ${isTargetInvalid ? 'text-rose-500' : 'text-gray-500'}`}>×</span>
          </div>
          {isTargetInvalid && (
            <p className="text-[11px] text-rose-500 font-black mt-0.5 leading-none">
              {targetMultiplier < 1.01 ? 'Min 1.01' : 'Max 1,000,000'}
            </p>
          )}
        </div>

        {/* Win Chance */}
        <div className="space-y-0.5 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Win Chance</label>
            <span className="text-[9px] font-semibold text-gray-600 font-sans">Edge: 1%</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              disabled={isPlaying || isAutoRunning}
              value={chanceInput}
              onChange={(e) => handleChanceChange(e.target.value)}
              className={`w-full h-10 bg-[#1c1c1c] disabled:opacity-50 border text-[13.5px] font-display font-bold px-2 rounded-lg focus:outline-none transition-all pr-6 ${
                isChanceInvalid 
                  ? 'border-rose-500 text-rose-500 focus:border-rose-500/80' 
                  : 'border-white/5 hover:border-white/10 focus:border-brand/40 text-white'
              }`}
            />
            <span className={`absolute right-2.5 text-[13.5px] font-bold transition-colors ${isChanceInvalid ? 'text-rose-500' : 'text-gray-500'}`}>%</span>
          </div>
          {isChanceInvalid && (
            <p className="text-[11px] text-rose-500 font-black mt-0.5 leading-none">
              {winChance < 0.000099 ? 'Min 0.0001' : 'Max 98.0198'}
            </p>
          )}
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
                betAmount > balance 
                  ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80' 
                  : (betAmount > 0 && betAmount < 0.01)
                  ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80'
                  : 'border-white/5'
              }`}>
                <input
                  id="bet-amount-input-manual"
                  type="number"
                  step="0.01"
                  min="0.00"
                  disabled={isPlaying}
                  value={betAmountInput}
                  onChange={(e) => handleBetInputDirect(e.target.value)}
                  onBlur={handleBetBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBetBlur();
                      e.currentTarget.blur();
                    }
                  }}
                  className="flex-1 bg-transparent text-[13.5px] font-display font-bold text-white focus:outline-none h-full pl-1.5 min-w-0"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isPlaying}
                    onClick={() => {
                      if (balance <= 0) {
                        handleBetChange(0);
                      } else {
                        handleBetChange(Math.max(0.01, Math.min(balance, betAmount < 0.01 ? 0.01 : betAmount / 2)));
                      }
                    }}
                    className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center"
                  >
                    ½
                  </button>
                  <button
                    type="button"
                    disabled={isPlaying}
                    onClick={() => {
                      if (balance <= 0) {
                        handleBetChange(0);
                      } else {
                        const current = betAmount < 0.01 ? 0.01 : betAmount;
                        handleBetChange(Math.max(0.01, Math.min(balance, current * 2)));
                      }
                    }}
                    className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center"
                  >
                    2×
                  </button>
                  {showMaxBet && (
                    <button
                      type="button"
                      disabled={isPlaying}
                      onClick={() => {
                        if (balance <= 0) {
                          handleBetChange(0);
                        } else {
                          handleBetChange(Math.max(0.01, balance));
                        }
                      }}
                      className="h-8 px-1.5 text-[10px] font-black bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand rounded transition disabled:opacity-40 flex items-center justify-center uppercase"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
              {betAmount > 0 && betAmount < 0.01 && (
                <p className="text-[9.5px] text-rose-500 font-bold mt-0.5 leading-none">
                  Minimum bet is $0.01
                </p>
              )}
            </div>

            {/* Profit On Win (Manual) */}
            <div className="flex flex-col gap-0.5 text-left w-full">
              <div className="flex items-center h-4">
                <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400 block">Profit on Win</label>
              </div>
              <div className="flex items-center h-10 bg-[#1c1c1c]/85 rounded-lg border border-white/5 overflow-hidden px-2.5">
                <span className="flex-1 text-[13.5px] font-display font-bold text-brand truncate">
                  ${profitOnWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
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
                betAmount > balance 
                  ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80' 
                  : (betAmount > 0 && betAmount < 0.01)
                  ? 'border-rose-500 text-rose-500 focus-within:border-rose-500/80'
                  : 'border-white/5'
              }`}>
                <input
                  id="bet-amount-input-auto"
                  type="number"
                  step="0.01"
                  min="0.00"
                  disabled={isAutoRunning}
                  value={betAmountInput}
                  onChange={(e) => handleBetInputDirect(e.target.value)}
                  onBlur={handleBetBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBetBlur();
                      e.currentTarget.blur();
                    }
                  }}
                  className="flex-1 bg-transparent text-[13.5px] font-display font-bold text-white focus:outline-none h-full pl-1.5 min-w-0"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isAutoRunning}
                    onClick={() => {
                      if (balance <= 0) {
                        handleBetChange(0);
                      } else {
                        handleBetChange(Math.max(0.01, Math.min(balance, betAmount < 0.01 ? 0.01 : betAmount / 2)));
                      }
                    }}
                    className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center"
                  >
                    ½
                  </button>
                  <button
                    type="button"
                    disabled={isAutoRunning}
                    onClick={() => {
                      if (balance <= 0) {
                        handleBetChange(0);
                      } else {
                        const current = betAmount < 0.01 ? 0.01 : betAmount;
                        handleBetChange(Math.max(0.01, Math.min(balance, current * 2)));
                      }
                    }}
                    className="h-8 px-2 text-[12px] font-black bg-[#222] hover:bg-[#2e2e2e] rounded transition disabled:opacity-40 flex items-center justify-center"
                  >
                    2×
                  </button>
                  {showMaxBet && (
                    <button
                      type="button"
                      disabled={isAutoRunning}
                      onClick={() => {
                        if (balance <= 0) {
                          handleBetChange(0);
                        } else {
                          handleBetChange(Math.max(0.01, balance));
                        }
                      }}
                      className="h-8 px-1.5 text-[10px] font-black bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand rounded transition disabled:opacity-40 flex items-center justify-center uppercase"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
              {betAmount > 0 && betAmount < 0.01 && (
                <p className="text-[9.5px] text-rose-500 font-bold mt-0.5 leading-none">
                  Minimum bet is $0.01
                </p>
              )}
            </div>

            {/* Number of Bets (Full Width in Auto Mode) */}
            <div className="space-y-0.5 text-left">
              <div className="flex items-center justify-between h-4">
                <label className="text-[10px] md:text-[11.5px] font-bold text-gray-400">Number of Bets</label>
                {isAutoRunning && (
                  <span className="text-[9.5px] text-[#dbfd4e] font-black animate-pulse font-sans">
                    Rem: {autoBetsRemaining === -1 ? '∞' : autoBetsRemaining}
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
            <div className="flex items-center justify-between pt-0.5 select-none">
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
                                : 'border-white/5 hover:border-white/10 focus:border-brand/30'
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

        {betAmount > balance && (
          <div className="text-left px-1">
            <p className="text-[12px] text-rose-500 font-black whitespace-nowrap leading-none mt-0.5">
              Can't bet more than your balance!
            </p>
          </div>
        )}
      </div>

      {/* 5. BIG BET / SUBMIT BUTTON - Vibrant Highlight styled with website's official colors */}
      <div>
        {betMode === 'manual' ? (
          <button
            type="button"
            disabled={isPlaying || isTargetInvalid || isChanceInvalid || (isLoggedIn && betAmount > balance)}
            onClick={triggerBet}
            className={`w-full h-11 px-4 rounded-xl font-display font-black text-[12px] md:text-[13px] uppercase tracking-widest transition-all duration-200 transform flex items-center justify-center ${
              isPlaying || isTargetInvalid || isChanceInvalid || (isLoggedIn && betAmount > balance)
                ? 'bg-[#1c1c1c] border border-white/5 text-gray-500 cursor-not-allowed scale-[0.98]' 
                : 'bg-brand hover:bg-[#cbe83d] text-black shadow-glow hover:shadow-[0_0_22px_rgba(219,253,78,0.6)] active:scale-[0.97]'
            }`}
          >
            {isPlaying ? 'Multiplier Crawling...' : 'Bet'}
          </button>
        ) : (
          <button
            type="button"
            disabled={isTargetInvalid || isChanceInvalid || (isLoggedIn && betAmount > balance)}
            onClick={toggleAutoBet}
            className={`w-full h-11 px-4 rounded-xl font-display font-black text-[12px] md:text-[13px] uppercase tracking-widest transition-all duration-200 transform ${
              isTargetInvalid || isChanceInvalid || (isLoggedIn && betAmount > balance)
                ? 'bg-[#1c1c1c] border border-white/5 text-gray-500 cursor-not-allowed scale-[0.98]'
                : isAutoRunning 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)]' 
                  : 'bg-brand hover:bg-[#cbe83d] text-black shadow-glow hover:shadow-[0_0_22px_rgba(219,253,78,0.6)]'
            } active:scale-[0.97] flex items-center justify-center gap-2`}
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

      {/* 6. Manual / Auto tab toggler at the bottom */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5 pb-1">
        <div className="bg-[#141414] border border-white/5 p-1 rounded-full flex w-full max-w-[240px]">
          <button
            type="button"
            disabled={isPlaying || isAutoRunning}
            onClick={() => setBetMode('manual')}
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
            onClick={() => setBetMode('auto')}
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

      {/* 6.5. Bottom Settings / Graph / Fairness Bar */}
      <div className="border-t border-white/5 mt-1 pt-2 px-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Settings Button with Relative Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2.5 rounded-lg border transition duration-150 flex items-center justify-center ${
                isSettingsOpen
                  ? 'bg-[#dbfd4e]/10 border-[#dbfd4e]/30 text-[#dbfd4e]'
                  : 'bg-[#141414] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
              title="Game Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: settingsPlacement === 'top' ? 8 : -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: settingsPlacement === 'top' ? 8 : -8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  className={`absolute ${
                    settingsPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                  } left-0 w-[130px] sm:w-[138px] h-auto bg-[#121212]/95 border border-white/10 rounded-xl p-2 shadow-2xl z-50 font-sans text-left flex flex-col gap-1.5`}
                  style={{ pointerEvents: 'auto' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 shrink-0">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-brand flex items-center gap-1">
                      <Settings className="w-3 h-3 text-brand" />
                      Settings
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="text-gray-400 hover:text-white p-0.5 hover:bg-white/5 rounded transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Settings Controls List */}
                  <div className="space-y-1 mt-0.5">
                    {/* 1. Instant Bet */}
                    <button
                      type="button"
                      onClick={() => setInstantBet(!instantBet)}
                      className="w-full flex items-center justify-between p-1 bg-[#0d0d0d] border border-white/5 rounded hover:border-white/10 transition cursor-pointer text-left focus:outline-none"
                    >
                      <div className="space-y-0.5 flex-1 pr-1">
                        <p className="text-[9px] font-bold text-white leading-none">Instant Bet</p>
                        <p className="text-[7px] text-gray-500 font-semibold leading-none">No slider delay.</p>
                      </div>
                      <span
                        className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition shrink-0 ${
                          instantBet 
                            ? 'bg-brand/10 border border-brand/20 text-brand' 
                            : 'bg-[#1c1c1c] border border-white/5 text-gray-400'
                        }`}
                      >
                        {instantBet ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* 2. Animations */}
                    <button
                      type="button"
                      onClick={() => setAnimationsEnabled(!animationsEnabled)}
                      className="w-full flex items-center justify-between p-1 bg-[#0d0d0d] border border-white/5 rounded hover:border-white/10 transition cursor-pointer text-left focus:outline-none"
                    >
                      <div className="space-y-0.5 flex-1 pr-1">
                        <p className="text-[9px] font-bold text-white leading-none">Animations</p>
                        <p className="text-[7px] text-gray-500 font-semibold leading-none">Half crawler speed.</p>
                      </div>
                      <span
                        className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition shrink-0 ${
                          animationsEnabled 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : 'bg-[#1c1c1c] border border-white/5 text-gray-400'
                        }`}
                      >
                        {animationsEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* 3. Max Bet */}
                    <button
                      type="button"
                      onClick={() => setShowMaxBet(!showMaxBet)}
                      className="w-full flex items-center justify-between p-1 bg-[#0d0d0d] border border-white/5 rounded hover:border-white/10 transition cursor-pointer text-left focus:outline-none"
                    >
                      <div className="space-y-0.5 flex-1 pr-1">
                        <p className="text-[9px] font-bold text-white leading-none">Max Bet</p>
                        <p className="text-[7px] text-gray-500 font-semibold leading-none">Shortcut button.</p>
                      </div>
                      <span
                        className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition shrink-0 ${
                          showMaxBet 
                            ? 'bg-brand/10 border border-brand/20 text-brand' 
                            : 'bg-[#1c1c1c] border border-white/5 text-gray-400'
                        }`}
                      >
                        {showMaxBet ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              setShowLiveStats(!showLiveStats);
            }}
            className={`p-2.5 rounded-lg border transition duration-150 flex items-center justify-center ${
              showLiveStats
                ? 'bg-[#dbfd4e]/10 border-[#dbfd4e]/30 text-[#dbfd4e]'
                : 'bg-[#141414] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
            }`}
            title="Live Stats Graph & Panel"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            setIsFairnessModalOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition duration-150 ${
            isFairnessModalOpen
              ? 'bg-[#dbfd4e]/10 border-[#dbfd4e]/30 text-[#dbfd4e]'
              : 'bg-[#141414] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Fairness
        </button>
      </div>

      {/* Footer tab panels */}
      <AnimatePresence mode="wait">
        {activeFooterTab && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="overflow-hidden mt-1 pb-4 shrink-0"
          >
            <div className="bg-[#121212] border border-white/5 rounded-xl p-4 text-left relative">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setActiveFooterTab(null);
                }}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>

              {activeFooterTab === 'graph' && (
                <div className="space-y-4">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-[#dbfd4e] flex items-center gap-2 border-b border-white/5 pb-2">
                    <BarChart2 className="w-4 h-4" />
                    Recent Bets Graph & Analytics
                  </h4>
                  {history.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs font-bold">
                      No bets placed yet in this session. Start playing to visualize results!
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {/* Simple visual custom SVG graph for the last 10 bets */}
                      <div className="h-28 w-full bg-[#0d0d0d] border border-white/5 rounded-lg p-3 flex flex-col justify-end relative overflow-hidden">
                        {/* Background guide lines */}
                        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                          <div className="border-b border-white/10 w-full h-0"></div>
                          <div className="border-b border-white/10 w-full h-0"></div>
                          <div className="border-b border-white/10 w-full h-0"></div>
                        </div>

                        {/* Bars representing multipliers of last bets */}
                        <div className="flex items-end justify-between gap-1 h-full z-10">
                          {[...history].reverse().slice(-10).map((item, idx) => {
                            // Calculate proportional height for visualization
                            const maxValInView = Math.max(...history.slice(0, 10).map(h => h.multiplier), 2.0);
                            const percent = Math.min(100, Math.max(12, (item.multiplier / maxValInView) * 100));
                            return (
                              <div 
                                key={item.id} 
                                onClick={() => {
                                  setSelectedBet(item);
                                  setIsBetDetailsModalOpen(true);
                                  playSound('click');
                                }}
                                className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer hover:opacity-85 hover:scale-105 active:scale-95 transition-all"
                                title="Click to view full bet verification & details"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 bg-black text-white text-[9px] font-bold py-1 px-1.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                  {item.multiplier.toFixed(2)}x ({item.win ? 'Win' : 'Loss'}) • Click for details
                                </div>
                                
                                <div 
                                  className={`w-full rounded-t transition-all duration-300 ${
                                    item.win 
                                      ? 'bg-[#dbfd4e]' 
                                      : 'bg-rose-500/60'
                                  }`}
                                  style={{ height: `${percent}%` }}
                                ></div>
                                <span className="text-[8px] text-gray-500 mt-1 font-mono">#{idx+1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stat summary boxes */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#0d0d0d] p-2.5 border border-white/5 rounded-lg text-center">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Bets</p>
                          <p className="text-xs font-display font-black text-white">{history.length}</p>
                        </div>
                        <div className="bg-[#0d0d0d] p-2.5 border border-white/5 rounded-lg text-center">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Wins</p>
                          <p className="text-xs font-display font-black text-[#dbfd4e]">
                            {history.filter(h => h.win).length}
                          </p>
                        </div>
                        <div className="bg-[#0d0d0d] p-2.5 border border-white/5 rounded-lg text-center">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Win Rate</p>
                          <p className="text-xs font-display font-black text-emerald-400">
                            {((history.filter(h => h.win).length / history.length) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}



            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6.8. Floating / Draggable Live Stats Panel */}
      <AnimatePresence>
        {showLiveStats && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.02}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-[9999] p-2.5 w-[180px] h-[280px] text-white flex flex-col gap-2 font-sans select-none"
            style={{ 
              top: '15%', 
              right: '20px',
              touchAction: 'none'
            }}
          >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between cursor-move pb-1 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-brand" />
                <span className="font-display font-black text-[11px] tracking-wide text-white">Live Stats</span>
                <ChevronDown className="w-2.5 h-2.5 text-gray-500 hover:text-white transition cursor-pointer" />
              </div>
              <button 
                type="button"
                onClick={() => {
                  playSound('click');
                  setShowLiveStats(false);
                }}
                className="text-gray-400 hover:text-white p-0.5 hover:bg-white/5 rounded transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Controls bar: Bets, All selection dropdowns & Reset button */}
            <div className="flex items-center justify-between gap-1 text-[9.5px] shrink-0">
              <div className="flex items-center gap-1 flex-1">
                {/* Bets Dropdown */}
                <div className="bg-[#1c1c1c] px-1.5 py-0.5 rounded border border-white/5 text-gray-300 font-bold flex items-center justify-between gap-1 cursor-pointer select-none hover:bg-[#222] transition">
                  <span>Bets</span>
                  <ChevronDown className="w-2 h-2 text-gray-500" />
                </div>
                {/* All Dropdown */}
                <div className="bg-[#1c1c1c] px-1.5 py-0.5 rounded border border-white/5 text-gray-300 font-bold flex items-center justify-between gap-1 cursor-pointer select-none hover:bg-[#222] transition">
                  <span>All</span>
                  <ChevronDown className="w-2 h-2 text-gray-500" />
                </div>
              </div>
              
              {/* Reset stats button */}
              <button
                type="button"
                onClick={resetLiveStats}
                className="p-1 bg-[#1c1c1c] hover:bg-[#222] border border-white/5 hover:border-white/10 rounded transition flex items-center justify-center text-gray-400 hover:text-white"
                title="Reset Stats"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Stats figures grid (Wagered, Profit, Wins, Losses) */}
            <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-2 grid grid-cols-[7fr_3fr] gap-x-2 gap-y-1.5 shrink-0">
              {/* Left Column (Profit, Wagered) */}
              <div className="space-y-1.5 pr-1 border-r border-white/5">
                <div className="space-y-0.5">
                  <p className="text-[7.5px] text-gray-500 font-black uppercase tracking-wider">Profit</p>
                  <p className={`text-[8.5px] font-black tracking-wide flex items-center gap-0.5 flex-wrap ${
                    liveStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {liveStats.profit >= 0 ? '+' : ''}${Math.abs(liveStats.profit).toFixed(2)}
                    <TetherIcon size="small" />
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[7.5px] text-gray-500 font-black uppercase tracking-wider">Wagered</p>
                  <p className="text-[8.5px] font-black tracking-wide text-white flex items-center gap-0.5 flex-wrap">
                    ${liveStats.wagered.toFixed(2)}
                    <TetherIcon size="small" />
                  </p>
                </div>
              </div>

              {/* Right Column (Wins, Losses) */}
              <div className="space-y-1.5 pl-1 flex flex-col justify-between">
                <div className="space-y-0.5">
                  <p className="text-[7.5px] text-gray-500 font-black uppercase tracking-wider">Wins</p>
                  <p className="text-[10px] font-black text-emerald-400 font-display">
                    {liveStats.wins}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[7.5px] text-gray-500 font-black uppercase tracking-wider">Losses</p>
                  <p className="text-[10px] font-black text-rose-400 font-display">
                    {liveStats.losses}
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Graph Area */}
            <div className="flex-1 min-h-[70px] w-full bg-[#0d0d0d] border border-white/5 rounded-lg p-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="text-[7.5px] font-bold text-gray-500 uppercase tracking-wider select-none shrink-0 mb-0.5">
                Performance Graph
              </div>
              <div className="w-full flex-1 relative min-h-[45px]">
                {/* Responsive SVG Graph */}
                {liveStats.history.length <= 1 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-500 font-bold font-sans">
                    No bets recorded
                  </div>
                ) : (
                  (() => {
                    const points = liveStats.history;
                    const width = 156;
                    const height = 70;
                    
                    const min = Math.min(0, ...points) - 0.5;
                    const max = Math.max(0, ...points) + 0.5;
                    const range = Math.max(1, max - min);
                    
                    const getX = (index: number) => {
                      if (points.length <= 1) return width / 2;
                      return (index / (points.length - 1)) * width;
                    };
                    
                    const getY = (val: number) => {
                      return height - ((val - min) / range) * height;
                    };
                    
                    const zeroY = getY(0);
                    
                    // Generate SVG path points
                    const linePath = points.map((val, idx) => {
                      const x = getX(idx);
                      const y = getY(val);
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(" ");
                    
                    const latestValue = points[points.length - 1] || 0;
                    const themeColor = latestValue >= 0 ? '#10b981' : '#f43f5e';
                    
                    // Generate closed fill path to the bottom (or zeroY)
                    const firstX = getX(0);
                    const lastX = getX(points.length - 1);
                    const fillPath = `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;
                    
                    return (
                      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible select-none pointer-events-none absolute inset-0">
                        <defs>
                          <linearGradient id="win-grad-stats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="loss-grad-stats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Zero baseline */}
                        <line 
                          x1={0} 
                          y1={zeroY} 
                          x2={width} 
                          y2={zeroY} 
                          stroke="rgba(255, 255, 255, 0.08)" 
                          strokeDasharray="2 2" 
                          strokeWidth="1" 
                        />
                        
                        {/* Gradient Area Fill */}
                        <path 
                          d={fillPath} 
                          fill={`url(#${latestValue >= 0 ? 'win-grad-stats' : 'loss-grad-stats'})`} 
                        />
                        
                        {/* The line itself */}
                        <path 
                          d={linePath} 
                          fill="none" 
                          stroke={themeColor} 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        
                        {/* Latest point circle */}
                        <circle 
                          cx={getX(points.length - 1)} 
                          cy={getY(latestValue)} 
                          r="2" 
                          fill={themeColor} 
                        />
                      </svg>
                    );
                  })()
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provably Fair Fullscreen Modal */}
      <AnimatePresence>
        {isFairnessModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#070708]/95 backdrop-blur-xl z-[50] flex items-center justify-center p-2 sm:p-4 font-sans overflow-hidden select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-2xl h-[95%] max-h-full flex flex-col shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#dbfd4e]/10 flex items-center justify-center text-[#dbfd4e] border border-[#dbfd4e]/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[16px] sm:text-[18px] font-black uppercase tracking-wider text-white">Fairness</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setIsFairnessModalOpen(false);
                  }}
                  className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-6 pt-4 shrink-0 select-none">
                <div className="grid grid-cols-3 gap-2 bg-[#141416] p-1 rounded-xl border border-white/5">
                  {(['overview', 'seeds', 'verify'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setFairnessTab(tab);
                      }}
                      className={`py-2 px-3 rounded-lg text-[10.5px] font-sans font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        fairnessTab === tab
                          ? 'bg-[#dbfd4e] text-black shadow-md shadow-[#dbfd4e]/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 text-left select-text">
                
                {fairnessTab === 'overview' && (
                  <div className="space-y-4 select-none">
                    <div className="bg-[#141417] border border-white/5 rounded-xl p-4 space-y-2 select-none">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[#dbfd4e] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> How Fairness Works
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Our games operate on a <strong className="text-white">provably fair system</strong>, meaning we can mathematically prove that the outcome of every single bet was pre-determined and completely unbiased. We cannot change the outcome after you click play.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#09090b] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#dbfd4e]/70">01. Client Seed</span>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          A custom keyword or phrase generated by your browser (or entered by you) which adds unpredictable randomness from your side.
                        </p>
                      </div>

                      <div className="bg-[#09090b] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#dbfd4e]/70">02. Server Seed</span>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          A secret, random seed created by our server. We show you its SHA-256 hash in advance, so you know we haven't tampered with it.
                        </p>
                      </div>

                      <div className="bg-[#09090b] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#dbfd4e]/70">03. Nonce (Bet Count)</span>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          An incremental counter that starts at 0 for every seed pair and increases by 1 with each game. It makes every round unique.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0c0c0e] border border-white/5 rounded-xl p-4 space-y-2">
                      <h5 className="text-[10.5px] font-black uppercase tracking-wider text-white">Verification Equation</h5>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        To calculate the multiplier, we concatenate the server seed, client seed, and nonce:
                      </p>
                      <div className="bg-[#050506] p-2.5 rounded-lg border border-white/5 text-center font-mono text-[10.5px] text-[#dbfd4e] break-all">
                        SHA-256( Server_Seed - Client_Seed - Nonce )
                      </div>
                      <p className="text-[9.5px] text-gray-500 leading-relaxed">
                        We convert the resulting hash bytes into a randomized float percentage, which we divide into our game parameters to generate a fully verifiable outcome with a transparent 1% house edge.
                      </p>
                    </div>
                  </div>
                )}

                {fairnessTab === 'seeds' && (
                  <div className="space-y-4">
                    {/* Active Seeds Section */}
                    <div className="bg-[#09090b] border border-white/5 rounded-xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-white select-none">Active Seed Pair</h4>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[7.5px] font-black uppercase">In Use</span>
                      </div>

                      {/* Client Seed */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 select-none">Active Client Seed</span>
                        <div className="flex items-center gap-2">
                          <p className="text-[11.5px] font-mono font-bold text-white break-all flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                            {clientSeed}
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(clientSeed, "Client Seed")}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                            title="Copy Seed"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Server Seed Hashed */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 select-none">Active Server Seed (Hashed)</span>
                        <div className="flex items-center gap-2">
                          <p className="text-[10.5px] font-mono text-white break-all flex-1 bg-white/5 p-2 rounded-lg border border-white/5">
                            {serverSeedHash}
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(serverSeedHash, "Server Seed Hash")}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                            title="Copy Hash"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Nonce */}
                      <div className="flex items-center justify-between pt-1 select-none">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Total Bets Made With Pair (Nonce)</span>
                          <p className="text-[9.5px] text-gray-400">Increments by 1 with each game played</p>
                        </div>
                        <span className="px-3 py-1 bg-white/5 border border-white/5 text-white font-mono font-black rounded-lg text-sm">
                          {totalBetsWithSeedPair}
                        </span>
                      </div>
                    </div>

                    {/* Customize Client Seed */}
                    <div className="bg-[#09090b] border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="space-y-1 select-none">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Change Client Seed</h4>
                        <p className="text-[9.5px] text-gray-400">Enter a custom word or phrase to seed your future rolls manually.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newClientSeedInput}
                          onChange={(e) => setNewClientSeedInput(e.target.value)}
                          placeholder="Type custom client seed phrase..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#dbfd4e]/30 placeholder-gray-600 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            changeClientSeed();
                          }}
                          className="bg-[#dbfd4e] hover:bg-[#dbfd4e]/90 text-black px-4 py-2 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition shrink-0 cursor-pointer w-full sm:w-auto text-center justify-center flex items-center"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Rotate Seed Button */}
                    <div className="bg-[#09090b] border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="space-y-1 select-none">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Rotate Seed Pair</h4>
                        <p className="text-[9.5px] text-gray-400">This automatically reveals your current unhashed Server Seed and generates a new pair so you can run verifications.</p>
                      </div>
                      <button
                        type="button"
                        onClick={rotateSeedPair}
                        className="w-full flex items-center justify-center gap-1.5 xs:gap-2 bg-[#dbfd4e]/10 hover:bg-[#dbfd4e]/20 border border-[#dbfd4e]/20 text-[#dbfd4e] hover:text-white py-2.5 px-2 xs:px-4 rounded-xl font-sans font-black text-[10px] xs:text-[11px] sm:text-xs uppercase tracking-wider transition duration-150 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                        <span>Rotate & Reveal Current Seeds</span>
                      </button>

                      {/* REVEALED PREVIOUS SEED */}
                      {previousServerSeed && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 pt-3 border-t border-white/5 space-y-2.5"
                        >
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[9.5px] font-black uppercase tracking-wider select-none">
                            <Check className="w-4 h-4 shrink-0" />
                            Previous Seed Pair Revealed!
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg space-y-1">
                              <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider select-none">Revealed Previous Server Seed (Unhashed)</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white break-all flex-1">{previousServerSeed}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(previousServerSeed, "Previous Server Seed")}
                                  className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-2.5 rounded-lg space-y-1">
                              <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider select-none">Previous Server Seed Hash</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-gray-400 break-all flex-1">{previousServerSeedHash}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(previousServerSeedHash, "Previous Server Seed Hash")}
                                  className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-2 px-3 rounded-lg flex justify-between items-center font-sans text-[10px]">
                              <span className="text-gray-400 font-bold uppercase tracking-wider select-none">Previous Client Seed</span>
                              <span className="text-white font-mono font-bold">{previousClientSeed}</span>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-2 px-3 rounded-lg flex justify-between items-center font-sans text-[10px]">
                              <span className="text-gray-400 font-bold uppercase tracking-wider select-none">Final Nonce Reached</span>
                              <span className="text-[#dbfd4e] font-display font-black select-none">{previousNonce} bets</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Next server seed commit */}
                    <div className="bg-[#09090b] border border-white/5 rounded-xl p-4 space-y-2 select-none">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-500">Future Commitment Hash</span>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Next Server Seed (Hashed)</h4>
                      <p className="text-[9.5px] text-gray-400 leading-relaxed">
                        This is the pre-committed hash of the next server seed. Since this is shown to you now, you can verify it on your next rotation to ensure it was predetermined.
                      </p>
                      <p className="text-[9.5px] font-mono text-gray-400 break-all bg-white/5 p-2 rounded-lg border border-white/5 animate-pulse">
                        {nextServerSeedHash}
                      </p>
                    </div>
                  </div>
                )}

                {fairnessTab === 'verify' && (
                  <div className="space-y-4">
                    <div className="bg-[#0f0f11] border border-[#dbfd4e]/25 rounded-xl p-4 space-y-4 shadow-lg shadow-[#dbfd4e]/5">
                      <div className="border-b border-white/5 pb-2 select-none">
                        <h4 className="text-[11.5px] font-black uppercase tracking-wider text-[#dbfd4e] flex items-center gap-1.5">
                          <Zap className="w-4 h-4" /> Game Verifier Tool
                        </h4>
                        <p className="text-[9.5px] text-gray-400 mt-1">Paste details of any past roll below to mathematically verify its fair outcome.</p>
                      </div>

                      {verifyError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10.5px] px-3 py-2 rounded-xl font-medium flex items-center gap-2 select-none animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>{verifyError}</span>
                        </div>
                      )}

                      <div className="space-y-3.5 text-xs">
                        {/* Game Selection Selector */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider select-none">Choose Game</label>
                          <div className="relative">
                            <select
                              className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-[#dbfd4e]/30 cursor-pointer appearance-none"
                              defaultValue="limbo"
                            >
                              <option value="limbo">Limbo (Multiplier Game)</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Client Seed Input */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider select-none">Client Seed</label>
                          <input
                            type="text"
                            value={verifyClientSeed}
                            onChange={(e) => {
                              setVerifyClientSeed(e.target.value);
                              if (verifyError?.includes("Client Seed")) setVerifyError(null);
                            }}
                            placeholder="Enter previous client seed phrase..."
                            className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#dbfd4e]/30"
                          />
                        </div>

                        {/* Unhashed Server Seed */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider select-none">Server Seed (Unhashed)</label>
                          <input
                            type="text"
                            value={verifyServerSeed}
                            onChange={(e) => {
                              setVerifyServerSeed(e.target.value);
                              if (verifyError?.includes("Server Seed")) setVerifyError(null);
                            }}
                            placeholder="Enter previous unhashed server seed hex..."
                            className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#dbfd4e]/30"
                          />
                        </div>

                        {/* Nonce (Bet count) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider select-none">Nonce (Bet Count)</label>
                            <input
                              type="number"
                              value={verifyNonce}
                              onChange={(e) => setVerifyNonce(e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#dbfd4e]/30"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerify}
                            className="w-full bg-[#dbfd4e] hover:bg-[#dbfd4e]/90 text-black py-2 rounded-xl font-sans font-black uppercase tracking-wider text-[11px] transition duration-150 shadow-md shadow-[#dbfd4e]/10 active:scale-[0.98] cursor-pointer"
                          >
                            Verify Roll
                          </button>
                        </div>

                        {/* Output Result */}
                        {calculatedResult !== null && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 text-center space-y-1 select-none"
                          >
                            <p className="text-[9.5px] font-black uppercase text-emerald-400 tracking-wider">Verified Multiplier Result</p>
                            <p className="text-3xl font-display font-black text-white leading-none">
                              {calculatedResult.toFixed(2)}x
                            </p>
                            <p className="text-[9.5px] text-gray-400 mt-1 italic">
                              Matches the mathematical distribution with standard 1% House Edge.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="bg-[#0c0c0e] border-t border-white/5 p-4 text-center shrink-0 rounded-b-2xl select-none">
                <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">
                  Verified Provably Fair Protocol • House Edge 1.00%
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Details Modal */}
      <AnimatePresence>
        {isBetDetailsModalOpen && selectedBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#070708]/90 backdrop-blur-md z-[55] flex items-center justify-center p-2 font-sans overflow-y-auto select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col overflow-hidden my-auto max-h-[95%]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0c0c0e]">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#dbfd4e]" />
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">
                      Bet Verification Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setIsBetDetailsModalOpen(false);
                    }}
                    className="p-1 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                  
                  {/* Visual Outcome Banner */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
                    selectedBet.win 
                      ? 'bg-brand/5 border-brand/20 text-brand' 
                      : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                  }`}>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Limbo Outcome</span>
                      <p className="text-3xl font-display font-black leading-none text-white">
                        {selectedBet.multiplier.toFixed(2)}x
                      </p>
                      <p className="text-[10px] font-medium opacity-80">
                        Target was <span className="font-bold">{selectedBet.target.toFixed(2)}x</span>
                      </p>
                    </div>

                    <div className="bg-[#09090b]/80 border border-white/5 px-4 py-2.5 rounded-lg flex flex-col items-center justify-center min-w-[120px]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Payout</span>
                      <p className={`text-base font-display font-black ${selectedBet.win ? 'text-brand' : 'text-gray-400'}`}>
                        {selectedBet.win 
                          ? `+$${((selectedBet.betAmount ?? 0) * selectedBet.target).toFixed(2)}` 
                          : '$0.00'
                        }
                      </p>
                      <p className="text-[9px] text-gray-600 font-mono">
                        Bet: ${selectedBet.betAmount?.toFixed(2) ?? "0.00"} USDT
                      </p>
                    </div>
                  </div>

                  {/* Bet Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#09090b] border border-white/5 p-3 rounded-xl">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-500">Player</span>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">
                        {selectedBet.username || "Guest_Player"}
                      </p>
                    </div>

                    <div className="bg-[#09090b] border border-white/5 p-3 rounded-xl">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-500">Date & Time</span>
                      <p className="text-[10.5px] font-mono text-gray-300 mt-0.5 truncate">
                        {selectedBet.timestamp || "2026-06-30 07:00:00"}
                      </p>
                    </div>

                    <div className="bg-[#09090b] border border-white/5 p-3 rounded-xl">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-500">Bet Reference ID</span>
                      <p className="text-[10.5px] font-mono text-gray-300 mt-0.5 truncate">
                        #{selectedBet.id}
                      </p>
                    </div>

                    <div className="bg-[#09090b] border border-white/5 p-3 rounded-xl">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-500">Nonce (Bet Order)</span>
                      <p className="text-xs font-bold text-white mt-0.5 font-mono">
                        {selectedBet.nonce ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Provably Fair Seeds Section */}
                  <div className="bg-[#09090b] border border-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-white/5 select-none">
                      <Shield className="w-3.5 h-3.5 text-[#dbfd4e]" />
                      <h4 className="text-[10.5px] font-black uppercase tracking-wider text-white">Provably Fair Seeds</h4>
                    </div>

                    {/* Client Seed */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-[8.5px] font-bold uppercase text-gray-500">Client Seed</span>
                        <span className="text-[8.5px] text-gray-600 font-mono">Set by Player</span>
                      </div>
                      <div className="flex gap-1.5 items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                        <p className="text-[10.5px] font-mono font-medium text-gray-300 break-all flex-1 min-w-0">
                          {selectedBet.clientSeed || "limbo_client_seed_77852a3fc291"}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBet.clientSeed || "limbo_client_seed_77852a3fc291", "Client Seed")}
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
                        <span className="text-[8.5px] font-bold uppercase text-gray-500">Server Seed (Hashed)</span>
                        <span className="text-[8.5px] text-gray-600 font-mono">SHA256 Encrypted</span>
                      </div>
                      <div className="flex gap-1.5 items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                        <p className="text-[10.5px] font-mono font-medium text-gray-400 break-all flex-1 min-w-0">
                          {selectedBet.serverSeedHash || "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63"}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBet.serverSeedHash || "89a647d969abec71a0e8bbef0dcfe025e68335b8e99351e06fd82c0b29c9ef63", "Server Seed Hash")}
                          className="text-gray-400 hover:text-white shrink-0 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="bg-[#0c0c0e] border-t border-white/5 p-4 text-center shrink-0 select-none">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    Crypto-verifier • 100% Provably Fair Verified
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Scroll spacer to prevent any content from being obscured or cropped at the bottom */}
      <div className="h-2 shrink-0 w-full md:hidden" />
      <div className="h-12 shrink-0 w-full hidden md:block" />

      {/* 7. Floating Elegant Notifications */}
      <div className="fixed top-20 left-4 md:left-6 z-[9999] flex flex-col gap-2 pointer-events-none items-start w-full max-w-[320px] md:max-w-sm px-4 md:px-0">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl shadow-black/40 backdrop-blur-md pointer-events-auto font-sans font-semibold text-[13.5px] tracking-wide w-full ${
                notif.type === 'success'
                  ? 'bg-[#1e2e1e]/90 border-emerald-500/30 text-emerald-400'
                  : notif.type === 'warning'
                  ? 'bg-[#2a1b1b]/90 border-rose-500/30 text-rose-400'
                  : 'bg-[#1b232a]/90 border-[#dbfd4e]/30 text-[#dbfd4e]'
              }`}
            >
              {notif.type === 'success' && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black shrink-0">
                  ✓
                </span>
              )}
              {notif.type === 'warning' && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black shrink-0">
                  ✕
                </span>
              )}
              {notif.type === 'info' && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#dbfd4e]/10 text-[#dbfd4e] border border-[#dbfd4e]/20 text-[10px] font-black shrink-0">
                  ℹ
                </span>
              )}
              <span className="flex-1 text-left leading-normal">{notif.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
