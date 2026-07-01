import { useState, useEffect } from 'react';
import { Users, Dice5, Landmark, Award } from 'lucide-react';

export default function Statistics() {
  const [onlinePlayers, setOnlinePlayers] = useState(() => {
    const min = 10387;
    const max = 40897;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });
  const [gamesCount] = useState(1842);
  const [totalPaid, setTotalPaid] = useState(142842593.42);
  const [dailyWinners, setDailyWinners] = useState(3842);

  // Periodically fluctuate statistics for real-time vitality feel
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate online players within [10387, 40897] boundaries
      setOnlinePlayers((prev) => {
        const min = 10387;
        const max = 40897;
        const delta = Math.floor(Math.random() * 201) - 100; // -100 to +100 fluctuation
        let updated = prev + delta;
        if (updated < min) updated = min + Math.floor(Math.random() * 50);
        if (updated > max) updated = max - Math.floor(Math.random() * 50);
        return updated;
      });
      
      // Accumulate total paid slowly
      setTotalPaid((prev) => prev + parseFloat((Math.random() * 8.50).toFixed(2)));
      
      // Fluctuate daily winners
      if (Math.random() > 0.7) {
        setDailyWinners((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      id: 'stat1',
      label: 'Online Players',
      value: onlinePlayers.toLocaleString(),
      icon: <Users className="w-5 h-5 text-brand" />,
      sub: 'Players active in gaming lobbies',
    },
    {
      id: 'stat2',
      label: 'Games Available',
      value: gamesCount.toLocaleString(),
      icon: <Dice5 className="w-5 h-5 text-accent-blue" />,
      sub: 'Certified provably fair titles',
    },
    {
      id: 'stat3',
      label: 'Total Payouts Paid',
      value: `$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      sub: 'Processed since inception',
    },
    {
      id: 'stat4',
      label: 'Daily Winners',
      value: dailyWinners.toLocaleString(),
      icon: <Award className="w-5 h-5 text-[#e04efd]" />,
      sub: 'Players with multipliers > 2x',
    }
  ];

  return (
    <section id="statistics" className="py-12 border-t border-white/5">
      <div className="mb-8">
        <span className="text-xs font-bold text-brand uppercase tracking-widest block mb-2 font-display">PLATFORM INSIGHTS</span>
        <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
          Real-Time <span className="text-brand">Metrics</span>
        </h2>
        <p className="text-sm text-[#bdbdbd] max-w-xl mt-2 leading-relaxed">
          Monitor active player volume, overall provably fair statistics, and jackpot distribution updates instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="group relative bg-card-dark/60 rounded-2xl border border-white/5 p-6 hover:border-brand/40 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[150px] shadow-lg"
          >
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 group-hover:bg-brand/30 transition" />

            {/* Glowing spot background */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-500" />

            {/* Top row: Label and Icon */}
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-[#bdbdbd] tracking-wider uppercase font-display">
                {stat.label}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#0b0b0b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                {stat.icon}
              </div>
            </div>

            {/* Bottom Row: Values */}
            <div className="mt-4 space-y-1 relative z-10">
              <span className="block text-2xl md:text-3xl font-mono font-black text-white leading-none tracking-tight group-hover:text-brand transition-colors">
                {stat.value}
              </span>
              <span className="block text-[11px] text-[#666] leading-tight font-medium">
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
