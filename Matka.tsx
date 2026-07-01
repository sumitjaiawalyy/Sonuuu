import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Search, Coins, Sparkles, Clock, Check, RefreshCw, Trophy, Flame, HelpCircle } from 'lucide-react';

interface MatkaProps {
  userBalance: number;
  onUpdateBalance: (amount: number) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

interface MatkaMarket {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  status: 'OPEN' | 'CLOSED';
  bgColor: string;
  borderColor: string;
  accentColor: string;
  liveResult: string;
  playersCount: number;
}

export default function Matka({ userBalance, onUpdateBalance, isLoggedIn, onOpenAuth }: MatkaProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('kalyan');
  const [betType, setBetType] = useState<'single' | 'jodi' | 'panna'>('single');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [matkaWager, setMatkaWager] = useState<string>('100');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  
  // Game Result states
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
  const [matkaError, setMatkaError] = useState<string>('');
  const [matkaSuccess, setMatkaSuccess] = useState<string>('');

  // Satta Matka Markets Data
  const initialMarkets: MatkaMarket[] = [
    {
      id: 'kalyan',
      name: 'KALYAN MATKA',
      openTime: '03:45 PM',
      closeTime: '05:45 PM',
      status: 'OPEN',
      bgColor: 'from-[#651e3e] via-[#351c35] to-[#120716]',
      borderColor: 'border-rose-500/30',
      accentColor: '#f43f5e',
      liveResult: '246-28-350',
      playersCount: 2480,
    },
    {
      id: 'milan-day',
      name: 'MILAN DAY',
      openTime: '03:00 PM',
      closeTime: '05:00 PM',
      status: 'OPEN',
      bgColor: 'from-[#062c30] via-[#051e21] to-[#01090a]',
      borderColor: 'border-teal-500/30',
      accentColor: '#14b8a6',
      liveResult: '124-78-260',
      playersCount: 1940,
    },
    {
      id: 'time-bazar',
      name: 'TIME BAZAR',
      openTime: '01:00 PM',
      closeTime: '02:00 PM',
      status: 'CLOSED',
      bgColor: 'from-[#7c2d12] via-[#4c1d95] to-[#1e1b4b]',
      borderColor: 'border-amber-500/30',
      accentColor: '#f59e0b',
      liveResult: '138-20-480',
      playersCount: 1530,
    },
    {
      id: 'main-bazar',
      name: 'MAIN BAZAR',
      openTime: '09:35 PM',
      closeTime: '12:05 AM',
      status: 'OPEN',
      bgColor: 'from-[#1e1b4b] via-[#311042] to-[#0a0010]',
      borderColor: 'border-indigo-500/30',
      accentColor: '#6366f1',
      liveResult: '249-50-145',
      playersCount: 3120,
    },
    {
      id: 'rajdhani-night',
      name: 'RAJDHANI NIGHT',
      openTime: '09:30 PM',
      closeTime: '11:45 PM',
      status: 'OPEN',
      bgColor: 'from-[#701a75] via-[#4a044e] to-[#18001c]',
      borderColor: 'border-fuchsia-500/30',
      accentColor: '#d946ef',
      liveResult: '357-55-140',
      playersCount: 2210,
    },
    {
      id: 'gali-satta',
      name: 'GALI SATTA',
      openTime: '11:00 PM',
      closeTime: '11:30 PM',
      status: 'OPEN',
      bgColor: 'from-[#14532d] via-[#022c22] to-[#021510]',
      borderColor: 'border-emerald-500/30',
      accentColor: '#10b981',
      liveResult: '100-11-290',
      playersCount: 1850,
    },
    {
      id: 'desawar',
      name: 'DESAWAR',
      openTime: '05:00 AM',
      closeTime: '05:30 AM',
      status: 'CLOSED',
      bgColor: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
      borderColor: 'border-slate-500/30',
      accentColor: '#94a3b8',
      liveResult: '119-11-380',
      playersCount: 2060,
    },
  ];

  const [markets, setMarkets] = useState<MatkaMarket[]>(initialMarkets);
  const [recentDraws, setRecentDraws] = useState<{ [key: string]: string[] }>({
    kalyan: ['28', '45', '12', '78', '90'],
    'milan-day': ['78', '11', '89', '23', '55'],
    'time-bazar': ['20', '34', '16', '70', '92'],
    'main-bazar': ['50', '32', '80', '19', '66'],
    'rajdhani-night': ['55', '17', '43', '08', '29'],
    'gali-satta': ['11', '01', '40', '65', '83'],
    desawar: ['11', '90', '52', '12', '88'],
  });

  // Dynamic player counts simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          const change = Math.floor(Math.random() * 21) - 10;
          let newCount = m.playersCount + change;
          if (newCount < 500) newCount = 500;
          if (newCount > 5000) newCount = 5000;
          return { ...m, playersCount: newCount };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPlaying = markets.reduce((sum, m) => sum + m.playersCount, 0);
  const formattedTotalPlaying = (totalPlaying / 1000).toFixed(2) + 'K';

  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  const filteredMarkets = markets.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Play Satta Matka Round
  const playMatkaRound = () => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }

