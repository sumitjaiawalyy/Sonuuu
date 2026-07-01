import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Users, RefreshCw, Star } from 'lucide-react';
import { Promotion } from '../types';

export default function Promotions() {
  const promotions: (Promotion & { icon: React.ReactNode })[] = [
    {
      id: 'prm1',
      title: 'Daily Cashback Pool',
      description: 'Get credited with 10% cash back on any potential losses from gaming activities with no rollover required.',
      reward: '10% Cash Back',
      badge: 'ACTIVE DAILY',
      gradient: 'from-[#ff4e4e]/10 to-red-950/20',
      icon: <RefreshCw className="w-6 h-6 text-[#ff4e4e]" />,
    },
    {
      id: 'prm2',
      title: 'Referral Bonus Program',
      description: 'Invite your close friends using your unique code and claim 25% commissions on the platform house edge for life.',
      reward: '25% House Comm',
      badge: 'PASSIVE COMMISSION',
      gradient: 'from-[#2596be]/10 to-blue-950/20',
      icon: <Users className="w-6 h-6 text-[#2596be]" />,
    },
    {
      id: 'prm3',
      title: 'VIP High Roller Club',
      description: 'Ascend our 10 VIP tiers to unlock personal cashiers, dedicated managers, and exclusive luxury gifts.',
      reward: 'Private Vaults & Cars',
      badge: 'EXCLUSIVE TIER',
      gradient: 'from-[#e04efd]/10 to-purple-950/20',
      icon: <Star className="w-6 h-6 text-[#e04efd]" />,
    },
    {
      id: 'prm4',
      title: 'Weekly Grand Tournament',
      description: 'Join our weekly wager races where the top 200 players split a massive guaranteed prize pool.',
      reward: '$150,000 Wager Pool',
      badge: 'TOURNAMENT',
      gradient: 'from-[#dbfd4e]/10 to-emerald-950/20',
      icon: <Trophy className="w-6 h-6 text-brand" />,
    },
    {
      id: 'prm5',
      title: 'Lucky Wheel Spin',
      description: 'Log in daily and secure a free spin on the Lucky Wheel to win up to 1 BTC or 10,000 USD practice credits.',
      reward: 'Up to 1 BTC Daily',
      badge: 'DAILY REWARD',
      gradient: 'from-amber-500/10 to-amber-950/20',
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    }
  ];

  return (
    <section id="promotions" className="py-12 md:py-16 border-t border-white/5">
      {/* Title */}
      <div className="mb-8">
        <span className="text-xs font-bold text-brand uppercase tracking-widest block mb-2 font-display">BONUS PACKAGES</span>
        <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
          Featured <span className="text-brand">Promotions</span>
        </h2>
        <p className="text-sm text-[#bdbdbd] max-w-xl mt-2 leading-relaxed">
          Supercharge your gameplay with our structured incentive models, designed to reward every level of loyalty.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo, idx) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className={`group bg-card-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden hover:border-brand/30 transition-all duration-300 flex flex-col justify-between`}
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${promo.gradient} opacity-50 z-0`} />

            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 group-hover:bg-brand/20 transition" />

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 rounded-xl bg-[#0b0b0b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                  {promo.icon}
                </div>
                <span className="text-[9px] font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                  {promo.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-display font-extrabold text-white group-hover:text-brand transition-colors">
                  {promo.title}
                </h3>
                <p className="text-xs text-[#bdbdbd] leading-relaxed mt-1.5">
                  {promo.description}
                </p>
              </div>
            </div>

            {/* Bottom Reward Details */}
            <div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#666] font-mono">REWARD INCENTIVE</span>
                <span className="text-sm font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {promo.reward}
                </span>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white/5 hover:bg-brand hover:text-black font-semibold text-xs text-white rounded-lg transition"
              >
                Claim Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
