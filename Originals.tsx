import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Flame, Search, Gamepad2, Sparkles, Star } from 'lucide-react';
import { ActiveGameType } from '../types';

interface OriginalsProps {
  onPlayGame: (game: ActiveGameType) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

interface OriginalCard {
  id: ActiveGameType;
  name: string;
  players: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  illustration: React.ReactNode;
}

export default function Originals({ onPlayGame, isLoggedIn, onOpenAuth }: OriginalsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [playerCounts, setPlayerCounts] = useState<{ [key in ActiveGameType]?: number }>({
    limbo: 1824,
    coinflip: 942,
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlayerCounts((prev) => {
        const next = { ...prev };
        (Object.keys(next) as ActiveGameType[]).forEach((key) => {
          const current = next[key] || 2000;
          // small gradual step: between -15 and +15 (no huge sudden jumps)
          const step = Math.floor(Math.random() * 31) - 15;
          let updated = current + step;
          // strictly clamp between 1400 and 2900
          if (updated < 1400) updated = 1400 + Math.abs(step);
          if (updated > 2900) updated = 2900 - Math.abs(step);
          next[key] = updated;
        });
        return next;
      });
    }, 4000); // realistic pacing

    return () => clearInterval(interval);
  }, []);

  const totalPlaying = (Object.keys(playerCounts) as ActiveGameType[]).reduce(
    (sum, key) => sum + (playerCounts[key] || 0),
    0
  );
  const formattedTotalPlaying = (totalPlaying / 1000).toFixed(2) + 'K';

  const originalGames: OriginalCard[] = [
    {
      id: 'limbo',
      name: 'Limbo',
      players: '1.8K',
      bgColor: 'from-[#1a2e1d] to-[#0c140f]',
      borderColor: 'border-[#dbfd4e]/20 group-hover:border-[#dbfd4e]/50',
      accentColor: '#dbfd4e',
      illustration: (
        <svg className="w-16 h-16 text-[#dbfd4e]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 8 52 C 24 52, 40 46, 54 18" stroke="#dbfd4e" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 2" className="animate-pulse" />
          <path d="M 8 52 C 24 52, 40 46, 54 18" stroke="#dbfd4e" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="54" cy="18" r="6" fill="#dbfd4e" className="animate-ping opacity-75" />
          <circle cx="54" cy="18" r="4.5" fill="#0b0b0b" stroke="#dbfd4e" strokeWidth="3" />
          <path d="M 54 18 L 46 12 M 54 18 L 48 24" stroke="#dbfd4e" strokeWidth="2.5" strokeLinecap="round" />
          <text x="14" y="30" fill="#dbfd4e" fontSize="9" fontWeight="900" fontFamily="monospace">99.00x</text>
        </svg>
      )
    },
    {
      id: 'dice',
      name: 'Dice',
      players: '1.2K',
      bgColor: 'from-[#142333] to-[#0a1017]',
      borderColor: 'border-[#2596be]/20 group-hover:border-[#2596be]/50',
      accentColor: '#2596be',
      illustration: (
        <svg className="w-16 h-16 text-[#2596be]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="24" width="22" height="22" rx="4" fill="#0b0b0b" stroke="#2596be" strokeWidth="2.5" transform="rotate(-12 12 24)" />
          <circle cx="20" cy="24" r="2" fill="#2596be" />
          <circle cx="28" cy="32" r="2" fill="#2596be" />
          <rect x="32" y="16" width="20" height="20" rx="4" fill="#0b0b0b" stroke="#2596be" strokeWidth="2" strokeDasharray="1 1" transform="rotate(15 32 16)" />
          <circle cx="44" cy="22" r="1.5" fill="#2596be" />
        </svg>
      )
    },
    {
      id: 'mines',
      name: 'Mines',
      players: '2.1K',
      bgColor: 'from-[#251433] to-[#0f0a17]',
      borderColor: 'border-purple-500/10 group-hover:border-purple-500/30',
      accentColor: '#a855f7',
      illustration: (
        <svg className="w-16 h-16 text-purple-400" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="26" y="10" width="12" height="12" rx="2" fill="#a855f7" stroke="currentColor" strokeWidth="1.5" className="fill-purple-500/20" />
          <rect x="42" y="10" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10" y="26" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="26" y="26" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="42" y="26" width="12" height="12" rx="2" fill="#dbfd4e" stroke="#dbfd4e" strokeWidth="1.5" className="fill-[#dbfd4e]/20" />
          <rect x="10" y="42" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="26" y="42" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <rect x="42" y="42" width="12" height="12" rx="2" fill="#0b0b0b" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="48" cy="32" r="2" fill="#dbfd4e" />
        </svg>
      )
    },
    {
      id: 'plinko',
      name: 'Plinko',
      players: '3.5K',
      bgColor: 'from-[#142d2c] to-[#0a1716]',
      borderColor: 'border-teal-500/10 group-hover:border-teal-500/30',
      accentColor: '#14b8a6',
      illustration: (
        <svg className="w-16 h-16 text-teal-400" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="12" r="1.5" fill="currentColor" />
          <circle cx="24" cy="22" r="1.5" fill="currentColor" />
          <circle cx="40" cy="22" r="1.5" fill="currentColor" />
          <circle cx="16" cy="32" r="1.5" fill="currentColor" />
          <circle cx="32" cy="32" r="1.5" fill="currentColor" />
          <circle cx="48" cy="32" r="1.5" fill="currentColor" />
          <circle cx="8" cy="42" r="1.5" fill="currentColor" />
          <circle cx="24" cy="42" r="1.5" fill="currentColor" />
          <circle cx="40" cy="42" r="1.5" fill="currentColor" />
          <circle cx="56" cy="42" r="1.5" fill="currentColor" />
          <circle cx="28" cy="27" r="3" fill="#dbfd4e" className="animate-bounce" />
          <path d="M 32 12 L 28 27" stroke="#dbfd4e" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      )
    },
    {
      id: 'coinflip',
      name: 'Coin Flip',
      players: '940',
      bgColor: 'from-[#2e2614] to-[#141007]',
      borderColor: 'border-yellow-500/20 group-hover:border-yellow-500/50',
      accentColor: '#fbbf24',
      illustration: (
        <svg className="w-16 h-16 text-yellow-400" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="18" fill="#0b0b0b" stroke="currentColor" strokeWidth="2.5" className="animate-pulse" />
          <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="32" y="37" fill="currentColor" fontSize="14" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">₹</text>
        </svg>
      )
    }
  ];

  const filteredGames = originalGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayClick = (gameId: ActiveGameType) => {
    if (!isLoggedIn) {
      onOpenAuth('login');
    } else {
      onPlayGame(gameId);
    }
  };

  return (
    <section id="originals" className="pt-2 pb-12 md:pt-4 md:pb-16 select-none scroll-mt-20">
      
      {/* 1. Header Card Panel resembling screenshot */}
      <div className="bg-[#15242f]/80 rounded-2xl border border-[#1d3d52]/50 p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md mb-6 flex flex-col gap-4">
        
        {/* Decorative Grid Background Accent */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Top block: Brand Logo square and details */}
        <div className="flex items-center gap-4 relative z-10">
          
          {/* Square container with website's official logo */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0d1c25] border border-[#2596be]/30 flex items-center justify-center shadow-lg shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-10 h-10 sm:w-11 sm:h-11 text-[#dbfd4e] fill-current filter drop-shadow-[0_0_6px_rgba(219,253,78,0.3)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left vertical capsule */}
              <rect x="2.5" y="15" width="10" height="70" rx="5" />
              {/* Bowtie / Hourglass shape */}
              <path d="M 22 15 L 50 50 L 22 85 Z M 78 15 L 78 85 L 50 50 Z" />
              {/* Right vertical capsule */}
              <rect x="87.5" y="15" width="10" height="70" rx="5" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight leading-tight">
              Damru Originals
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 font-sans">{formattedTotalPlaying} Playing</span>
            </div>
          </div>
        </div>

        {/* Bottom block: Quick Statistics aligned in a single horizontal row below the title */}
        <div className="grid grid-cols-3 gap-1 relative z-10 bg-[#0c161e]/80 border border-[#2596be]/10 px-4 py-2.5 rounded-xl shrink-0 divide-x divide-white/5">
          
          <div className="text-left pr-1">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">0</div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Games</div>
          </div>

          <div className="text-left px-2 sm:px-3">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">$12.8M</div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Wagered</div>
          </div>

          <div className="text-left pl-2 sm:pl-3">
            <div className="text-sm sm:text-base md:text-lg font-sans font-black text-white leading-none">450K</div>
            <div className="text-[9px] text-[#888] font-bold uppercase tracking-wider mt-1">Bets</div>
          </div>

        </div>
      </div>

      {/* 2. Search panel (No Follow button, No All Publishers, No Popular - as requested) */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#666]" />
          <input
            type="text"
            placeholder="Search Damru Originals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/5 focus:border-[#38bdf8] hover:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white focus:outline-none transition-all placeholder:text-[#555]"
          />
        </div>
      </div>

      {/* 3. Grid of Games - styled with exactly the same card aesthetics as screenshot */}
      <AnimatePresence mode="popLayout">
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-5">
            {filteredGames.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                onClick={() => handlePlayClick(game.id)}
                className="group flex flex-col justify-between cursor-pointer"
              >
                {/* Visual card content with vibrant gradient and matching border - matching home page size */}
                <div className={`relative aspect-[10/11.8] bg-gradient-to-b ${game.bgColor} rounded-2xl border ${game.borderColor} overflow-hidden shadow-xl transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between p-3.5`}>
                  
                  {/* Subtle glowing card ring */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  
                  {/* Card Header text overlay */}
                  <div className="relative z-10 space-y-0.5">
                    <h3 className="text-lg sm:text-xl font-display font-black text-white tracking-wider leading-none drop-shadow-sm">
                      {game.name}
                    </h3>
                    <p className="text-[7px] sm:text-[8px] font-sans font-black text-white/50 tracking-widest leading-none">
                      DAMRU ORIGINALS
                    </p>
                  </div>

                  {/* Centerpiece illustration - scaled and made snug */}
                  <div className="relative w-full h-[52%] flex items-center justify-center my-0.5 select-none overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full scale-[0.88] flex items-center justify-center">
                      {game.illustration}
                    </div>
                  </div>

                  {/* Play Action Hover Indicator bar */}
                  <div className="relative z-10 flex items-center justify-between pt-1">
                    <span className="text-[9px] font-black text-white/80 group-hover:text-white transition-colors uppercase font-display">
                      Launch Game
                    </span>
                    <div className="w-7 h-7 rounded-full bg-black/30 group-hover:bg-[#dbfd4e] border border-white/10 group-hover:border-[#dbfd4e] flex items-center justify-center text-white group-hover:text-black transition-all shadow-md">
                      <Play className="w-2.5 h-2.5 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Monospaced active playing count below the card (exactly matching screenshot) */}
                <div className="mt-2.5 flex items-center gap-1.5 px-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_4px_#10b981]" />
                  <span className="text-[10px] font-sans font-bold text-[#888] group-hover:text-white transition-colors">
                    {(playerCounts[game.id] || 2000).toLocaleString()} playing
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-[#121212]/30 border border-white/5 rounded-2xl p-6">
            <div className="w-16 h-16 rounded-full bg-[#dbfd4e]/10 border border-[#dbfd4e]/20 flex items-center justify-center mb-4 text-[#dbfd4e] animate-pulse">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-white uppercase tracking-wider">Original Games Rebuilding</h4>
            <p className="text-xs text-[#888] max-w-sm mt-2 font-medium leading-relaxed">
              We are currently rebuilding all certified Damru in-house games one-by-one from scratch with pristine quality, improved physics, and real-time multiplayer! Stay tuned for the first drop!
            </p>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