    const betAmount = parseInt(matkaWager);
    if (isNaN(betAmount) || betAmount <= 0) {
      setMatkaError("Please enter a valid amount.");
      setMatkaSuccess('');
      return;
    }

    if (userBalance < betAmount) {
      setMatkaError("Insufficient balance! Please claim free funds in your wallet.");
      setMatkaSuccess('');
      return;
    }

    if (!selectedNumber) {
      setMatkaError("Please select/type your prediction number.");
      setMatkaSuccess('');
      return;
    }

    // Input Validation
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
    setMatkaSuccess('');

    // Deduct bet amount
    onUpdateBalance(-betAmount);

    setTimeout(() => {
      // 1. Generate Open Panna (3 numbers, sorted ascending)
      const openDigits = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ].sort((a, b) => a - b);
      const openPannaStr = openDigits.join('');
      const openAnkVal = openDigits.reduce((s, d) => s + d, 0) % 10;

      // 2. Generate Close Panna (3 numbers, sorted ascending)
      const closeDigits = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ].sort((a, b) => a - b);
      const closePannaStr = closeDigits.join('');
      const closeAnkVal = closeDigits.reduce((s, d) => s + d, 0) % 10;

      const jodiStr = `${openAnkVal}${closeAnkVal}`;
      const fullResultStr = `${openPannaStr}-${jodiStr}-${closePannaStr}`;

      let won = false;
      let multiplier = 0;

      if (betType === 'single') {
        const pNum = parseInt(selectedNumber);
        won = pNum === openAnkVal || pNum === closeAnkVal;
        multiplier = 9;
      } else if (betType === 'jodi') {
        won = selectedNumber === jodiStr;
        multiplier = 90;
      } else if (betType === 'panna') {
        won = selectedNumber === openPannaStr || selectedNumber === closePannaStr;
        multiplier = 140;
      }

      const winnings = won ? betAmount * multiplier : 0;

      setGameResult({
        openPanna: openPannaStr,
        openAnk: openAnkVal,
        closeAnk: closeAnkVal,
        closePanna: closePannaStr,
        jodi: jodiStr,
        resultString: fullResultStr,
      });

      setHasWon(won);
      setPayoutAmount(winnings);
      setIsShaking(false);

      if (won) {
        onUpdateBalance(winnings);
        setMatkaSuccess(`🎉 Double Match! You Won $${winnings.toLocaleString()}!`);
      } else {
        setMatkaSuccess('');
      }

      // Add to recent draws history
      setRecentDraws((prev) => {
        const hist = prev[selectedMarketId] || [];
        return {
          ...prev,
          [selectedMarketId]: [jodiStr, ...hist.slice(0, 4)],
        };
      });

