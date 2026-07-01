import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface HeroSliderProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onPlayOriginal: (gameId: string) => void;
  isLoggedIn: boolean;
}

interface SlideData {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  ctaText: string;
  color: string;
  glowColor: string; // Dynamic subtle light glow background color
  characterSvg: React.ReactNode;
}

export default function HeroSlider({ onOpenAuth, onPlayOriginal, isLoggedIn }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScroll = useRef(false);

  const slides: SlideData[] = [
    {
      id: 'welcome',
      brand: 'DamruBet',
      title: 'Crypto Native Casino With Fast Withdrawals',
      subtitle: 'Fast Processing • Zero Fees',
      ctaText: 'Join Now!',
      color: 'from-[#2e0854] via-[#1b083b] to-[#070212]',
      glowColor: 'rgba(219,253,78,0.06)',
      characterSvg: (
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(219,253,78,0.25)]">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dbfd4e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#dbfd4e" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hoodie-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="70" fill="url(#glow)" />
          <path d="M 50 150 C 40 100, 50 40, 100 35 C 150 40, 160 100, 150 150 Z" fill="url(#hoodie-grad)" />
          <path d="M 58 145 C 50 105, 58 55, 100 50 C 142 55, 150 105, 142 145 Z" fill="#0d0818" />
          <ellipse cx="100" cy="105" rx="35" ry="40" fill="#18181b" />
          <path d="M 70 95 Q 100 88 130 95 Q 135 110 130 115 Q 100 120 70 115 Q 65 110 70 95 Z" fill="#27272a" stroke="#dbfd4e" strokeWidth="2.5" />
          <circle cx="86" cy="105" r="11" fill="#000" stroke="#dbfd4e" strokeWidth="2" />
          <circle cx="114" cy="105" r="11" fill="#000" stroke="#dbfd4e" strokeWidth="2" />
          <circle cx="86" cy="105" r="9" fill="#dbfd4e" fillOpacity="0.15" />
          <circle cx="114" cy="105" r="9" fill="#dbfd4e" fillOpacity="0.15" />
          <path d="M 81 100 L 91 110 M 91 100 L 81 110" stroke="#dbfd4e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 109 100 L 119 110 M 119 100 L 109 110" stroke="#dbfd4e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 90 115 L 110 115 L 105 138 L 95 138 Z" fill="#3f3f46" stroke="#27272a" strokeWidth="1" />
          <circle cx="100" cy="126" r="5" fill="#18181b" stroke="#71717a" strokeWidth="1" />
          <line x1="97" y1="126" x2="103" y2="126" stroke="#71717a" strokeWidth="1" />
          <circle cx="76" cy="128" r="7" fill="#27272a" stroke="#dbfd4e" strokeWidth="1.5" />
          <circle cx="124" cy="128" r="7" fill="#27272a" stroke="#dbfd4e" strokeWidth="1.5" />
          <line x1="72" y1="128" x2="80" y2="128" stroke="#dbfd4e" strokeWidth="1" />
          <line x1="120" y1="128" x2="128" y2="128" stroke="#dbfd4e" strokeWidth="1" />
          <path d="M 40 185 C 60 150, 75 145, 100 155 C 125 145, 140 150, 160 185 Z" fill="url(#hoodie-grad)" />
          <line x1="100" y1="155" x2="100" y2="185" stroke="#1c1917" strokeWidth="3" />
          <circle cx="95" cy="165" r="2.5" fill="#dbfd4e" />
          <circle cx="105" cy="165" r="2.5" fill="#dbfd4e" />
        </svg>
      ),
    },
    {
      id: 'bonus',
      brand: 'Welcome Pack',
      title: 'Claim Welcome Bonus 250% + 50 Free Spins',
      subtitle: 'Exclusive New Player Package',
      ctaText: 'Claim Now!',
      color: 'from-[#1a1a1a] via-[#121212] to-[#040404]',
      glowColor: 'rgba(251,191,36,0.05)',
      characterSvg: (
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(219,253,78,0.2)]">
          <defs>
            <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="75" fill="url(#gold-glow)" />
          <rect x="55" y="45" width="90" height="110" rx="12" fill="#1e1b4b" stroke="#dbfd4e" strokeWidth="3" />
          <rect x="65" y="55" width="70" height="45" rx="6" fill="#090514" stroke="#dbfd4e" strokeWidth="1" />
          <text x="73" y="85" fill="#ff4e4e" fontSize="24" fontWeight="bold" fontFamily="monospace">7</text>
          <text x="93" y="85" fill="#dbfd4e" fontSize="24" fontWeight="bold" fontFamily="monospace">7</text>
          <text x="113" y="85" fill="#ffd700" fontSize="24" fontWeight="bold" fontFamily="monospace">7</text>
          <line x1="88" y1="55" x2="88" y2="100" stroke="#ffffff" strokeOpacity="0.1" />
          <line x1="112" y1="55" x2="112" y2="100" stroke="#ffffff" strokeOpacity="0.1" />
          <circle cx="70" cy="135" r="10" fill="#ffd700" stroke="#b5a100" strokeWidth="1" />
          <circle cx="85" cy="142" r="12" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="100" cy="145" r="11" fill="#eab308" stroke="#a16207" strokeWidth="1" />
          <circle cx="115" cy="140" r="12" fill="#ffd700" stroke="#b5a100" strokeWidth="1" />
          <circle cx="130" cy="135" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <path d="M 100 15 L 103 24 L 112 24 L 105 30 L 107 39 L 100 33 L 93 39 L 95 30 L 88 24 L 97 24 Z" fill="#ffd700" />
          <path d="M 40 70 L 42 74 L 47 74 L 43 77 L 44 82 L 40 79 L 36 82 L 37 77 L 33 74 L 38 74 Z" fill="#dbfd4e" />
          <path d="M 160 70 L 162 74 L 167 74 L 163 77 L 164 82 L 160 79 L 156 82 L 157 77 L 153 74 L 158 74 Z" fill="#dbfd4e" />
        </svg>
      ),
    },
    {
      id: 'vip',
      brand: 'VIP Club',
      title: 'Join Legendary VIP Club For Weekly Cashback',
      subtitle: 'Earn Custom Rakebacks & Level-up Gifts',
      ctaText: 'Unlock VIP!',
      color: 'from-[#450a0a] via-[#1c0303] to-[#040101]',
      glowColor: 'rgba(239,68,68,0.05)',
      characterSvg: (
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <defs>
            <radialGradient id="red-vip-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="70" fill="url(#red-vip-glow)" />
          <path d="M 45 130 L 55 70 L 80 100 L 100 55 L 120 100 L 145 70 L 155 130 Z" fill="#1e1b4b" stroke="#ef4444" strokeWidth="3.5" />
          <rect x="45" y="125" width="110" height="12" rx="4" fill="#000" stroke="#ef4444" strokeWidth="2" />
          <circle cx="55" cy="65" r="5" fill="#dbfd4e" />
          <circle cx="100" cy="50" r="6" fill="#dbfd4e" />
          <circle cx="145" cy="65" r="5" fill="#dbfd4e" />
          <text x="100" y="112" fill="#ef4444" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="2" fontFamily="sans-serif">VIP</text>
        </svg>
      ),
    },
    {
      id: 'originals',
      brand: 'In-House Suite',
      title: 'Play Provably Fair Originals & Crush Multipliers',
      subtitle: '99.00% High RTP Gaming',
      ctaText: 'Play Now!',
      color: 'from-[#0d1e3d] via-[#0b132b] to-[#040612]',
      glowColor: 'rgba(56,189,248,0.05)',
      characterSvg: (
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(219,253,78,0.25)]">
          <defs>
            <radialGradient id="blue-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="75" fill="url(#blue-glow)" />
          <g transform="translate(45, 55)">
            <rect x="0" y="0" width="60" height="60" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" transform="rotate(-15, 30, 30)" />
            <circle cx="20" cy="20" r="4.5" fill="#dbfd4e" />
            <circle cx="40" cy="40" r="4.5" fill="#dbfd4e" />
            <circle cx="30" cy="30" r="4.5" fill="#dbfd4e" />
          </g>
          <g transform="translate(95, 75)">
            <rect x="0" y="0" width="55" height="55" rx="12" fill="#1e1b4b" stroke="#dbfd4e" strokeWidth="2.5" transform="rotate(20, 27.5, 27.5)" />
            <circle cx="15" cy="15" r="4" fill="#38bdf8" />
            <circle cx="40" cy="40" r="4" fill="#38bdf8" />
            <circle cx="15" cy="40" r="4" fill="#38bdf8" />
            <circle cx="40" cy="15" r="4" fill="#38bdf8" />
            <circle cx="27.5" cy="27.5" r="4" fill="#38bdf8" />
          </g>
          <path d="M 30 160 L 60 130 L 100 150 L 140 120 L 170 140" fill="none" stroke="#dbfd4e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="140" cy="120" r="6" fill="#dbfd4e" />
          <circle cx="60" cy="130" r="4" fill="#38bdf8" />
        </svg>
      ),
    },
    {
      id: 'tournaments',
      brand: 'Championship',
      title: 'Weekly Arena Tournament $50,000 Prize Pool',
      subtitle: 'Rise To The Top Of Leaderboards Now',
      ctaText: 'Enter Arena!',
      color: 'from-[#14532d] via-[#052e16] to-[#020d06]',
      glowColor: 'rgba(34,197,94,0.05)',
      characterSvg: (
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(34,197,94,0.25)]">
          <defs>
            <radialGradient id="green-tourney-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="70" fill="url(#green-tourney-glow)" />
          <path d="M 65 50 L 135 50 L 125 110 C 120 135, 80 135, 75 110 Z" fill="#15803d" stroke="#dbfd4e" strokeWidth="3" />
          <path d="M 65 60 C 45 60, 45 90, 68 90" fill="none" stroke="#dbfd4e" strokeWidth="3" />
          <path d="M 135 60 C 155 60, 155 90, 132 90" fill="none" stroke="#dbfd4e" strokeWidth="3" />
          <rect x="94" y="125" width="12" height="20" fill="#166534" stroke="#dbfd4e" strokeWidth="1.5" />
          <rect x="75" y="145" width="50" height="12" rx="3" fill="#000" stroke="#dbfd4e" strokeWidth="2.5" />
          <path d="M 100 25 L 102 29 L 107 29 L 103 32 L 105 37 L 100 34 L 95 37 L 97 32 L 93 29 L 98 29 Z" fill="#dbfd4e" />
          <circle cx="60" cy="35" r="2.5" fill="#dbfd4e" />
          <circle cx="140" cy="35" r="2.5" fill="#dbfd4e" />
        </svg>
      ),
    }
  ];

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isProgrammaticScroll.current) return;
      const nextIndex = (currentSlide + 1) % slides.length;
      scrollToSlide(nextIndex);
    }, 6000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSlide]);

  const scrollToSlide = (index: number) => {
    if (!containerRef.current) return;
    isProgrammaticScroll.current = true;
    
    const clientWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const slideWidth = isMobile ? (clientWidth * 0.92 + 16) : (clientWidth + 16);
    
    containerRef.current.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth'
    });
    
    setCurrentSlide(index);
    
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  };

  const handleScroll = () => {
    if (isProgrammaticScroll.current || !containerRef.current) return;
    
    const { scrollLeft, clientWidth } = containerRef.current;
    const isMobile = window.innerWidth < 768;
    const slideWidth = isMobile ? (clientWidth * 0.92 + 16) : (clientWidth + 16);
    const computedIndex = Math.round(scrollLeft / slideWidth);
    
    if (computedIndex !== currentSlide && computedIndex >= 0 && computedIndex < slides.length) {
      setCurrentSlide(computedIndex);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentSlide + 1) % slides.length;
    scrollToSlide(nextIdx);
    resetTimer();
  };

  const handlePrev = () => {
    const prevIdx = (currentSlide - 1 + slides.length) % slides.length;
    scrollToSlide(prevIdx);
    resetTimer();
  };

  const handleCtaClick = (slideId: string) => {
    if (isLoggedIn) {
      onPlayOriginal('limbo');
    } else {
      onOpenAuth('signup');
    }
  };

  return (
    <div className="relative w-full overflow-visible group/slider" id="carousel-outer-wrapper">
      
      {/* Dynamic Background subtle ambient light effect (Low-intensity radial light beam) */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[350px] sm:w-[500px] md:w-[700px] h-[350px] sm:h-[450px] rounded-full blur-[110px] pointer-events-none transition-all duration-[1200ms] ease-in-out z-0 opacity-100"
        style={{
          background: `radial-gradient(circle, ${slides[currentSlide].glowColor} 0%, rgba(0,0,0,0) 80%)`,
        }}
      />
      
      {/* Super smooth HTML5 scroll snap container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-none flex gap-4 py-1 select-none scroll-smooth relative z-10"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`w-[92%] md:w-full shrink-0 snap-start rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 bg-gradient-to-br ${slide.color} border border-white/5 relative overflow-hidden flex flex-row items-center justify-between h-40 sm:h-48 md:h-56 lg:h-64 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.9)]`}
          >
            {/* Tech accents */}
            <div className="absolute top-3 right-4 font-mono text-[9px] text-white/10 select-none hidden sm:block">SYSTEM: SECURE // CERT: 99%</div>
            <div className="absolute bottom-3 left-4 font-mono text-[9px] text-white/10 select-none hidden sm:block">PLATFORM // PROVABLY_FAIR</div>
            
            {/* Content Left side */}
            <div className="flex-1 text-left flex flex-col justify-center h-full z-10 w-full pr-4 sm:pr-6 md:pr-8">
              <div className="flex items-center gap-1.5 mb-1.5 md:mb-3">
                <svg viewBox="0 0 100 100" className="w-4 h-4 sm:w-5 sm:h-5 text-[#dbfd4e] fill-current">
                  <rect x="2.5" y="15" width="10" height="70" rx="5" />
                  <path d="M 22 15 L 50 50 L 22 85 Z M 78 15 L 78 85 L 50 50 Z" />
                  <rect x="87.5" y="15" width="10" height="70" rx="5" />
                </svg>
                <span className="font-display font-black text-xs sm:text-sm md:text-base text-white tracking-tight">
                  DAMRU<span className="text-[#dbfd4e] italic">BET</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#dbfd4e]/75 bg-[#dbfd4e]/10 border border-[#dbfd4e]/20 px-1.5 py-0.5 rounded ml-1 uppercase">
                  {slide.brand}
                </span>
              </div>

              <h2 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-display font-black text-white tracking-tight leading-tight mb-2 md:mb-4 max-w-[85%] md:max-w-none">
                {slide.title}
              </h2>
              
              <p className="text-[10px] sm:text-xs md:text-sm text-white/50 mb-2 md:mb-4 hidden sm:block">
                {slide.subtitle}
              </p>

              <div className="mt-1 md:mt-2">
                <button
                  onClick={() => handleCtaClick(slide.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-black text-[#dbfd4e] hover:bg-[#dbfd4e] hover:text-black font-black text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl border border-[#dbfd4e]/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.4)] group"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-[#dbfd4e] group-hover:text-black transition-colors" />
                  <span>{slide.ctaText}</span>
                </button>
              </div>
            </div>

            {/* Illustration right side */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 shrink-0 flex items-center justify-center relative select-none pointer-events-none">
              {slide.characterSvg}
            </div>
          </div>
        ))}
        {/* Right side offset padding to look elegant at the end */}
        <div className="w-[8%] shrink-0 md:hidden" />
      </div>

      {/* Desktop Prev / Next Overlays appearing only on hover of the slider wrapper */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-[#dbfd4e] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-30 shadow-lg hidden md:flex"
        title="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-[#dbfd4e] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-30 shadow-lg hidden md:flex"
        title="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Navigation Indicators dots underneath */}
      <div className="flex items-center justify-center gap-2 mt-3 mb-1 select-none relative z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToSlide(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlide 
                ? 'w-7 bg-[#dbfd4e]' 
                : 'w-2.5 bg-white/15 hover:bg-white/30'
            }`}
            title={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
