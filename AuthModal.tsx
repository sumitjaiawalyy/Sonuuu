import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { registerUserBackend, loginUserBackend } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'login' | 'signup';
  onLoginSuccess: (initialBalance: number, username?: string) => void;
}

export default function AuthModal({ isOpen, onClose, initialTab, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasPromoCode, setHasPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmail = email.trim();
    const targetPassword = password;
    const targetUsername = username.trim();

    if (!targetEmail || !targetPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    if (tab === 'signup') {
      if (!targetUsername) {
        setError('Username is required.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await registerUserBackend(targetUsername, targetEmail, targetPassword);
        setIsLoading(false);
        setIsSuccess(true);
        
        // After a brief success delay, close and sign in
        setTimeout(() => {
          onLoginSuccess(Number(res.user.balance), res.user.username);
          onClose();
          setIsSuccess(false);
          setEmail('');
          setUsername('');
          setPassword('');
          setPromoCode('');
          setHasPromoCode(false);
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'An error occurred during registration.');
      }

    } else {
      // tab === 'login'
      try {
        const res = await loginUserBackend(targetEmail, targetPassword);
        setIsLoading(false);
        setIsSuccess(true);
        
        // After a brief success delay, close and sign in
        setTimeout(() => {
          onLoginSuccess(Number(res.user.balance), res.user.username);
          onClose();
          setIsSuccess(false);
          setEmail('');
          setUsername('');
          setPassword('');
          setPromoCode('');
          setHasPromoCode(false);
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Incorrect credentials or account not found.');
      }
    }
  };

  return (
    <motion.div
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      exit={{ x: '100vw' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="fixed inset-0 z-50 bg-[#09080c] flex flex-col justify-between overflow-hidden w-full h-full h-[100dvh] min-h-[100dvh] p-4 md:p-8 select-none"
    >
      {/* Subtle decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#dbfd4e]/3 blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#dbfd4e]/2 blur-[180px]" />
      </div>

      {/* Close Button top-right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[#888] hover:text-white transition-all duration-300 hover:rotate-90 p-2 bg-white/5 border border-white/5 rounded-full hover:scale-105 active:scale-95 z-50"
        title="Close Screen"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Content Area: Centered, Compact, and constrained */}
      <div className="relative w-full max-w-[360px] mx-auto z-10 flex-1 overflow-y-auto flex flex-col py-2 pr-0.5">
        <div className="w-full my-auto">
          {isSuccess ? (
            <div className="text-center flex flex-col items-center justify-center min-h-[300px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="w-14 h-14 bg-[#dbfd4e]/10 border border-[#dbfd4e]/30 rounded-2xl flex items-center justify-center text-[#dbfd4e] mb-4 shadow-[0_0_20px_rgba(219,253,78,0.3)]"
              >
                <ShieldCheck className="w-7 h-7" />
              </motion.div>
              <h3 className="text-xl font-display font-extrabold text-white mb-1.5">
                {tab === 'login' ? 'Welcome Back!' : 'Account Created!'}
              </h3>
              <p className="text-[#bdbdbd] text-xs max-w-xs mb-4">
                Successfully authenticated. We've credited your account with standard practice balance.
              </p>
              <div className="bg-[#dbfd4e]/10 text-[#dbfd4e] px-4 py-2 rounded-xl font-mono text-base font-bold border border-[#dbfd4e]/20 shadow-[0_0_15px_rgba(219,253,78,0.1)]">
                +$1,000.00 USD
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="w-full"
              >
                {/* Logo container */}
                <div className="flex justify-center mb-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-[42px] w-auto text-[#dbfd4e] fill-current filter drop-shadow-[0_0_12px_rgba(219,253,78,0.5)] transition duration-300 hover:scale-105"
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

                {/* Header title */}
                <h2 className="text-lg font-display font-black tracking-widest text-white text-center uppercase mb-4">
                  {tab === 'login' ? 'WELCOME BACK' : 'JOIN THE CLUB!'}
                </h2>

                {/* Social Logins */}
                <div className="flex justify-center gap-3 mb-4">
                  {/* Google */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#16151a] hover:bg-[#201f26] border border-white/5 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#16151a] hover:bg-[#201f26] border border-white/5 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  >
                    <svg className="w-4.5 h-4.5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.06 1.005 1.45 2.187 3.068 3.763 3.008 1.529-.06 2.103-.982 3.95-.982 1.838 0 2.375.982 3.972.95 1.62-.03 2.656-1.464 3.644-2.906 1.144-1.67 1.616-3.284 1.644-3.364-.036-.015-3.153-1.21-3.186-4.786-.027-2.984 2.443-4.417 2.553-4.484-1.4-2.046-3.56-2.277-4.321-2.332-1.838-.148-3.111.962-4.048.962zm2.233-4.524c.82-.99 1.372-2.372 1.22-3.743-1.18.047-2.607.783-3.456 1.77-.75.864-1.406 2.261-1.231 3.614 1.312.102 2.647-.65 3.467-1.641z" />
                    </svg>
                  </button>

                  {/* X */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#16151a] hover:bg-[#201f26] border border-white/5 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>

                  {/* Telegram */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#16151a] hover:bg-[#201f26] border border-white/5 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  >
                    <svg className="w-4 h-4 fill-current translate-x-[-1px] translate-y-[0.5px]" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.64-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.1-3.48 3.84-1.6 4.64-1.88 5.16-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.15-.03.22z" />
                    </svg>
                  </button>

                  {/* GitHub */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#16151a] hover:bg-[#201f26] border border-white/5 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  >
                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center mb-4">
                  <div className="flex-1 h-[1px] bg-white/5"></div>
                  <span className="px-3 text-[10px] text-[#444] font-black tracking-widest">OR</span>
                  <div className="flex-1 h-[1px] bg-white/5"></div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-3.5 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {tab === 'signup' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#121115] border border-white/5 hover:border-white/10 rounded-xl text-white text-xs focus:border-[#dbfd4e]/40 focus:outline-none transition-all placeholder:text-[#555]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder={tab === 'signup' ? "Email address" : "Email or username"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#121115] border border-white/5 hover:border-white/10 rounded-xl text-white text-xs focus:border-[#dbfd4e]/40 focus:outline-none transition-all placeholder:text-[#555]"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#121115] border border-white/5 hover:border-white/10 rounded-xl text-white text-xs focus:border-[#dbfd4e]/40 focus:outline-none transition-all placeholder:text-[#555]"
                      required
                    />
                  </div>

                  {tab === 'login' && (
                    <div className="flex justify-end pr-1 pt-0.5">
                      <button
                        type="button"
                        className="text-[11px] text-[#888] hover:text-[#dbfd4e] transition-colors font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {tab === 'signup' && (
                    <div className="space-y-2">
                      {/* Slimmer Toggle Switch */}
                      <div className="flex justify-between items-center bg-[#121115] border border-white/5 px-4 py-2 rounded-xl">
                        <span className="text-[11px] font-semibold text-[#bdbdbd]">Promo code (Optional)</span>
                        <button
                          type="button"
                          onClick={() => setHasPromoCode(!hasPromoCode)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            hasPromoCode ? 'bg-[#dbfd4e]' : 'bg-[#1e1c22]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              hasPromoCode ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {hasPromoCode && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative"
                        >
                          <input
                            type="text"
                            placeholder="DAMRU200"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="w-full px-4 py-2 bg-[#121115] border border-[#dbfd4e]/20 text-white text-xs rounded-xl tracking-widest uppercase focus:border-[#dbfd4e]/40 focus:outline-none transition-all placeholder:text-[#555]"
                          />
                          <span className="absolute right-3.5 top-2 text-[9px] text-[#dbfd4e] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> +200% Bonus
                          </span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#dbfd4e] hover:bg-[#cbe83d] text-black font-black text-xs rounded-full transition-all duration-200 shadow-[0_4px_15px_rgba(219,253,78,0.15)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : tab === 'login' ? (
                      'Continue'
                    ) : (
                      'Get started'
                    )}
                  </button>

                  {/* Signup Terms notes */}
                  {tab === 'signup' && (
                    <p className="text-[9px] text-center text-[#555] leading-relaxed pt-1">
                      By continuing, you confirm to be at least 18 years old, and agree to our{' '}
                      <a href="#" className="text-white hover:underline font-semibold">Terms & Conditions</a>
                    </p>
                  )}
                </form>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Persistent Footer area centered at the bottom */}
      {!isSuccess && (
        <div className="w-full max-w-[360px] mx-auto pt-3 border-t border-white/5 flex items-center justify-center gap-2 shrink-0 z-10 pb-1">
          {tab === 'signup' ? (
            <>
              <span className="text-xs text-[#555] font-semibold">Already have an account?</span>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className="px-4 py-1.5 bg-[#121115] hover:bg-[#1c1a21] text-white text-[11px] font-bold rounded-full border border-white/5 transition duration-200"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-[#555] font-semibold">Don't have an account?</span>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                className="px-4 py-1.5 bg-[#121115] hover:bg-[#1c1a21] text-[#dbfd4e] hover:text-[#cbe83d] text-[11px] font-bold rounded-full border border-white/5 transition duration-200"
              >
                Join now
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