      // Update the current market live result text in display
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id === selectedMarketId) {
            return { ...m, liveResult: fullResultStr };
          }
          return m;
        })
      );
    }, 1800);
  };

  return (
    <section id="matka" className="pt-2 pb-12 md:pt-4 md:pb-16 select-none scroll-mt-20">
      
      {/* 1. Header Card Panel in line with the brand identity */}
      <div className="bg-[#1b1224]/80 rounded-2xl border border-[#3b1a54]/50 p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md mb-6 flex flex-col gap-4">
        
        {/* Decorative Grid Background Accent */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d946ef_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Top block: Brand Logo square and details */}
        <div className="flex items-center gap-4 relative z-10">
          
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0f0714] border border-[#d946ef]/30 flex items-center justify-center shadow-lg shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-10 h-10 sm:w-11 sm:h-11 text-amber-400 fill-current filter drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Golden Satta Matka Clay Pot Vector icon */}
              <path d="M 50 12 C 40 12, 38 18, 38 22 L 62 22 C 62 18, 60 12, 50 12 Z" />
              <path d="M 38 22 Q 22 45, 22 62 C 22 82, 34 88, 50 88 C 66 88, 78 82, 78 62 Q 78 45, 62 22 Z" />
              {/* Engraved star decorative symbol */}
              <path d="M 50 42 L 53 49 L 60 50 L 55 55 L 56 62 L 50 58 L 44 62 L 45 55 L 40 50 L 47 49 Z" fill="#000" opacity="0.6" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight leading-tight">
              Damru Satta Matka
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 font-sans">{formattedTotalPlaying} Players Live</span>
            </div>
          </div>
        </div>

        {/* Quick Statistics below */}
        <div className="grid grid-cols-3 gap-1 relative z-10 bg-[#0c0510]/85 border border-[#d946ef]/10 px-4 py-2.5 rounded-xl shrink-0 divide-x divide-white/5">
          <div className="text-left pr-1">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">
              {markets.length} Active
            </div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Bazar Markets</div>
          </div>

          <div className="text-left px-2 sm:px-3">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">
              $4.5M
            </div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Total Wagered</div>
          </div>

          <div className="text-left pl-2 sm:pl-3">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">
              12.4K
            </div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Draws Settled</div>
          </div>
        </div>

      </div>

      {/* 2. Interactive Selection Row (Grid of Markets on Left, Play Desk on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7 COLUMNS: ACTIVE BAZAR MARKETS LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-[#555]" />
              <input
                type="text"
                placeholder="Search Bazar Markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-white/5 focus:border-[#d946ef] rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none transition-all placeholder:text-[#444]"
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono">Select a Bazar to open play desk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMarkets.map((market) => {
              const isSelected = selectedMarketId === market.id;
              
              return (
                <div
                  key={market.id}
                  onClick={() => {
                    setSelectedMarketId(market.id);
                    setMatkaError('');
                    setMatkaSuccess('');
                    setSelectedNumber('');
                  }}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isSelected
                      ? `bg-gradient-to-br ${market.bgColor} border-amber-500/40 shadow-[0_0_20px_rgba(217,70,239,0.15)] scale-[1.01]`
                      : 'bg-[#121212]/40 border-white/5 hover:border-white/10 hover:bg-[#121212]/80'
                  }`}
                >
                  {/* Decorative background glow if selected */}
                  {isSelected && (
                    <div className="absolute -right-12 -top-12 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                  )}

                  {/* Top Bar: Timings & Status */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-mono text-[#aaa] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {market.openTime}
                    </span>
                    <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      market.status === 'OPEN' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                      {market.status}
                    </span>
                  </div>

                  {/* Market Title */}
                  <h3 className="text-base font-display font-black text-white tracking-wide mb-1">
                    {market.name}
                  </h3>

                  {/* Current Active Live Results Draw Board */}
                  <div className="mt-3 bg-black/45 rounded-xl border border-white/5 px-3 py-2 flex items-center justify-between">
                    <span className="text-[9px] text-[#666] font-mono font-bold uppercase tracking-wider">Live Jodi</span>
                    <span className="text-sm font-mono font-black text-amber-400 tracking-wider">
                      {market.liveResult}
                    </span>
                  </div>

                  {/* Subtitle players counter */}
                  <div className="mt-3 pt-2 border-t border-white/[0.03] flex items-center justify-between">
                    <span className="text-[9px] text-[#666]">Draw Settle Time: {market.closeTime}</span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">{market.playersCount.toLocaleString()} online</span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: INTERACTIVE SATTA MATKA PLAY DESK */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#180e22] to-[#0c0514] border border-[#d946ef]/15 rounded-3xl p-4 sm:p-5 space-y-5 shadow-2xl relative overflow-hidden">
          
          <div className="absolute -right-24 -top-24 w-60 h-60 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Title Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">PLAY DESK</span>
              <h3 className="text-lg font-display font-black text-white">{selectedMarket.name}</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> Live
            </div>
          </div>

          {/* Tab Selection: Single, Jodi, Panna */}
          <div className="grid grid-cols-3 gap-1 bg-[#09030c] p-1 rounded-xl border border-white/5">
            {(['single', 'jodi', 'panna'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setBetType(type);
                  setSelectedNumber('');
                  setMatkaError('');
                  setMatkaSuccess('');
                }}
                className={`py-2 px-1 rounded-lg font-display font-black text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  betType === type
                    ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-md'
                    : 'text-[#888] hover:text-white'
                }`}
              >
                {type === 'single' ? 'Single Ank (9x)' : type === 'jodi' ? 'Jodi (90x)' : 'Panna (140x)'}
              </button>
            ))}
          </div>

          {/* Selected Number Grid Input */}
          <div className="space-y-3 bg-[#0d0714] p-4 rounded-2xl border border-[#d946ef]/10">
            {betType === 'single' && (
              <div className="space-y-3">
                <label className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider block text-center">Select your Single Ank (0-9)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                    const isSelected = selectedNumber === String(num);
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setSelectedNumber(String(num));
                          setMatkaError('');
                        }}
                        className={`py-3.5 rounded-xl font-bold font-mono text-sm border cursor-pointer transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500 border-amber-400 text-white font-black scale-[1.05]'
                            : 'bg-black/45 border-white/5 text-[#ccc] hover:border-rose-500/20'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {betType === 'jodi' && (
              <div className="space-y-3.5">
                <label className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider block text-center">Select your Jodi digits (00-99)</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Left Digit selection */}
                  <div className="space-y-1 bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] text-[#666] font-bold block uppercase tracking-wider text-center">Left Ank</span>
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
                            className={`w-6 h-6 rounded-lg font-bold font-mono text-[10px] border cursor-pointer flex items-center justify-center transition-all ${
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

                  {/* Right Digit selection */}
                  <div className="space-y-1 bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] text-[#666] font-bold block uppercase tracking-wider text-center">Right Ank</span>
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
                            className={`w-6 h-6 rounded-lg font-bold font-mono text-[10px] border cursor-pointer flex items-center justify-center transition-all ${
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

                <div className="bg-black/50 px-3 py-2 rounded-xl border border-rose-500/10 flex items-center justify-between">
                  <span className="text-xs text-[#aaa]">Your Selected Jodi:</span>
                  <span className="text-base font-black font-mono text-amber-400 tracking-wider bg-[#15070a] px-3 py-1 rounded-lg border border-rose-500/20 shadow-inner">
                    {selectedNumber || '00'}
                  </span>
                </div>
              </div>
            )}

            {betType === 'panna' && (
              <div className="space-y-3">
                <label className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider block">Enter 3-Digit Panel (Panna)</label>
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
                      const digs = [
                        Math.floor(Math.random() * 10),
                        Math.floor(Math.random() * 10),
                        Math.floor(Math.random() * 10),
                      ].sort((a, b) => a - b);
                      setSelectedNumber(digs.join(''));
                    }}
                    className="py-3 px-4 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/20 transition cursor-pointer shrink-0"
                  >
                    Quick Panna
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wager Panel */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider block">Wager Amount</label>
              <span className="text-[10px] text-amber-400 font-mono font-bold">Wallet: ${userBalance.toLocaleString()}</span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3 text-rose-500 font-mono font-black text-sm">$</span>
              <input
                type="text"
                value={matkaWager}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setMatkaWager(val);
                }}
                className="w-full bg-black/50 border border-white/5 rounded-2xl py-3 pl-8 pr-16 text-xs font-mono text-white font-black focus:outline-none focus:border-rose-500 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1.5 flex gap-1">
                <button 
                  onClick={() => setMatkaWager(String(Math.max(10, Math.floor(parseInt(matkaWager || '0') / 2))))}
                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-bold text-rose-200 transition cursor-pointer"
                >
                  /2
                </button>
                <button 
                  onClick={() => setMatkaWager(String(Math.min(userBalance, parseInt(matkaWager || '0') * 2)))}
                  className="px-1.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-bold text-rose-200 transition cursor-pointer"
                >
                  x2
                </button>
                <button 
                  onClick={() => setMatkaWager(String(userBalance))}
                  className="px-1.5 py-1 bg-rose-950/50 hover:bg-rose-900 border border-rose-500/20 rounded text-[8px] font-bold text-rose-400 transition cursor-pointer"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Presets quick wager */}
            <div className="flex items-center gap-1">
              {[50, 100, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setMatkaWager(String(Math.min(userBalance, preset)));
                    setMatkaError('');
                  }}
                  className="flex-1 py-1.5 bg-white/5 hover:bg-rose-900/20 hover:text-rose-400 border border-transparent rounded-lg text-[9px] font-mono font-bold text-[#888] transition cursor-pointer"
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Warnings & Success */}
          {matkaError && (
            <div className="bg-red-950/40 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-400 font-bold text-center">
              ⚠️ {matkaError}
            </div>
          )}

          {matkaSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl text-xs text-emerald-400 font-bold text-center">
              {matkaSuccess}
            </div>
          )}

          {/* Action Draw trigger */}
          <button
            disabled={isShaking}
            onClick={playMatkaRound}
            className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white font-black font-display text-xs uppercase tracking-widest rounded-2xl transition duration-300 shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3.5 disabled:opacity-50 cursor-pointer"
          >
            <Coins className="w-4 h-4 animate-spin-slow" />
            <span>{isShaking ? 'Shaking Gold Matka...' : 'OPEN GOLD MATKA'}</span>
          </button>

          {/* Clay Pot (Matka) Animation Viewport */}
          <div className="bg-black/35 rounded-2xl p-4 border border-white/5 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[8px] text-[#666] font-bold uppercase tracking-wider block mb-2 text-center">LIVE TICKER (RECENT JODIS)</span>
              <div className="flex items-center gap-1.5 justify-center">
                {(recentDraws[selectedMarketId] || ['45', '12', '78', '90']).map((jod, i) => (
                  <div 
                    key={i} 
                    className={`px-2.5 py-1 rounded-lg font-mono font-black text-[10px] border ${
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

            {/* clay pot graphic container */}
            <div className="flex flex-col items-center justify-center py-4 relative">
              <motion.div
                animate={isShaking ? {
                  x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0],
                  y: [0, 5, -5, 3, -3, 2, -2, 0, 0, 0],
                  rotate: [0, -2, 2, -1, 1, 0, 0, 0]
                } : {}}
                transition={{ duration: 1.5, repeat: isShaking ? Infinity : 0 }}
                className="w-32 h-32 flex items-center justify-center relative select-none"
              >
                {/* Clay Pot Visual vector graphics */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter">
                  <defs>
                    <radialGradient id="matka-gold-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* ambient pot aura */}
                  <circle cx="50" cy="50" r="30" fill="url(#matka-gold-glow)" />

                  {/* The Matka Clay Pot body */}
                  <path d="M 50 15 C 42 15, 40 20, 40 25 L 60 25 C 60 20, 58 15, 50 15 Z" fill="#9a3412" stroke="#ea580c" strokeWidth="1.5" />
                  <path d="M 40 25 Q 20 48, 20 65 C 20 83, 33 87, 50 87 C 67 87, 80 83, 80 65 Q 80 48, 60 25 Z" fill="#b45309" stroke="#ea580c" strokeWidth="1.5" />
                  
                  {/* Neck bands */}
                  <rect x="36" y="25" width="28" height="3" fill="#ea580c" rx="1" />
                  <rect x="30" y="32" width="40" height="3" fill="#d97706" rx="1.5" />
                  <rect x="25" y="44" width="50" height="3" fill="#fbbf24" rx="1.5" />

                  {/* Center Star motif */}
                  <polygon points="50,48 52,53 58,54 53,58 54,64 50,60 46,64 47,58 42,54 48,53" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
                </svg>

                {/* Sparkling overlays */}
                {isShaking && (
                  <>
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
                    <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-rose-400 animate-ping" />
                  </>
                )}
              </motion.div>

              {/* Dynamic Settle Results block inside desk */}
              <AnimatePresence>
                {gameResult && !isShaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-4 bg-black/60 border border-white/5 rounded-2xl p-3.5 w-full text-center space-y-2 relative"
                  >
                    <span className="text-[9px] font-black text-amber-400 block uppercase tracking-wider">MATKA DRAW RESULT</span>
                    
                    <div className="flex items-center justify-center gap-2.5 font-mono">
                      <div className="bg-[#1c120c] px-3 py-2 rounded-xl border border-amber-600/20">
                        <span className="text-[8px] text-[#666] block">OPEN PANNA</span>
                        <span className="text-sm font-black text-white">{gameResult.openPanna}</span>
                      </div>

                      <div className="bg-[#240c11] px-3.5 py-2.5 rounded-xl border border-rose-600/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] flex flex-col items-center">
                        <span className="text-[8px] text-rose-400 block font-black">JODI</span>
                        <span className="text-lg font-black text-rose-400 tracking-widest">{gameResult.jodi}</span>
                      </div>

                      <div className="bg-[#1c120c] px-3 py-2 rounded-xl border border-amber-600/20">
                        <span className="text-[8px] text-[#666] block">CLOSE PANNA</span>
                        <span className="text-sm font-black text-white">{gameResult.closePanna}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] text-white/50 block">Full Draw String:</span>
                      <span className="text-xs font-mono font-black text-amber-300 tracking-widest bg-black/30 px-3 py-1 rounded border border-white/5 inline-block mt-1">
                        {gameResult.resultString}
                      </span>
                    </div>

                    {hasWon !== null && (
                      <div className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-black uppercase ${
                        hasWon 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'bg-black/40 text-[#666] border border-white/5'
                      }`}>
                        {hasWon ? `🎉 WINNER +$${payoutAmount}` : '❌ TRY AGAIN'}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
