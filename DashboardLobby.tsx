import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Trophy, Flame, Search, Play, ArrowRight, Star, Heart, HelpCircle, Gamepad2, ChevronLeft, ChevronRight, Coins, TrendingUp, Check, X, Clock, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ActiveGameType } from '../types';

interface DashboardLobbyProps {
  onPlayGame: (game: ActiveGameType) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onViewAllOriginals?: () => void;
  userBalance?: number;
  onUpdateBalance?: (amount: number) => void;
}

interface NewGameCard {
  id: string;
  name: string;
  provider: string;
  themeColor: string;
  mappedGameId: ActiveGameType;
  illustration: React.ReactNode;
}

interface PlacedPrediction {
  id: string;
  marketId: string;
  title: string;
  outcome: 'YES' | 'NO';
  amount: number;
  price: number;
  potentialPayout: number;
  placedAt: string;
  resolved?: boolean;
  result?: 'WON' | 'LOST';
}

export default function DashboardLobby({ onPlayGame, isLoggedIn, onOpenAuth, onViewAllOriginals, userBalance = 0, onUpdateBalance }: DashboardLobbyProps) {
  const [activeTab, setActiveTab] = useState<'lobby' | 'originals' | 'matka' | 'predict'>('lobby');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Satta Matka Game States
  const [betType, setBetType] = useState<'single' | 'jodi' | 'panna'>('single');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [matkaWager, setMatkaWager] = useState<string>('100');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<{
    openPanna: string;
    openAnk: number;
    closeAnk: number;
    closePanna: string;
    jodi: string;
    resultString: string;
  } | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [matkaHistory, setMatkaHistory] = useState<string[]>(['45', '12', '78', '90', '23']);
  const [matkaError, setMatkaError] = useState<string>('');

  // Predict Market States
  const [selectedMarketId, setSelectedMarketId] = useState<string>('m1');
  const [predictOutcome, setPredictOutcome] = useState<'YES' | 'NO'>('YES');
  const [predictWager, setPredictWager] = useState<string>('100');
  const [predictError, setPredictError] = useState<string>('');
  const [predictSuccess, setPredictSuccess] = useState<string>('');
  const [myPredictions, setMyPredictions] = useState<PlacedPrediction[]>([]);

  const initialMarkets = [
    {
      id: 'm1',
      category: 'Crypto',
      title: 'Will Bitcoin price cross $120,000 before the end of this month?',
      volume: '$1.4M',
      yesPrice: 58,
      resolverDate: 'Jul 31, 2026',
      badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    },
    {
      id: 'm2',
      category: 'Tech / AI',
      title: 'Will Google release a fully autonomous Gemini coding agent this quarter?',
      volume: '$840K',
      yesPrice: 72,
      resolverDate: 'Sep 30, 2026',
      badgeColor: 'bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]',
    },
    {
      id: 'm3',
      category: 'Space',
      title: 'Will SpaceX successfully land the Starship booster on Flight 6?',
      volume: '$2.1M',
      yesPrice: 84,
      resolverDate: 'Jul 15, 2026',
      badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    },
    {
      id: 'm4',
      category: 'Sports',
      title: 'Will India win the World Test Championship finals next month?',
      volume: '$620K',
      yesPrice: 47,
      resolverDate: 'Jul 24, 2026',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
  ];

  const [markets, setMarkets] = useState(initialMarkets);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollOriginals = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const playMatkaRound = () => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }
    
    const betAmount = parseInt(matkaWager);
    if (isNaN(betAmount) || betAmount <= 0) {
      setMatkaError("Please enter a valid bet amount.");
      return;
    }
    
    if (userBalance < betAmount) {
      setMatkaError("Insufficient balance! Please claim free funds in the wallet.");
      return;
    }
    
    if (!selectedNumber || selectedNumber.trim() === '') {
      setMatkaError("Please select or enter your prediction first.");
      return;
    }

    if (betType === 'single') {
      if (!/^[0-9]$/.test(selectedNumber)) {
        setMatkaError("Single Ank prediction must be a single digit (0-9).");
        return;
      }
    } else if (betType === 'jodi') {
      if (!/^[0-9]{2}$/.test(selectedNumber)) {
        setMatkaError("Jodi prediction must be a 2-digit number (00-99).");
        return;
      }
    } else if (betType === 'panna') {
      if (!/^[0-9]{3}$/.test(selectedNumber)) {
        setMatkaError("Panna prediction must be a 3-digit number (000-999).");
        return;
      }
    }

    setMatkaError('');
    setIsShaking(true);
    setGameResult(null);
    setHasWon(null);

    // Deduct bet amount
    if (onUpdateBalance) {
      onUpdateBalance(-betAmount);
    }

    setTimeout(() => {
      // 1. Generate Open Panna (3 numbers, sorted ascending)
      const openDigits = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ].sort((a, b) => a - b);
      const openPannaStr = openDigits.join('');
      const openAnkVal = openDigits.reduce((s, d) => s + d, 0) % 10;

      // 2. Generate Close Panna (3 numbers, sorted ascending)
      const closeDigits = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ].sort((a, b) => a - b);
      const closePannaStr = closeDigits.join('');
      const closeAnkVal = closeDigits.reduce((s, d) => s + d, 0) % 10;

      const jodiStr = `${openAnkVal}${closeAnkVal}`;
      const fullResultStr = `${openPannaStr}-${jodiStr}-${closePannaStr}`;

      let won = false;
      let multiplier = 0;

      if (betType === 'single') {
        const pNum = parseInt(selectedNumber);
        won = (pNum === openAnkVal || pNum === closeAnkVal);
        multiplier = 9;
      } else if (betType === 'jodi') {
        won = (selectedNumber === jodiStr);
        multiplier = 90;
      } else if (betType === 'panna') {
        won = (selectedNumber === openPannaStr || selectedNumber === closePannaStr);
        multiplier = 140;
      }

      const winnings = won ? betAmount * multiplier : 0;

      setGameResult({
        openPanna: openPannaStr,
        openAnk: openAnkVal,
        closeAnk: closeAnkVal,
        closePanna: closePannaStr,
        jodi: jodiStr,
        resultString: fullResultStr
      });

      setHasWon(won);
      setPayoutAmount(winnings);
      setIsShaking(false);

      if (won && onUpdateBalance) {
        onUpdateBalance(winnings);
      }

      setMatkaHistory(prev => [jodiStr, ...prev.slice(0, 7)]);
    }, 1800);
  };

  const placePrediction = () => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }
    const amount = parseInt(predictWager);
    if (isNaN(amount) || amount <= 0) {
      setPredictError("Please enter a valid amount.");
      setPredictSuccess('');
      return;
    }
    if (userBalance < amount) {
      setPredictError("Insufficient balance! Claim free funds in your wallet.");
      setPredictSuccess('');
      return;
    }
    const currentMarket = markets.find(m => m.id === selectedMarketId);
    if (!currentMarket) {
      setPredictError("Please select an active market.");
      setPredictSuccess('');
      return;
    }

    const price = predictOutcome === 'YES' ? currentMarket.yesPrice : (100 - currentMarket.yesPrice);
    const shares = amount / (price / 100);
    const potentialPayout = Math.round(shares);

    const newPrediction: PlacedPrediction = {
      id: 'p-' + Date.now(),
      marketId: selectedMarketId,
      title: currentMarket.title,
      outcome: predictOutcome,
      amount: amount,
      price: price,
      potentialPayout: potentialPayout,
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (onUpdateBalance) {
      onUpdateBalance(-amount);
    }

    setMyPredictions(prev => [newPrediction, ...prev]);
    setPredictError('');
    setPredictSuccess(`Successfully placed $${amount} prediction on "${predictOutcome}"!`);
    
    setTimeout(() => setPredictSuccess(''), 4000);
  };

  const resolveMarketPrediction = (marketId: string) => {
    const outcomeResult: 'YES' | 'NO' = Math.random() > 0.5 ? 'YES' : 'NO';
    let totalWinnings = 0;
    let updatedCount = 0;

    const updatedPredictions = myPredictions.map(pred => {
      if (pred.marketId === marketId && !pred.resolved) {
        const isWin = pred.outcome === outcomeResult;
        updatedCount++;
        if (isWin) {
          totalWinnings += pred.potentialPayout;
        }
        return {
          ...pred,
          resolved: true,
          result: isWin ? 'WON' as const : 'LOST' as const,
        };
      }
      return pred;
    });

    if (updatedCount === 0) {
      setPredictError("You don't have any unresolved predictions placed in this market.");
      return;
    }

    if (totalWinnings > 0 && onUpdateBalance) {
      onUpdateBalance(totalWinnings);
    }

    setMyPredictions(updatedPredictions);
    setPredictSuccess(`Market Settle: The official outcome is ${outcomeResult}! You had ${updatedCount} bet(s). Earned $${totalWinnings.toLocaleString()} total!`);
    setTimeout(() => setPredictSuccess(''), 5000);
  };

  const newGames: NewGameCard[] = [
    {
      id: 'g1',
      name: 'CHARGE BUFFALO',
      provider: 'TaDa Gaming',
      themeColor: '#f97316', // Orange
      mappedGameId: 'limbo',
      illustration: (
        <svg viewBox="0 0 240 320" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="buffalo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
            <radialGradient id="buffalo-eye-glow" cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Background */}
          <rect width="240" height="320" fill="url(#buffalo-bg)" />
          {/* Sun background element */}
          <circle cx="120" cy="120" r="75" fill="#facc15" fillOpacity="0.15" />
          
          {/* Buffalo Horns */}
          <path d="M 50 110 C 20 80, 25 30, 75 40 C 65 60, 60 85, 75 105 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <path d="M 190 110 C 220 80, 215 30, 165 40 C 175 60, 180 85, 165 105 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          
          {/* Buffalo Head / Face */}
          <path d="M 75 90 L 165 90 L 155 180 L 120 220 L 85 180 Z" fill="#451a03" />
          {/* Head Fur/Wool */}
          <path d="M 70 90 Q 120 70 170 90 Q 140 140 120 140 Q 100 140 70 90 Z" fill="#291103" />
          
          {/* Glowing Red Eyes */}
          <ellipse cx="98" cy="125" rx="8" ry="4" fill="#fca5a5" />
          <circle cx="98" cy="125" r="3" fill="#ef4444" />
          <ellipse cx="142" cy="125" rx="8" ry="4" fill="#fca5a5" />
          <circle cx="142" cy="125" r="3" fill="#ef4444" />
          
          {/* Nose snout */}
          <path d="M 100 180 L 140 180 L 135 205 L 105 205 Z" fill="#1c1917" />
          {/* Nostrils */}
          <circle cx="112" cy="195" r="3" fill="#ef4444" fillOpacity="0.8" />
          <circle cx="128" cy="195" r="3" fill="#ef4444" fillOpacity="0.8" />
          
          {/* Dust and Speed lines */}
          <path d="M 30 240 Q 120 220 210 240" stroke="#ea580c" strokeWidth="3" strokeOpacity="0.4" fill="none" />
          <path d="M 45 255 Q 120 240 195 255" stroke="#facc15" strokeWidth="2" strokeOpacity="0.3" fill="none" />
        </svg>
      )
    },
    {
      id: 'g2',
      name: 'PARTY NIGHT',
      provider: 'TaDa Gaming',
      themeColor: '#a855f7', // Purple
      mappedGameId: 'limbo',
      illustration: (
        <svg viewBox="0 0 240 320" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="party-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="50%" stopColor="#881337" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="hair-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          {/* Background */}
          <rect width="240" height="320" fill="url(#party-bg)" />
          
          {/* Disco light beams */}
          <polygon points="120,0 20,320 60,320" fill="#a855f7" fillOpacity="0.15" />
          <polygon points="120,0 180,320 220,320" fill="#dbfd4e" fillOpacity="0.1" />
          
          {/* Girl Face Silhouette */}
          <path d="M 85 130 C 85 100, 155 100, 155 130 C 155 170, 145 220, 120 230 C 95 220, 85 170, 85 130 Z" fill="#fbcfe8" fillOpacity="0.9" />
          
          {/* Neon Yellow Hair outlines */}
          <path d="M 75 120 C 60 70, 180 70, 165 120 C 180 160, 175 220, 165 240 C 160 190, 155 140, 145 130 C 135 120, 105 120, 95 130 C 85 140, 80 190, 75 240 C 65 220, 60 160, 75 120 Z" fill="url(#hair-grad)" />
          
          {/* Glowing Cyan Sunglasses */}
          <path d="M 88 140 Q 120 135 152 140 Q 158 158 148 165 Q 120 160 92 165 Q 82 158 88 140 Z" fill="#090514" stroke="#06b6d4" strokeWidth="3.5" />
          <path d="M 94 146 Q 106 143 118 146 Q 118 158 106 158 Q 94 154 94 146 Z" fill="#22d3ee" fillOpacity="0.75" />
          <path d="M 122 146 Q 134 143 146 146 Q 146 158 134 158 Q 122 154 122 146 Z" fill="#22d3ee" fillOpacity="0.75" />
          
          {/* Bright Pink Lips */}
          <path d="M 108 195 Q 120 190 132 195 Q 120 205 108 195 Z" fill="#f43f5e" />
          
          {/* Floating Music Notes */}
          <path d="M 40 180 L 40 165 L 55 160 L 55 175 M 40 170 L 55 165" stroke="#dbfd4e" strokeWidth="2.5" fill="none" />
          <circle cx="40" cy="180" r="4" fill="#dbfd4e" />
          <circle cx="55" cy="175" r="4" fill="#dbfd4e" />
        </svg>
      )
    },
    {
      id: 'g3',
      name: "LUCKY'S WILD PUB",
      provider: 'Pragmatic Play',
      themeColor: '#22c55e', // Green
      mappedGameId: 'limbo',
      illustration: (
        <svg viewBox="0 0 240 320" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="irish-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="60%" stopColor="#052e16" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id="beer-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Background */}
          <rect width="240" height="320" fill="url(#irish-bg)" />
          
          {/* Lucky Shamrock Clover shadow */}
          <g opacity="0.15" transform="translate(120, 110) scale(1.5)">
            <path d="M0,0 Q-30,-30 -40,0 Q-30,30 0,0" fill="#22c55e" />
            <path d="M0,0 Q30,-30 40,0 Q30,30 0,0" fill="#22c55e" />
            <path d="M0,0 Q-30,-30 0,-40 Q30,-30 0,0" fill="#22c55e" />
            <path d="M0,0 Q-30,30 0,40 Q30,30 0,0" fill="#22c55e" />
          </g>
          
          {/* Leprechaun Hat */}
          <path d="M 60 90 L 180 90 L 165 40 L 75 40 Z" fill="#15803d" stroke="#166534" strokeWidth="1" />
          <rect x="50" y="85" width="140" height="10" rx="4" fill="#14532d" />
          {/* Gold buckle on Hat */}
          <rect x="105" y="65" width="30" height="20" fill="#fbbf24" rx="2" />
          <rect x="112" y="70" width="16" height="10" fill="#0f172a" />
          
          {/* Face & Orange Beard */}
          <path d="M 75 110 Q 120 180 165 110" fill="#f97316" stroke="#ea580c" strokeWidth="4" />
          <circle cx="120" cy="115" r="28" fill="#ffedd5" />
          {/* Chubby nose */}
          <circle cx="120" cy="115" r="7" fill="#fca5a5" />
          {/* Smiling Eyes */}
          <path d="M 103 110 Q 110 105 113 112" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 127 112 Q 130 105 137 110" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Rosy cheeks */}
          <circle cx="100" cy="120" r="5" fill="#fca5a5" fillOpacity="0.6" />
          <circle cx="140" cy="120" r="5" fill="#fca5a5" fillOpacity="0.6" />
          
          {/* Foaming Beer Mug in Foreground */}
          <rect x="145" y="160" width="55" height="70" rx="8" fill="url(#beer-grad)" stroke="#a16207" strokeWidth="2" />
          {/* Handle */}
          <path d="M 200 175 Q 215 195 200 215" fill="none" stroke="#ca8a04" strokeWidth="7" strokeLinecap="round" />
          {/* Rich foam head */}
          <ellipse cx="172" cy="160" rx="30" ry="12" fill="#ffffff" />
          <circle cx="150" cy="155" r="10" fill="#ffffff" />
          <circle cx="165" cy="150" r="12" fill="#ffffff" />
          <circle cx="182" cy="152" r="11" fill="#ffffff" />
          <circle cx="195" cy="158" r="8" fill="#ffffff" />
        </svg>
      )
    },
    {
      id: 'g4',
      name: 'MINES SUPREME',
      provider: 'Damru Originals',
      themeColor: '#38bdf8',
      mappedGameId: 'limbo',
      illustration: (
        <svg viewBox="0 0 240 320" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="mines-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <radialGradient id="cyan-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="240" height="320" fill="url(#mines-bg)" />
          <circle cx="120" cy="130" r="80" fill="url(#cyan-glow)" />
          
          <polygon points="120,40 180,100 120,220 60,100" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="3" />
          <polygon points="120,40 150,100 120,160 90,100" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="120" y1="40" x2="120" y2="220" stroke="#38bdf8" strokeWidth="2" />
          
          <path d="M 60 50 L 62 54 L 67 54 L 63 57 L 64 62 L 60 59 L 56 62 L 57 57 L 53 54 L 58 54 Z" fill="#dbfd4e" />
          <path d="M 180 200 L 182 204 L 187 204 L 183 207 L 184 212 L 180 209 L 176 212 L 177 207 L 173 204 L 178 204 Z" fill="#dbfd4e" />
          
          <line x1="0" y1="100" x2="240" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="180" x2="240" y2="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="80" y1="0" x2="80" y2="320" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="160" y1="0" x2="160" y2="320" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      )
    },
    {
      id: 'g5',
      name: 'PLINKO JUNGLE',
      provider: 'Damru Originals',
      themeColor: '#10b981',
      mappedGameId: 'limbo',
      illustration: (
        <svg viewBox="0 0 240 320" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="jungle-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#050b14" />
            </linearGradient>
            <radialGradient id="emerald-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="240" height="320" fill="url(#jungle-bg)" />
          <circle cx="120" cy="140" r="75" fill="url(#emerald-glow)" />
          
          <circle cx="120" cy="70" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="95" cy="110" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="145" cy="110" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="70" cy="150" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="120" cy="150" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="170" cy="150" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="45" cy="190" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="95" cy="190" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="145" cy="190" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="195" cy="190" r="3.5" fill="#e2e8f0" stroke="#10b981" strokeWidth="1.5" />

          <circle cx="120" cy="122" r="9" fill="#fbbf24" stroke="#dbfd4e" strokeWidth="2" />
          <path d="M 120 70 L 110 95 L 120 122" stroke="#fbbf24" strokeWidth="2.5" strokeOpacity="0.4" fill="none" strokeDasharray="3 3" />
          
          <path d="M 0 0 Q 60 20 80 80 Q 20 60 0 0" fill="#047857" fillOpacity="0.3" />
          <path d="M 240 0 Q 180 20 160 80 Q 220 60 240 0" fill="#047857" fillOpacity="0.3" />
        </svg>
      )
    }
  ];

  const handleGamePlay = (game: NewGameCard) => {
    if (!isLoggedIn) {
      onOpenAuth('signup');
    } else {
      onPlayGame(game.mappedGameId);
    }
  };

  const filteredGames = newGames.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-4 select-none" id="dashboard-lobby-root">
      
      {/* Category selector row & Search Input Bar matching screenshot */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left Side: Styled Category Navigation Pill buttons (Scrollable on small screens) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0 max-w-full">
          
          {/* Lobby Tab Button */}
          <button
            onClick={() => {
              setActiveTab('lobby');
              setMatkaError('');
            }}
            className={`px-5 py-3 rounded-2xl font-bold font-display text-sm flex items-center gap-2.5 transition-all duration-300 border shrink-0 cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-[#0d1f30] border-[#2596be]/30 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                : 'bg-[#121212] border-white/5 text-[#bdbdbd] hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${activeTab === 'lobby' ? 'text-[#38bdf8]' : 'text-[#bdbdbd]'}`} />
            <span>Lobby</span>
          </button>

          {/* Originals Tab Button */}
          <button
            onClick={() => {
              setActiveTab('originals');
              setMatkaError('');
            }}
            className={`px-5 py-3 rounded-2xl font-bold font-display text-sm flex items-center gap-2.5 transition-all duration-300 border shrink-0 cursor-pointer ${
              activeTab === 'originals'
                ? 'bg-[#0d1f30] border-[#2596be]/30 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                : 'bg-[#121212] border-white/5 text-[#bdbdbd] hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className={`w-4 h-4 ${activeTab === 'originals' ? 'text-[#38bdf8]' : 'text-[#bdbdbd]'}`} />
            <span>Originals</span>
          </button>

          {/* Matka Tab Button */}
          <button
            onClick={() => {
              setActiveTab('matka');
              setMatkaError('');
              // Autoselect first digit for convenience
              if (!selectedNumber) setSelectedNumber('7');
            }}
            className={`px-5 py-3 rounded-2xl font-bold font-display text-sm flex items-center gap-2.5 transition-all duration-300 border shrink-0 cursor-pointer ${
              activeTab === 'matka'
                ? 'bg-[#4c0519] border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-[#121212] border-white/5 text-[#bdbdbd] hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-500/20'
            }`}
          >
            <Coins className={`w-4 h-4 ${activeTab === 'matka' ? 'text-rose-400' : 'text-[#bdbdbd]'}`} />
            <span className="flex items-center gap-1.5">
              <span>Matka</span>
              <span className="text-[8px] bg-rose-500 text-white font-mono px-1 rounded uppercase font-black tracking-tight leading-none">Hot</span>
            </span>
          </button>

          {/* Predict Market Tab Button */}
          <button
            onClick={() => {
              setActiveTab('predict');
              setMatkaError('');
              setPredictError('');
              setPredictSuccess('');
            }}
            className={`px-5 py-3 rounded-2xl font-bold font-display text-sm flex items-center gap-2.5 transition-all duration-300 border shrink-0 cursor-pointer ${
              activeTab === 'predict'
                ? 'bg-[#0f2e22] border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-[#121212] border-white/5 text-[#bdbdbd] hover:text-emerald-400 hover:bg-emerald-950/20 hover:border-emerald-500/20'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'predict' ? 'text-emerald-400' : 'text-[#bdbdbd]'}`} />
            <span className="flex items-center gap-1.5">
              <span>Predict Market</span>
              <span className="text-[8px] bg-emerald-500 text-white font-mono px-1 rounded uppercase font-black tracking-tight leading-none">NEW</span>
            </span>
          </button>
        </div>

        {/* Right Side: Fully Functional Search Input field */}
        <div className="relative flex-1 max-w-none lg:max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#888]" />
          <input
            type="text"
            placeholder={activeTab === 'matka' ? "Search not available in Matka mode" : activeTab === 'predict' ? "Search not available in Predict mode" : "Search for Games"}
            disabled={activeTab === 'matka' || activeTab === 'predict'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[#121212] border border-white/5 hover:border-[#38bdf8]/40 rounded-2xl text-white text-xs sm:text-sm focus:border-[#38bdf8] focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-transparent transition-all placeholder:text-white disabled:opacity-40"
          />
        </div>
      </div>

      {/* 1. LOBBY VIEW (CAROUSEL OF ORIGINAL GAMES) */}
      {activeTab === 'lobby' && (
        <div className="pt-0.5" id="originals">
          
          {/* Segment Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-[#38bdf8] font-black text-sm tracking-tighter">
                <span>//</span>
              </div>
              <h3 className="text-sm sm:text-base font-display font-black text-white tracking-tight">
                Damru Originals
              </h3>
            </div>

            {/* View All control */}
            <div className="flex items-center">
              <div className="flex items-center rounded-xl overflow-hidden border border-white/5 bg-[#121212] h-9 text-xs font-bold shadow-md shrink-0">
                <button 
                  onClick={() => {
                    setActiveTab('originals');
                  }}
                  className="px-4.5 h-full bg-[#0d1f30] hover:bg-[#152e47] text-[#38bdf8] transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  View All
                </button>
                <div className="px-3.5 h-full bg-[#08111a] border-l border-white/5 text-[#38bdf8]/75 flex items-center justify-center font-mono font-black select-none">
                  5
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Scrollable Games track with smooth physics */}
          {filteredGames.length > 0 ? (
            <div 
              ref={scrollContainerRef}
              className="w-full flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth pb-5 px-1 relative z-10"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredGames.map((game, index) => {
                const isFav = favorites.includes(game.id);
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => handleGamePlay(game)}
                    className="min-w-[145px] sm:min-w-[170px] md:min-w-[185px] w-[42%] sm:w-[25%] md:w-[18%] shrink-0 snap-start group relative aspect-[10/11.8] bg-[#121212] border border-white/5 rounded-2xl overflow-hidden hover:border-[#38bdf8]/35 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between"
                  >
                     {/* High Quality Game Vector Graphic */}
                    <div className="absolute inset-0 w-full h-[73%] z-0 select-none overflow-hidden transition-transform duration-500 group-hover:scale-105">
                      {game.illustration}
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#121212] to-transparent z-10" />
                    </div>

                    {/* Top card bar (Favorites toggler & Hot indicator) */}
                    <div className="relative z-10 p-2.5 flex items-center justify-between gap-1">
                      <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-black bg-[#dbfd4e] px-1 py-0.5 rounded flex items-center gap-0.5 shadow-md shrink-0">
                        <Flame className="w-2 h-2 fill-black text-black" /> ORIGINAL
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(game.id, e)}
                        className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-white/60 hover:text-red-400 hover:scale-110 active:scale-95 transition-all shadow-md"
                      >
                        <Heart className={`w-3 h-3 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>

                    {/* Play Hover State overlay button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-black/40 backdrop-blur-[2px]">
                      <div className="w-10 h-10 rounded-full bg-[#38bdf8] flex items-center justify-center text-black shadow-[0_0_15px_rgba(56,189,248,0.6)] transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      </div>
                    </div>

                    {/* Bottom details card info panel */}
                    <div className="relative z-10 p-2.5 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent flex flex-col space-y-0.5 select-none">
                      <span className="font-display font-black text-[11px] sm:text-xs text-white tracking-wide truncate group-hover:text-[#38bdf8] transition-colors leading-tight uppercase">
                        {game.name}
                      </span>
                      
                      {/* Provider capsule with branded style */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[9px] font-semibold text-[#666] truncate pr-1">
                          {game.provider}
                        </span>
                        <span className="text-[7.5px] font-mono font-black text-[#38bdf8] bg-[#0d1f30] border border-[#2596be]/20 px-1 py-0.2 rounded uppercase tracking-tighter shrink-0">
                          {game.provider.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center bg-card-dark/20 border border-white/5 rounded-2xl select-none">
              <Search className="w-10 h-10 text-[#555] mb-2 animate-pulse" />
              <h4 className="text-sm font-bold text-white">No games found</h4>
              <p className="text-xs text-[#666] max-w-xs mt-1">Try searching for other brand providers or names.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. ORIGINALS GRID VIEW (ALL 5 DETAILED CARDS IN GRID) */}
      {activeTab === 'originals' && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 mb-5">
            <div className="flex items-center text-[#38bdf8] font-black text-sm tracking-tighter">
              <span>//</span>
            </div>
            <h3 className="text-sm sm:text-base font-display font-black text-white tracking-tight">
              All Damru Originals Games
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {filteredGames.map((game, idx) => {
              const isFav = favorites.includes(game.id);
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => handleGamePlay(game)}
                  className="aspect-[10/12] group relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden hover:border-[#38bdf8]/35 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between"
                >
                  <div className="absolute inset-0 w-full h-[73%] z-0 select-none overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {game.illustration}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#121212] to-transparent z-10" />
                  </div>

                  <div className="relative z-10 p-2.5 flex items-center justify-between">
                    <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-black bg-[#dbfd4e] px-1 py-0.5 rounded shadow-md">
                      ORIGINAL
                    </span>
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-white/60 hover:text-red-400 hover:scale-110 active:scale-95 transition-all shadow-md"
                    >
                      <Heart className={`w-3 h-3 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-black/40 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-[#38bdf8] flex items-center justify-center text-black shadow-[0_0_15px_rgba(56,189,248,0.6)] transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play className="w-4 h-4 fill-black translate-x-0.5" />
                    </div>
                  </div>

                  <div className="relative z-10 p-2.5 bg-[#121212] flex flex-col space-y-0.5">
                    <span className="font-display font-black text-xs text-white tracking-wide truncate group-hover:text-[#38bdf8] transition-colors leading-tight uppercase">
                      {game.name}
                    </span>
                    <span className="text-[8.5px] font-semibold text-[#666]">
                      {game.provider}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PREMIUM INTERACTIVE SATTA MATKA GAME VIEW */}
      {activeTab === 'matka' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-[#1c0d12] via-[#0f070a] to-[#050203] rounded-3xl border border-rose-500/20 p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          id="matka-game-board"
        >
          {/* Subtle Golden Indian Patterns & Overlay lights */}
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Grid Layout: Controls on Left, Golden Matka Animation on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
            
            {/* LEFT 7 COLUMNS: BETTING CONTROLS */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              
              {/* Game Title Headers */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-black text-white bg-rose-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-rose-600/20 animate-pulse">
                    LIVE DRAW
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400">Damru Gold Matka Official</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                  DAMRU <span className="text-amber-400">GOLD MATKA</span>
                </h3>
                <p className="text-xs text-[#bbb] mt-1 leading-relaxed">
                  Experience Satta Matka! Pick single digits, double jodis, or triple panels (Pannas) and break the golden clay pot to win big multipliers!
                </p>
              </div>

              {/* Step 1: Bet Category Selection */}
              <div className="space-y-2">
                <label className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">1. Select Bet Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      setBetType('single');
                      setSelectedNumber('7');
                      setMatkaError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition border cursor-pointer ${
                      betType === 'single'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-black/35 border-white/5 text-[#888] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="font-black text-rose-500 text-sm">9x</div>
                    <span className="text-[10px] tracking-wide">Single Ank</span>
                  </button>

                  <button 
                    onClick={() => {
                      setBetType('jodi');
                      setSelectedNumber('77');
                      setMatkaError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition border cursor-pointer ${
                      betType === 'jodi'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-black/35 border-white/5 text-[#888] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="font-black text-rose-500 text-sm">90x</div>
                    <span className="text-[10px] tracking-wide">Jodi digits</span>
                  </button>

                  <button 
                    onClick={() => {
                      setBetType('panna');
                      setSelectedNumber('138');
                      setMatkaError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition border cursor-pointer ${
                      betType === 'panna'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-black/35 border-white/5 text-[#888] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="font-black text-rose-500 text-sm">140x</div>
                    <span className="text-[10px] tracking-wide">Panna Panel</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Interactive Digit Picker based on Bet Type */}
              <div className="space-y-2 bg-black/25 p-3.5 rounded-2xl border border-white/5">
                
                {/* 2.1 Single Ank selection */}
                {betType === 'single' && (
                  <div>
                    <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-2">2. Pick Single Digit (0-9)</label>
                    <div className="flex flex-wrap gap-2.5 justify-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                        const isSelected = selectedNumber === String(num);
                        return (
                          <button
                            key={num}
                            onClick={() => setSelectedNumber(String(num))}
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center font-black font-mono text-sm sm:text-base border cursor-pointer transition-all duration-300 relative ${
                              isSelected
                                ? 'bg-[#dbfd4e] border-[#dbfd4e] text-black scale-110 shadow-[0_0_15px_rgba(219,253,78,0.35)]'
                                : 'bg-gradient-to-b from-[#221015] to-[#150a0d] border-rose-500/10 text-rose-200 hover:border-rose-500/40'
                            }`}
                          >
                            <span>{num}</span>
                            <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-rose-500/40'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2.2 Jodi digit selection via two slots */}
                {betType === 'jodi' && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">2. Select Your Double Digit (Jodi)</label>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Left Digit */}
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-[#888] font-bold block uppercase tracking-wider text-center">Left Ank</span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                            const currentLeft = selectedNumber.charAt(0) || '0';
                            const isSelected = currentLeft === String(num);
                            return (
                              <button
                                key={num}
                                onClick={() => {
                                  const right = selectedNumber.charAt(1) || '0';
                                  setSelectedNumber(`${num}${right}`);
                                }}
                                className={`w-7 h-7 rounded-lg font-bold font-mono text-xs border cursor-pointer flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-rose-500 border-rose-500 text-white font-black' 
                                    : 'bg-black/50 border-white/5 text-rose-200/80 hover:border-rose-500/20'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Digit */}
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-[#888] font-bold block uppercase tracking-wider text-center">Right Ank</span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                            const currentRight = selectedNumber.charAt(1) || '0';
                            const isSelected = currentRight === String(num);
                            return (
                              <button
                                key={num}
                                onClick={() => {
                                  const left = selectedNumber.charAt(0) || '0';
                                  setSelectedNumber(`${left}${num}`);
                                }}
                                className={`w-7 h-7 rounded-lg font-bold font-mono text-xs border cursor-pointer flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-rose-500 border-rose-500 text-white font-black' 
                                    : 'bg-black/50 border-white/5 text-rose-200/80 hover:border-rose-500/20'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 px-3.5 py-2.5 rounded-xl border border-rose-500/10 flex items-center justify-between">
                      <span className="text-xs text-[#aaa]">Your Selected Jodi:</span>
                      <span className="text-lg font-black font-mono text-amber-400 tracking-wider bg-[#15070a] px-3.5 py-1.5 rounded-lg border border-rose-500/20 shadow-inner">
                        {selectedNumber || '00'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2.3 Panna Selection via numeric entry + random suggestions */}
                {betType === 'panna' && (
                  <div className="space-y-3.5">
                    <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">2. Type or Generate 3-Digit Panel (Panna)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="e.g. 138"
                        value={selectedNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setSelectedNumber(val);
                        }}
                        className="flex-1 bg-black/60 border border-rose-500/20 rounded-xl px-4 py-3 text-center text-lg font-black font-mono text-white placeholder:text-rose-900/40 focus:outline-none focus:border-rose-500 transition-all tracking-widest"
                      />
                      <button
                        onClick={() => {
                          // Satta Matka Pannas are strictly sorted ascending (customary rule)
                          const digs = [
                            Math.floor(Math.random() * 10),
                            Math.floor(Math.random() * 10),
                            Math.floor(Math.random() * 10)
                          ].sort((a, b) => a - b);
                          setSelectedNumber(digs.join(''));
                        }}
                        className="py-3 px-4 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/20 transition cursor-pointer shrink-0"
                      >
                        Quick Panna
                      </button>
                    </div>
                    <span className="text-[9px] text-rose-300/50 italic leading-tight block text-center">
                      Tip: A standard Satta Matka Panel contains 3 digits usually sorted in ascending order (like 125, 350).
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3: Wager Input & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">3. Wager Amount</label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Balance: ${userBalance.toLocaleString()}</span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-rose-500 font-mono font-black text-sm">$</span>
                  <input
                    type="text"
                    value={matkaWager}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setMatkaWager(val);
                    }}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-3.5 pl-8 pr-16 text-sm font-mono text-white font-black focus:outline-none focus:border-rose-500 transition-all shadow-inner"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button 
                      onClick={() => setMatkaWager(String(Math.max(10, Math.floor(parseInt(matkaWager || '0') / 2))))}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-rose-200 transition-all cursor-pointer"
                    >
                      /2
                    </button>
                    <button 
                      onClick={() => setMatkaWager(String(Math.min(userBalance, parseInt(matkaWager || '0') * 2)))}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-rose-200 transition-all cursor-pointer"
                    >
                      x2
                    </button>
                    <button 
                      onClick={() => setMatkaWager(String(userBalance))}
                      className="px-2 py-1.5 bg-rose-950/50 hover:bg-rose-900 border border-rose-500/20 rounded-lg text-[9px] font-bold text-rose-400 transition-all cursor-pointer"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex items-center gap-1.5">
                  {[50, 100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setMatkaWager(String(Math.min(userBalance, preset)));
                        setMatkaError('');
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-500/20 border border-transparent rounded-xl text-[10px] font-mono font-bold text-[#888] transition cursor-pointer"
                    >
                      +${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error warning message block */}
              {matkaError && (
                <div className="bg-red-950/40 border border-red-500/20 p-3 rounded-2xl text-xs text-red-400 font-bold text-center">
                  ⚠️ {matkaError}
                </div>
              )}

              {/* Play Draw Button */}
              <button
                disabled={isShaking}
                onClick={playMatkaRound}
                className="w-full py-4.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white font-black font-display text-sm uppercase tracking-widest rounded-2xl transition duration-300 shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                <Coins className="w-4 h-4 animate-spin-slow" />
                <span>{isShaking ? 'Shaking Gold Matka...' : 'OPEN GOLD MATKA'}</span>
              </button>

            </div>

            {/* RIGHT 5 COLUMNS: THE SATTA MATKA ANIMATION POT & RESULTS DISPLAY */}
            <div className="lg:col-span-5 bg-gradient-to-b from-black/45 to-black/25 rounded-2xl p-4 border border-white/5 flex flex-col justify-between space-y-4">
              
              {/* Top Section: Recent History Ticker */}
              <div>
                <span className="text-[9px] text-[#666] font-bold uppercase tracking-wider block mb-2 text-center">LIVE TICKER (RECENT JODIS)</span>
                <div className="flex items-center gap-2 justify-center">
                  {matkaHistory.map((jod, i) => (
                    <div 
                      key={i} 
                      className={`px-3 py-1.5 rounded-lg font-mono font-black text-xs border ${
                        i === 0 
                          ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]' 
                          : 'bg-black/40 border-white/5 text-[#555]'
                      }`}
                    >
                      {jod}
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle Section: The Gold Clay Pot (Matka) visual */}
              <div className="flex flex-col items-center justify-center py-6 relative">
                
                {/* Shake container */}
                <motion.div
                  animate={isShaking ? {
                    x: [0, -12, 12, -10, 10, -6, 6, -3, 3, 0],
                    y: [0, 6, -6, 4, -4, 2, -2, 0, 0, 0],
                    rotate: [0, -3, 3, -2, 2, -1, 1, 0, 0, 0]
                  } : {}}
                  transition={{ duration: 1.5, repeat: isShaking ? Infinity : 0 }}
                  className="w-40 h-40 flex items-center justify-center relative select-none"
                >
                  {/* Decorative golden sparkles behind pot during shake */}
                  {isShaking && (
                    <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-[30px] animate-pulse" />
                  )}

                  {/* SVG Handcrafted Indian Clay Pot (Matka) with Golden and Crimson textures */}
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_20px_rgba(244,63,94,0.15)]">
                    <defs>
                      <linearGradient id="gold-matka-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="35%" stopColor="#ca8a04" />
                        <stop offset="70%" stopColor="#854d0e" />
                        <stop offset="100%" stopColor="#221002" />
                      </linearGradient>
                      <linearGradient id="neck-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#854d0e" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#854d0e" />
                      </linearGradient>
                    </defs>
                    
                    {/* Clay Pot Mouth / Rim */}
                    <ellipse cx="50" cy="22" rx="18" ry="4" fill="url(#neck-grad)" stroke="#ca8a04" strokeWidth="1" />
                    <ellipse cx="50" cy="22" rx="14" ry="2.5" fill="#1c0700" />
                    
                    {/* Neck */}
                    <path d="M 36 22 Q 40 33 30 38" fill="none" stroke="url(#neck-grad)" strokeWidth="4" />
                    <path d="M 64 22 Q 60 33 70 38" fill="none" stroke="url(#neck-grad)" strokeWidth="4" strokeLinecap="round" />
                    
                    {/* Tied Holy Thread (Kalava) around neck */}
                    <rect x="36" y="27" width="28" height="2.5" fill="#dc2626" rx="0.5" />
                    <circle cx="50" cy="28.2" r="1.5" fill="#facc15" />
                    
                    {/* Big Spherical Pot Belly body */}
                    <circle cx="50" cy="58" r="28" fill="url(#gold-matka-grad)" stroke="#eab308" strokeWidth="1.5" />
                    
                    {/* Golden design patterns on belly */}
                    {/* Traditional Indian waves and dots */}
                    <path d="M 23 54 Q 50 64 77 54" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
                    <path d="M 22 58 Q 50 69 78 58" fill="none" stroke="#fef08a" strokeWidth="1.5" opacity="0.6" />
                    <path d="M 23 62 Q 50 74 77 62" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
                    
                    {/* Traditional Gold emblem symbol in center */}
                    <path d="M 50 42 L 53 47 L 58 47 L 54 50 L 55 55 L 50 52 L 45 55 L 46 50 L 42 47 L 47 47 Z" fill="#fef08a" opacity="0.8" />
                    <circle cx="50" cy="62" r="5" fill="#7f1d1d" stroke="#facc15" strokeWidth="1" />
                    <circle cx="50" cy="62" r="2" fill="#facc15" />
                    
                    {/* Golden sparkles */}
                    <circle cx="28" cy="42" r="1" fill="#facc15" opacity="0.5" />
                    <circle cx="72" cy="42" r="1" fill="#facc15" opacity="0.5" />
                    <circle cx="34" cy="74" r="1.5" fill="#facc15" opacity="0.5" />
                    <circle cx="66" cy="74" r="1.5" fill="#facc15" opacity="0.5" />
                  </svg>
                </motion.div>
                
                {/* Visual state helper under the pot */}
                <div className="text-center mt-3">
                  {isShaking ? (
                    <span className="text-[11px] font-bold text-amber-400 font-mono tracking-widest uppercase animate-pulse">
                      ⚡ DRAWING FROM COINS ⚡
                    </span>
                  ) : (
                    <span className="text-[9px] text-rose-300/40 font-mono tracking-widest uppercase">
                      DAMRU OFFICIAL MATKA
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Section: Draw results and Win/Lose Banner */}
              <div className="bg-black/50 p-4 rounded-xl border border-rose-500/10 min-h-[140px] flex flex-col justify-center items-center">
                
                <AnimatePresence mode="wait">
                  {/* State 1: Awaiting Play */}
                  {!gameResult && !isShaking && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-2"
                    >
                      <HelpCircle className="w-8 h-8 text-rose-500/40 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-rose-300">Awaiting Your Bet</h4>
                      <p className="text-[10px] text-[#666] max-w-xs mt-1">Select your predictions and click "Open Gold Matka" to draw the results!</p>
                    </motion.div>
                  )}

                  {/* State 2: Shaking Animation */}
                  {isShaking && (
                    <motion.div 
                      key="shaking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-2"
                    >
                      <div className="flex justify-center items-center gap-1.5 mb-2.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <h4 className="text-xs font-bold text-rose-300">Shaking the Matka...</h4>
                      <p className="text-[10px] text-[#666] max-w-xs mt-1">Satta coins are scrambling. Hand of fate is drawing!</p>
                    </motion.div>
                  )}

                  {/* State 3: Game Results Display */}
                  {gameResult && !isShaking && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full text-center space-y-3.5"
                    >
                      {/* Satta Matka Official Ticker Board format */}
                      <div>
                        <span className="text-[8px] text-[#888] font-mono uppercase tracking-wider block mb-1">OFFICIAL BOARD RESULT</span>
                        <div className="flex items-center justify-center gap-2">
                          {/* Open Panna */}
                          <div className="bg-[#1a070c] border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-black text-rose-300">
                            {gameResult.openPanna}
                          </div>
                          <span className="text-[#555] font-black font-mono">-</span>
                          {/* Winning Jodi */}
                          <div className="bg-rose-950 border border-rose-500/30 px-3.5 py-1 rounded-lg text-sm sm:text-base font-mono font-black text-amber-400 tracking-widest shadow-glow shadow-rose-500/10">
                            {gameResult.jodi}
                          </div>
                          <span className="text-[#555] font-black font-mono">-</span>
                          {/* Close Panna */}
                          <div className="bg-[#1a070c] border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-black text-rose-300">
                            {gameResult.closePanna}
                          </div>
                        </div>
                      </div>

                      {/* Details: Open Ank, Close Ank */}
                      <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-[#888] border-t border-b border-white/5 py-1">
                        <div>Open Ank: <span className="font-bold text-white">{gameResult.openAnk}</span></div>
                        <div>Close Ank: <span className="font-bold text-white">{gameResult.closeAnk}</span></div>
                      </div>

                      {/* Win/Lose Notification banner */}
                      <div>
                        {hasWon ? (
                          <div className="space-y-1">
                            <div className="text-sm font-display font-black text-[#dbfd4e] uppercase tracking-wider animate-bounce">
                              🎉 BADA MUBARAK HO! WINNER! 🎉
                            </div>
                            <div className="text-xs text-[#bbb]">
                              You predicted <span className="font-mono font-bold text-white">{selectedNumber}</span> correctly and won <span className="font-mono font-bold text-[#dbfd4e]">${payoutAmount.toLocaleString()}</span> practice coins!
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                              Nahi Laga! Try Again
                            </div>
                            <div className="text-[10px] text-[#888] max-w-xs mx-auto">
                              Your prediction <span className="font-mono text-white">{selectedNumber}</span> did not match the draw result. Give it another shot!
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>

          </div>
        </motion.div>
      )}

      {/* 4. PREMIUM INTERACTIVE PREDICT MARKET (PREDICTION MARKET) VIEW */}
      {activeTab === 'predict' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-[#061c14] via-[#030f0a] to-[#010503] rounded-3xl border border-emerald-500/20 p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          id="predict-market-board"
        >
          {/* Ambient glowing radial lights */}
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-600/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Tab Headers and Info banner */}
          <div className="mb-6 relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-600/20 animate-pulse">
                POLITICAL & SPORTS MARKETS
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">Damru Prediction Desk</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
              DAMRU <span className="text-emerald-400">PREDICT MARKET</span>
            </h3>
            <p className="text-xs text-[#bbb] mt-1 leading-relaxed">
              Predict real-world headlines! Buy YES or NO shares. Shares resolve to $1.00 if correct, and $0.00 if incorrect. Settle any time to claim your rewards!
            </p>
          </div>

          {/* Grid Layout: Active Markets on Left, Prediction Slip on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
            
            {/* LEFT 7 COLUMNS: ACTIVE MARKETS LIST */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">Active Headlines</span>
                <span className="text-[10px] text-white/50 font-mono">Volume Sorted</span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {markets.map((market) => {
                  const isSelected = selectedMarketId === market.id;
                  const activeBetsCount = myPredictions.filter(p => p.marketId === market.id && !p.resolved).length;
                  
                  return (
                    <div
                      key={market.id}
                      onClick={() => {
                        setSelectedMarketId(market.id);
                        setPredictError('');
                        setPredictSuccess('');
                      }}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-[1.01]'
                          : 'bg-black/35 border-white/5 hover:border-white/10 hover:bg-black/50'
                      }`}
                    >
                      {/* Top Bar: Category & Volume */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${market.badgeColor}`}>
                          {market.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#888] font-mono">
                            Vol: <span className="text-white font-bold">{market.volume}</span>
                          </span>
                          {activeBetsCount > 0 && (
                            <span className="text-[9px] bg-emerald-500 text-black font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                              {activeBetsCount} Active Bet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Headline Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug mb-3">
                        {market.title}
                      </h4>

                      {/* Quick Odds / Prices */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-between px-3 py-2 bg-[#091f15] border border-emerald-500/10 rounded-xl">
                          <span className="text-[10px] text-emerald-400 font-bold">YES</span>
                          <span className="text-xs font-mono font-black text-emerald-400">{market.yesPrice}¢</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-3 py-2 bg-[#1f0d0d] border border-rose-500/10 rounded-xl">
                          <span className="text-[10px] text-rose-400 font-bold">NO</span>
                          <span className="text-xs font-mono font-black text-rose-400">{100 - market.yesPrice}¢</span>
                        </div>
                      </div>

                      {/* Settlement Action Trigger inside the Card if user has active predictions */}
                      {activeBetsCount > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[9px] text-[#888] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-emerald-400" /> Closes: {market.resolverDate}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveMarketPrediction(market.id);
                            }}
                            className="px-3 py-1 bg-emerald-500 text-black font-black text-[9px] rounded-lg uppercase tracking-wider hover:bg-emerald-400 transition cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> Settle & Draw
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 5 COLUMNS: PLACE PREDICTION TRADING SLIP */}
            <div className="lg:col-span-5 bg-gradient-to-b from-black/45 to-black/25 rounded-2xl p-4 border border-white/5 flex flex-col justify-between space-y-4">
              
              {(() => {
                const selectedMarket = markets.find(m => m.id === selectedMarketId) || markets[0];
                const activePrice = predictOutcome === 'YES' ? selectedMarket.yesPrice : (100 - selectedMarket.yesPrice);
                const sharesToBuy = Math.round((parseInt(predictWager || '0') / (activePrice / 100)) * 10) / 10;
                const maxPayout = Math.round(sharesToBuy);
                const profitPotential = Math.max(0, maxPayout - parseInt(predictWager || '0'));
                
                return (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    
                    {/* Header */}
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">TRADING DESK</span>
                      <h4 className="text-xs font-bold text-[#ddd] line-clamp-2">
                        {selectedMarket.title}
                      </h4>
                    </div>

                    {/* Outcome Toggles */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#888] font-bold uppercase tracking-wider block">Outcome Prediction</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => setPredictOutcome('YES')}
                          className={`py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition border cursor-pointer flex flex-col items-center justify-center ${
                            predictOutcome === 'YES'
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'bg-black/35 border-white/5 text-[#666] hover:text-white'
                          }`}
                        >
                          <span className="text-xs">YES Shares</span>
                          <span className="text-base font-mono mt-0.5">{selectedMarket.yesPrice}¢</span>
                        </button>
                        
                        <button
                          onClick={() => setPredictOutcome('NO')}
                          className={`py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition border cursor-pointer flex flex-col items-center justify-center ${
                            predictOutcome === 'NO'
                              ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                              : 'bg-black/35 border-white/5 text-[#666] hover:text-white'
                          }`}
                        >
                          <span className="text-xs">NO Shares</span>
                          <span className="text-base font-mono mt-0.5">{100 - selectedMarket.yesPrice}¢</span>
                        </button>
                      </div>
                    </div>

                    {/* Wager Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Prediction Size</label>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Avail: ${userBalance.toLocaleString()}</span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-emerald-500 font-mono font-black text-sm">$</span>
                        <input
                          type="text"
                          value={predictWager}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setPredictWager(val);
                          }}
                          className="w-full bg-black/50 border border-white/5 rounded-2xl py-3.5 pl-8 pr-16 text-sm font-mono text-white font-black focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <button
                            onClick={() => setPredictWager(String(Math.max(10, Math.floor(parseInt(predictWager || '0') / 2))))}
                            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-emerald-200 transition-all cursor-pointer"
                          >
                            /2
                          </button>
                          <button
                            onClick={() => setPredictWager(String(Math.min(userBalance, parseInt(predictWager || '0') * 2)))}
                            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-emerald-200 transition-all cursor-pointer"
                          >
                            x2
                          </button>
                          <button
                            onClick={() => setPredictWager(String(userBalance))}
                            className="px-2 py-1.5 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-400 transition-all cursor-pointer"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pricing slips and dynamic share statistics */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-2xl space-y-2 font-mono text-xs text-[#888]">
                      <div className="flex items-center justify-between">
                        <span>Average Share Price:</span>
                        <span className="text-white font-bold">{(activePrice / 100).toFixed(2)} USD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Est. Shares Purchased:</span>
                        <span className="text-emerald-400 font-black">{sharesToBuy.toLocaleString()} Shares</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-white">Est. Payout (if Correct):</span>
                        <span className="text-emerald-400 font-black text-sm">${maxPayout.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#666]">
                        <span>Profit Potential:</span>
                        <span className="text-emerald-500 font-bold">+${profitPotential.toLocaleString()} ({( (profitPotential / (parseInt(predictWager) || 1)) * 100 ).toFixed(0)}%)</span>
                      </div>
                    </div>

                    {/* Response Alerts */}
                    {predictError && (
                      <div className="bg-red-950/40 border border-red-500/20 p-2.5 rounded-xl text-[11px] text-red-400 font-bold text-center">
                        ⚠️ {predictError}
                      </div>
                    )}

                    {predictSuccess && (
                      <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl text-[11px] text-emerald-400 font-bold text-center flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>{predictSuccess}</span>
                      </div>
                    )}

                    {/* Place Button */}
                    <button
                      onClick={placePrediction}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:opacity-95 text-white font-black font-display text-xs sm:text-sm uppercase tracking-widest rounded-2xl transition duration-300 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>PLACE PREDICTION</span>
                    </button>

                  </div>
                );
              })()}

            </div>

          </div>

          {/* MY PREDICTIONS PORTFOLIO SECTION */}
          <div className="mt-8 bg-black/35 rounded-2xl p-4 border border-white/5 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-display font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" /> Predictions Portfolio
                </h4>
                <p className="text-[10px] text-[#666]">Track active forecasts or simulate immediate result resolution to verify payouts.</p>
              </div>

              <div className="text-[10px] font-mono text-[#aaa]">
                Total Forecasts: <span className="font-bold text-emerald-400">{myPredictions.length}</span>
              </div>
            </div>

            {myPredictions.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myPredictions.map((pred) => {
                  const marketObj = markets.find(m => m.id === pred.marketId);
                  
                  return (
                    <div
                      key={pred.id}
                      className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-500/10 transition-all"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-mono font-black uppercase px-1 rounded ${
                            pred.outcome === 'YES' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pred.outcome}
                          </span>
                          <span className="text-[10px] text-[#666] font-mono">{pred.placedAt}</span>
                        </div>
                        <h5 className="text-xs font-bold text-white tracking-tight line-clamp-1">
                          {pred.title}
                        </h5>
                      </div>

                      {/* Right: Amounts & Simulation trigger */}
                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right font-mono text-xs space-y-0.5">
                          <div className="text-white">Wager: <span className="font-bold">${pred.amount}</span></div>
                          <div className="text-[10px] text-[#666]">Avg Share: {pred.price}¢</div>
                        </div>

                        {/* Status / Actions */}
                        <div>
                          {pred.resolved ? (
                            pred.result === 'WON' ? (
                              <div className="px-3 py-1 bg-emerald-950 border border-emerald-500/30 rounded-lg text-center shadow-md">
                                <span className="text-[10px] font-black text-[#dbfd4e] block uppercase">WON</span>
                                <span className="text-[9px] font-mono text-emerald-400">+${pred.potentialPayout}</span>
                              </div>
                            ) : (
                              <div className="px-3 py-1 bg-black/40 border border-white/5 rounded-lg text-center opacity-60">
                                <span className="text-[10px] font-black text-rose-500 block uppercase">LOST</span>
                                <span className="text-[9px] font-mono text-rose-400">-${pred.amount}</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="px-2.5 py-1 bg-black/40 border border-white/5 rounded-lg text-center">
                                <span className="text-[9px] text-[#888] block">POTENTIAL</span>
                                <span className="text-[10px] font-bold text-[#dbfd4e]">${pred.potentialPayout}</span>
                              </div>
                              <button
                                onClick={() => resolveMarketPrediction(pred.marketId)}
                                className="px-2.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
                                title="Simulate settlement of this market"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-black/20 rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center">
                <HelpCircle className="w-7 h-7 text-[#444] mb-2 animate-bounce" />
                <h5 className="text-xs font-bold text-[#aaa]">Your slip is empty</h5>
                <p className="text-[9px] text-[#555] max-w-xs mt-0.5">Predictions you submit will show up here. Try placing your first bet above!</p>
              </div>
            )}
          </div>

        </motion.div>
      )}

    </div>
  );
}
