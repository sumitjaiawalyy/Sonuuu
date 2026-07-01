import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Compass, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface SportsProps {
  userBalance: number;
  onUpdateBalance: (amount: number) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

interface Match {
  id: string;
  sport: 'cricket' | 'soccer' | 'football';
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  drawOdds?: number;
  awayOdds: number;
  time: string;
  isLive: boolean;
  score?: string;
}

export default function Sports({ userBalance, onUpdateBalance, isLoggedIn, onOpenAuth }: SportsProps) {
  const [selectedSport, setSelectedSport] = useState<'all' | 'cricket' | 'soccer' | 'football'>('all');
  const [betSlip, setBetSlip] = useState<{
    match: Match;
    option: 'home' | 'draw' | 'away';
    odds: number;
    teamName: string;
  } | null>(null);
  const [betAmount, setBetAmount] = useState<string>('100');
  const [betStatus, setBetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [betMessage, setBetMessage] = useState('');

  const matches: Match[] = [
    {
      id: 'm1',
      sport: 'cricket',
      league: 'Indian Premier League',
      homeTeam: 'Mumbai Indians',
      awayTeam: 'Chennai Super Kings',
      homeOdds: 1.85,
      awayOdds: 1.95,
      time: 'Live - Over 14.2',
      isLive: true,
      score: '142/3 - 128/4'
    },
    {
      id: 'm2',
      sport: 'soccer',
      league: 'UEFA Champions League',
      homeTeam: 'Real Madrid',
      awayTeam: 'Manchester City',
      homeOdds: 2.45,
      drawOdds: 3.40,
      awayOdds: 2.80,
      time: 'Live - 65\'',
      isLive: true,
      score: '2 - 1'
    },
    {
      id: 'm3',
      sport: 'football',
      league: 'NFL Regular Season',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'San Francisco 49ers',
      homeOdds: 1.72,
      awayOdds: 2.20,
      time: 'Today, 23:30',
      isLive: false
    },
    {
      id: 'm4',
      sport: 'cricket',
      league: 'T20 World Cup',
      homeTeam: 'India',
      awayTeam: 'Australia',
      homeOdds: 1.65,
      awayOdds: 2.25,
      time: 'Tomorrow, 15:00',
      isLive: false
    },
    {
      id: 'm5',
      sport: 'soccer',
      league: 'English Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      homeOdds: 1.55,
      drawOdds: 4.10,
      awayOdds: 5.50,
      time: 'Tomorrow, 19:45',
      isLive: false
    }
  ];

  const filteredMatches = selectedSport === 'all' 
    ? matches 
    : matches.filter(m => m.sport === selectedSport);

  const handleSelectOdd = (match: Match, option: 'home' | 'draw' | 'away', odds: number, teamName: string) => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }
    setBetStatus('idle');
    setBetMessage('');
    setBetSlip({ match, option, odds, teamName });
  };

  const handlePlaceBet = () => {
    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }
    if (!betSlip) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setBetStatus('error');
      setBetMessage('Please enter a valid practice amount.');
      return;
    }

    if (userBalance < amount) {
      setBetStatus('error');
      setBetMessage('Insufficient practice balance! Use the Reset Wallet HUD at the bottom right to refill.');
      return;
    }

    // Deduct practice balance
    onUpdateBalance(-amount);
    
    setBetStatus('success');
    const potentialWin = (amount * betSlip.odds).toFixed(2);
    setBetMessage(`Practice bet placed successfully on ${betSlip.teamName}! Potential return: $${potentialWin} credits.`);
    
    // Auto clear slip after some time
    setTimeout(() => {
      setBetSlip(null);
      setBetStatus('idle');
      setBetMessage('');
    }, 4500);
  };

  return (
    <section id="sports" className="py-12 md:py-16 border-t border-white/5 select-none scroll-mt-20">
      
      {/* Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest block mb-2 font-display">PRACTICE SPORTSBOOK</span>
          <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
            Live Sports <span className="text-brand">Betting</span>
          </h2>
        </div>

        {/* Filter categories tabs */}
        <div className="flex items-center gap-1.5 bg-[#121212]/60 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none max-w-full">
          {(['all', 'cricket', 'soccer', 'football'] as const).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${
                selectedSport === sport
                  ? 'bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/10'
                  : 'text-[#bdbdbd] hover:text-white'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Match list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMatches.map((match) => (
            <div 
              key={match.id}
              className="bg-[#121212] border border-white/5 hover:border-[#38bdf8]/20 transition-all p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden"
            >
              {/* Live Badge Glow line decoration */}
              {match.isLive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ef4444] shadow-[0_0_10px_#ef4444]" />
              )}

              {/* Teams & League details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-[#666] font-bold font-mono tracking-wider uppercase">
                  {match.isLive ? (
                    <span className="flex items-center gap-1 text-[#ef4444] font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full" />
                      LIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#bdbdbd]">
                      <Clock className="w-3 h-3" />
                      UPCOMING
                    </span>
                  )}
                  <span>•</span>
                  <span>{match.league}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="text-sm font-black text-white">{match.homeTeam}</span>
                    {match.isLive && match.score && (
                      <span className="text-xs font-mono font-bold text-[#38bdf8] bg-[#0d1f30] px-1.5 py-0.5 rounded border border-[#2596be]/20">
                        {match.score.split('-')[0].trim()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="text-sm font-black text-white">{match.awayTeam}</span>
                    {match.isLive && match.score && (
                      <span className="text-xs font-mono font-bold text-[#38bdf8] bg-[#0d1f30] px-1.5 py-0.5 rounded border border-[#2596be]/20">
                        {match.score.split('-')[1].trim()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#bdbdbd] font-semibold">
                  {match.time}
                </div>
              </div>

              {/* Odds buttons list */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSelectOdd(match, 'home', match.homeOdds, match.homeTeam)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[65px] h-14 ${
                    betSlip?.match.id === match.id && betSlip?.option === 'home'
                      ? 'bg-[#38bdf8] text-black border-[#38bdf8]'
                      : 'bg-[#181818] text-[#bdbdbd] border-white/5 hover:border-[#38bdf8]/30 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] font-mono uppercase font-semibold leading-none mb-1">1</span>
                  <span className="text-xs font-black font-mono">{match.homeOdds.toFixed(2)}</span>
                </button>

                {match.drawOdds !== undefined && (
                  <button
                    onClick={() => handleSelectOdd(match, 'draw', match.drawOdds!, 'Draw')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[65px] h-14 ${
                      betSlip?.match.id === match.id && betSlip?.option === 'draw'
                        ? 'bg-[#38bdf8] text-black border-[#38bdf8]'
                        : 'bg-[#181818] text-[#bdbdbd] border-white/5 hover:border-[#38bdf8]/30 hover:text-white'
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase font-semibold leading-none mb-1">X</span>
                    <span className="text-xs font-black font-mono">{match.drawOdds.toFixed(2)}</span>
                  </button>
                )}

                <button
                  onClick={() => handleSelectOdd(match, 'away', match.awayOdds, match.awayTeam)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[65px] h-14 ${
                    betSlip?.match.id === match.id && betSlip?.option === 'away'
                      ? 'bg-[#38bdf8] text-black border-[#38bdf8]'
                      : 'bg-[#181818] text-[#bdbdbd] border-white/5 hover:border-[#38bdf8]/30 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] font-mono uppercase font-semibold leading-none mb-1">2</span>
                  <span className="text-xs font-black font-mono">{match.awayOdds.toFixed(2)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Betslip Column */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-display font-black text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#38bdf8]" /> Quick Practice Bet Slip
            </h3>
            {betSlip && (
              <button 
                onClick={() => setBetSlip(null)} 
                className="text-xs font-bold text-[#888] hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {betSlip ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Selected bet info card */}
                <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <div className="text-[10px] text-[#666] font-mono font-bold tracking-widest uppercase">
                    {betSlip.match.league}
                  </div>
                  <div className="text-xs font-bold text-[#bdbdbd]">
                    {betSlip.match.homeTeam} vs {betSlip.match.awayTeam}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-black text-white">
                      {betSlip.teamName} <span className="text-xs font-bold text-[#38bdf8] font-mono">@{betSlip.odds.toFixed(2)}</span>
                    </span>
                    <span className="text-[10px] text-[#888] font-mono">Match Winner</span>
                  </div>
                </div>

                {/* Bet Input amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#bdbdbd] font-bold uppercase tracking-wider block">Wager Practice Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-[#666] text-sm font-mono font-bold">$</span>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => {
                        setBetAmount(e.target.value);
                        setBetStatus('idle');
                        setBetMessage('');
                      }}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-8 pr-4 text-sm font-mono text-white font-black focus:outline-none focus:border-[#38bdf8] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Return estimation */}
                {parseFloat(betAmount) > 0 && (
                  <div className="flex items-center justify-between text-xs p-1">
                    <span className="text-[#888] font-semibold">Estimated Practice Return</span>
                    <span className="text-brand font-black font-mono">
                      ${(parseFloat(betAmount) * betSlip.odds).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Feedback status log box */}
                {betStatus !== 'idle' && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    betStatus === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {betStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    )}
                    <span>{betMessage}</span>
                  </div>
                )}

                {/* Place Bet action button */}
                <button
                  onClick={handlePlaceBet}
                  disabled={betStatus === 'success'}
                  className="w-full py-3.5 bg-[#38bdf8] hover:bg-[#52cfff] disabled:bg-[#152e47] disabled:text-[#38bdf8]/50 text-black font-black font-display text-sm rounded-xl transition duration-300 shadow-lg shadow-[#38bdf8]/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  Place Practice Wager
                </button>
              </motion.div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <Compass className="w-10 h-10 text-[#444] animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white">No active selection</h4>
                  <p className="text-xs text-[#666] max-w-xs mt-1 px-4 leading-relaxed">
                    Click on any match multiplier odds on the left to initialize a quick practice bet slip immediately.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
