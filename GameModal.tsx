import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Gamepad2, Award, Zap, Construction } from 'lucide-react';
import { ActiveGameType } from '../../types';
import Limbo from './Limbo';
import CoinFlip from './CoinFlip';

interface GameModalProps {
  activeGame: ActiveGameType;
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onSwitchGame: (game: ActiveGameType) => void;
}

export default function GameModal({
  activeGame,
  onClose,
  balance,
  onUpdateBalance,
  isLoggedIn,
  onOpenAuth,
  onSwitchGame,
}: GameModalProps) {

  if (!activeGame) return null;

  const gameNames: Record<string, string> = {
    limbo: 'Limbo Originals',
    coinflip: 'Coin Flip Original',
    dice: 'Provably Fair Dice',
    mines: 'Minesweeper Gold',
    keno: 'Royal Keno Grid',
    plinko: 'Plinko Board Physics',
  };

  const gameRtp: Record<string, string> = {
    limbo: '99.00% RTP',
    coinflip: '99.00% RTP',
    dice: '99.00% RTP',
    mines: '97.00% RTP',
    keno: '96.50% RTP',
    plinko: '98.90% RTP',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed top-[60px] md:top-[68px] bottom-[61px] md:bottom-0 left-0 right-0 z-[44] flex items-stretch justify-center p-0 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed top-[60px] md:top-[68px] bottom-[61px] md:bottom-0 left-0 right-0 bg-black/85 backdrop-blur-md z-10 cursor-pointer"
      />

      {/* Game Window container */}
      <motion.div
        initial={{ scale: 0.98, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative w-full max-w-xl bg-bg-dark border-x border-white/10 overflow-hidden shadow-2xl z-20 flex flex-col h-full"
      >
        {/* Glow accent bar */}
        {activeGame !== 'limbo' && activeGame !== 'coinflip' && (
          <div className="h-[3px] w-full bg-gradient-to-r from-brand via-accent-blue to-brand shrink-0" />
        )}

        {/* Modal Top Bar */}
        {activeGame !== 'limbo' && activeGame !== 'coinflip' && (
          <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-card-dark/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-glow">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-display font-black text-white flex items-center gap-2">
                  {gameNames[activeGame] || 'Damru Games'}
                  <span className="text-[10px] md:text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-brand" /> REBUILDING
                  </span>
                </h2>
                <p className="text-xs text-[#bdbdbd] flex items-center gap-1.5 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-accent-blue" />
                  <span>Provably Fair RNG</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-emerald-400 font-mono font-bold">{gameRtp[activeGame] || '99.00%'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-[#171717] hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 text-[#bdbdbd] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Active Game Render Arena */}
        <div className={`flex-1 h-full w-full overflow-y-auto flex flex-col items-stretch justify-start bg-bg-dark ${activeGame === 'limbo' || activeGame === 'coinflip' ? 'p-2 md:p-3' : 'p-4 md:p-6'}`}>
          {activeGame === 'limbo' ? (
            <Limbo
              balance={balance}
              onUpdateBalance={onUpdateBalance}
              isLoggedIn={isLoggedIn}
              onOpenAuth={onOpenAuth}
              onClose={onClose}
            />
          ) : activeGame === 'coinflip' ? (
            <CoinFlip
              balance={balance}
              onUpdateBalance={onUpdateBalance}
              isLoggedIn={isLoggedIn}
              onOpenAuth={onOpenAuth}
              onClose={onClose}
            />
          ) : (
            <div className="p-10 md:p-14 flex flex-col items-center justify-center text-center w-full">
              <div className="w-20 h-20 rounded-full bg-[#dbfd4e]/10 border border-[#dbfd4e]/20 flex items-center justify-center mb-6 text-[#dbfd4e] animate-bounce">
                <Construction className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Game Under Construction
              </h3>
              <p className="text-sm text-[#888] max-w-md mt-3 font-medium leading-relaxed">
                We are currently rebuilding <span className="text-white font-extrabold">{gameNames[activeGame] || 'this game'}</span> from scratch. We are crafting custom animations, interactive physics, manual/auto wagering, and fully-verifiable provably fair mathematics.
              </p>
              <button
                onClick={onClose}
                className="mt-8 px-6 py-2.5 bg-[#dbfd4e] hover:bg-[#cbe83d] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-150 transform active:scale-95"
              >
                Back to Lobby
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
