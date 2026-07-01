import { useState, useEffect } from 'react';
import { LiveWinner } from '../types';
import { Trophy, TrendingUp } from 'lucide-react';

export default function LiveWinners() {
  const [winners, setWinners] = useState<LiveWinner[]>([
    { id: 'w1', username: 'CryptoKing', gameName: 'Limbo', betAmount: 12.50, multiplier: 12.50, payout: 156.25, timestamp: '10s ago' },
    { id: 'w2', username: 'StakeHigh', gameName: 'Mines', betAmount: 100.00, multiplier: 3.42, payout: 342.00, timestamp: '12s ago' },
    { id: 'w3', username: 'MoonShot', gameName: 'Dice', betAmount: 5.00, multiplier: 99.00, payout: 495.00, timestamp: '15s ago' },
    { id: 'w4', username: 'LuckySam', gameName: 'Plinko', betAmount: 25.00, multiplier: 8.20, payout: 205.00, timestamp: '18s ago' },
    { id: 'w5', username: 'Spinderella', gameName: 'Sweet Bonanza', betAmount: 1.50, multiplier: 142.00, payout: 213.00, timestamp: '20s ago' },
    { id: 'w6', username: 'ZenMaster', gameName: 'Keno', betAmount: 10.00, multiplier: 15.00, payout: 150.00, timestamp: '24s ago' },
    { id: 'w7', username: 'GoldDigger', gameName: 'Gates of Olympus', betAmount: 2.00, multiplier: 500.00, payout: 1000.00, timestamp: '28s ago' },
    { id: 'w8', username: 'PlinkoBabe', gameName: 'Plinko', betAmount: 50.00, multiplier: 2.00, payout: 100.00, timestamp: '32s ago' },
  ]);

  // Periodically insert a new winner at the start to simulate active platform live feeds
  useEffect(() => {
    const games = ['Limbo', 'Dice', 'Mines', 'Plinko', 'Keno', 'Gates of Olympus', 'Sweet Bonanza', 'Blackjack', 'Roulette'];
    const users = ['NeonRider', 'SatoshiS', 'DiceGod', 'Minesweeper', 'VegasVibe', 'HighRoller77', 'JackpotKid', 'LuckyLady', 'WhaleTrader'];
    
    const interval = setInterval(() => {
      const selectedGame = games[Math.floor(Math.random() * games.length)];
      const selectedUser = users[Math.floor(Math.random() * users.length)];
      const betAmount = parseFloat((Math.random() * 45 + 5).toFixed(2));
      const multiplier = parseFloat((Math.random() * 8 + 1.1).toFixed(2));
      const payout = parseFloat((betAmount * multiplier).toFixed(2));

      const newWinner: LiveWinner = {
        id: `w-gen-${Date.now()}`,
        username: selectedUser,
        gameName: selectedGame,
        betAmount,
        multiplier,
        payout,
        timestamp: 'Just now',
      };

      setWinners((prev) => {
        const updated = [newWinner, ...prev];
        if (updated.length > 15) {
          updated.pop();
        }
        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="live-winners-bar" className="w-full bg-[#121212]/30 border border-white/5 py-3 px-4 rounded-2xl overflow-hidden relative shadow-lg">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Left Side Static Title */}
        <div className="flex items-center gap-2 bg-[#171717] px-3.5 py-1.5 rounded-xl border border-white/5 shrink-0 select-none shadow-md">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <Trophy className="w-4 h-4 text-brand" />
          <span className="font-display text-xs font-black tracking-wider uppercase text-white">LIVE FEED</span>
        </div>

        {/* Sliding Ticker Wrap */}
        <div className="ticker-wrap w-full flex-1 min-w-0">
          <div className="ticker-content gap-4 flex">
            {/* Double the list for infinite looping */}
            {[...winners, ...winners].map((winner, idx) => (
              <div
                key={`${winner.id}-${idx}`}
                className="flex items-center gap-3 bg-[#0b0b0b]/60 px-4 py-2 rounded-xl border border-white/5 hover:border-brand/30 transition duration-300 shrink-0"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white font-sans flex items-center gap-1">
                    {winner.username}
                  </span>
                  <span className="text-[10px] text-[#bdbdbd] font-medium">{winner.gameName}</span>
                </div>

                <div className="flex flex-col text-right pl-2 border-l border-white/5">
                  <div className="text-[10px] font-mono text-[#666]">
                    Bet: ${winner.betAmount.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-mono font-bold text-brand bg-brand/10 px-1 py-0.2 rounded">
                      {winner.multiplier.toFixed(2)}x
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      +${winner.payout.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
