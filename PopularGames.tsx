import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, Flame, Users, Sparkles } from 'lucide-react';
import { Game } from '../types';

interface PopularGamesProps {
  onPlayOriginal: (gameId: string) => void;
}

export default function PopularGames({ onPlayOriginal }: PopularGamesProps) {
  const [filter, setFilter] = useState<'all' | 'slots' | 'live' | 'table'>('all');
  const [search, setSearch] = useState('');
  
  // Seed state with realistic favorited games
  const [games, setGames] = useState<Game[]>([
    { id: 'p1', name: 'Gates of Olympus', category: 'slots', provider: 'Pragmatic Play', playersOnline: 8412, isFavorite: true },
    { id: 'p2', name: 'Crazy Time Live', category: 'live', provider: 'Evolution Gaming', playersOnline: 12404 },
    { id: 'p3', name: 'Sweet Bonanza', category: 'slots', provider: 'Pragmatic Play', playersOnline: 6109 },
    { id: 'p4', name: 'Lightning Roulette', category: 'live', provider: 'Evolution Gaming', playersOnline: 9482, isFavorite: true },
    { id: 'p5', name: 'Book of Dead', category: 'slots', provider: 'Play\'n GO', playersOnline: 3512 },
    { id: 'p6', name: 'Multihand Blackjack', category: 'table', provider: 'Damru Studios', playersOnline: 1842 },
    { id: 'p7', name: 'Sugar Rush', category: 'slots', provider: 'Pragmatic Play', playersOnline: 4920 },
    { id: 'p8', name: 'Baccarat Deluxe', category: 'table', provider: 'NetEnt', playersOnline: 1241 },
    { id: 'p9', name: 'Monopoly Live Show', category: 'live', provider: 'Evolution Gaming', playersOnline: 5122 },
    { id: 'p10', name: 'Wanted Dead or a Wild', category: 'slots', provider: 'Hacksaw Gaming', playersOnline: 6241 }
  ]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGames(prev =>
      prev.map(game => (game.id === id ? { ...game, isFavorite: !game.isFavorite } : game))
    );
  };

  const handleGamePlay = (game: Game) => {
    // If they click on our original table/blackjack, let's route them to Plinko/Keno/Mines!
    if (game.category === 'table') {
      onPlayOriginal('mines');
    } else {
      // Simulate launching slot
      onPlayOriginal('plinko');
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesFilter = filter === 'all' || game.category === filter;
    const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase()) || 
                          game.provider.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Unique high-quality visual thumbnails for slots based on gradients & stylized vectors
  const getThumbnailGradient = (id: string) => {
    const maps: Record<string, string> = {
      p1: 'from-amber-400 via-yellow-900 to-[#121212]', // Gates of Olympus
      p2: 'from-pink-500 via-rose-950 to-[#121212]',  // Crazy Time
      p3: 'from-purple-400 via-pink-900 to-[#121212]', // Sweet Bonanza
      p4: 'from-amber-600 via-red-950 to-[#121212]',   // Lightning Roulette
      p5: 'from-amber-800 via-orange-950 to-[#121212]', // Book of Dead
      p6: 'from-emerald-500 via-teal-950 to-[#121212]', // Blackjack
      p7: 'from-pink-400 via-purple-900 to-[#121212]', // Sugar Rush
      p8: 'from-blue-600 via-slate-900 to-[#121212]',   // Baccarat
      p9: 'from-yellow-500 via-amber-900 to-[#121212]', // Monopoly
      p10: 'from-red-600 via-neutral-900 to-[#121212]'  // Wanted Dead
    };
    return maps[id] || 'from-brand/20 via-card-dark to-[#121212]';
  };

  return (
    <section id="casino" className="py-12 md:py-16 border-t border-white/5">
      
      {/* Search & Filters HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        {/* Category toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 select-none">
          {[
            { id: 'all', label: 'All Games' },
            { id: 'slots', label: 'Slots' },
            { id: 'live', label: 'Live Casino' },
            { id: 'table', label: 'Table Games' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-full border transition shrink-0 ${
                filter === cat.id
                  ? 'bg-brand text-black border-brand font-bold shadow-glow'
                  : 'bg-card-dark border-white/5 text-[#bdbdbd] hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#bdbdbd]" />
          <input
            type="text"
            placeholder="Search by game name or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card-dark border border-white/5 hover:border-[#38bdf8]/40 text-white text-xs rounded-xl focus:border-[#38bdf8] focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-transparent transition-all placeholder:text-white"
          />
        </div>
      </div>

      {/* Grid of Slots & Casino Games */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                onClick={() => handleGamePlay(game)}
                className="group bg-card-dark border border-white/5 rounded-2xl overflow-hidden hover:border-brand/30 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-md relative"
              >
                {/* Image Placeholder with gradients and high-end stylized layouts */}
                <div className={`relative aspect-4/3 w-full bg-gradient-to-br ${getThumbnailGradient(game.id)} overflow-hidden flex flex-col justify-between p-3`}>
                  {/* Decorative float sparkles */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {game.playersOnline > 6000 && (
                      <span className="text-[9px] font-bold font-mono text-black bg-brand px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                        <Flame className="w-2.5 h-2.5 fill-black" /> HOT
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(game.id, e)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-[#bdbdbd] hover:text-red-400 hover:scale-110 active:scale-95 transition-all z-20"
                  >
                    <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Decorative title stylized vector representation */}
                  <div className="my-auto text-center flex flex-col items-center">
                    <Sparkles className="w-8 h-8 text-white/25 group-hover:scale-110 group-hover:rotate-12 transition duration-300" />
                    <span className="text-white font-display font-black text-sm italic tracking-tight uppercase select-none mt-2 group-hover:tracking-wider transition-all duration-300">
                      {game.name.split(' ')[0]}
                    </span>
                  </div>

                  {/* Provider label overlay */}
                  <div className="text-[9px] font-semibold text-white/50 tracking-wider">
                    {game.provider}
                  </div>
                </div>

                {/* Info Text Box */}
                <div className="p-3.5 bg-card-dark/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-wide truncate group-hover:text-brand transition-colors">
                      {game.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#bdbdbd]">
                    <span className="capitalize">{game.category}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#666]" /> {game.playersOnline.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-card-dark/30 border border-white/5 rounded-2xl">
          <Search className="w-12 h-12 text-[#666] mb-3 animate-pulse" />
          <h4 className="text-lg font-bold text-white mb-1">No matching games found</h4>
          <p className="text-xs text-[#bdbdbd] max-w-sm">We couldn't find any slots or live tables that match your search terms. Try searching for "Pragmatic" or "Evolution".</p>
        </div>
      )}
    </section>
  );
}
