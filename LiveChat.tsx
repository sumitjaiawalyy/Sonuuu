import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Smile, Users, X, Star, FileText, ChevronDown, ShieldAlert, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  username?: string;
}

interface LanguageChannel {
  code: string;
  name: string;
  flag: string;
}

export default function LiveChat({ isOpen, onClose, isLoggedIn, onOpenAuth, username = 'Player_Damru' }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    // India (IN)
    { id: 'm1', username: 'Breakpoint7', avatar: '⭐', country: 'IN', message: '@Chahuga Mera 1700 ka Atka tha bhai live support ko bolte rho whi active lesakte hai bss', timestamp: '12:40', isVIP: false },
    { id: 'm2', username: 'AnuDarliing', avatar: '⭐', country: 'IN', message: '@Jounkani bhai ji mera bhi pichle 3 don mai 250$ loss ho gaya hai samajh he nahi raha hai kaise recover karu', timestamp: '12:41', isVIP: false },
    { id: 'm3', username: 'QuickLearner', avatar: '⭐', country: 'IN', message: '@happy21334 yeah error toh logo ka loss krwa raha he ab 🤦‍♂️', timestamp: '12:41', isVIP: true },
    { id: 'm4', username: 'Manoffiree', avatar: '⭐', country: 'IN', message: '@Paliws1 bhai vahi ap copy karke yt pe search karlo or karlo', timestamp: '12:42', isVIP: true },
    { id: 'm5', username: 'Gurimanu', avatar: '⭐', country: 'IN', message: 'Kisi ka inr withdrawal 11 din m aaya h ya nhi', timestamp: '12:43', isVIP: true },
    { id: 'm6', username: 'Rahulyadav', avatar: '⭐', country: 'IN', message: 'Ye kya error aa raha hai kya ye sab ke aa raha hai', timestamp: '12:43', isVIP: false },

    // Canada (CA)
    { id: 'ca1', username: 'MapleLeif', avatar: '⭐', country: 'CA', message: 'Just hit a crazy 15x on Dice! 🎲', timestamp: '12:40', isVIP: true },
    { id: 'ca2', username: 'MooseBettor', avatar: '⭐', country: 'CA', message: 'Does anyone know if CAD withdrawals are fast today?', timestamp: '12:41', isVIP: false },
    { id: 'ca3', username: 'EhCasino', avatar: '⭐', country: 'CA', message: 'Yeah buddy, my payout took less than 2 minutes via Interac.', timestamp: '12:42', isVIP: true },
    { id: 'ca4', username: 'NorthernLights', avatar: '⭐', country: 'CA', message: 'Good luck everyone in the Chat! Let\'s win big.', timestamp: '12:43', isVIP: false },

    // Pakistan (PK)
    { id: 'pk1', username: 'Ali_Crypto', avatar: '⭐', country: 'PK', message: 'Salam guys, Mines main kya strategy chal rahi hai ajkal?', timestamp: '12:40', isVIP: false },
    { id: 'pk2', username: 'ShahidBet', avatar: '⭐', country: 'PK', message: 'Bhai, 3 mines wale setup pe consistently multiply ho rha hai balance.', timestamp: '12:41', isVIP: true },
    { id: 'pk3', username: 'PakSpin', avatar: '⭐', country: 'PK', message: 'Damrubet literally Pakistan me sabse smooth chal rha h.', timestamp: '12:42', isVIP: false },
    { id: 'pk4', username: 'Zain_Pro', avatar: '⭐', country: 'PK', message: 'Support response is very fast, helpful system.', timestamp: '12:43', isVIP: true },

    // China (CN)
    { id: 'cn1', username: 'LuckyDragon', avatar: '⭐', country: 'CN', message: '大家好！今天骰子运气不错，刚中了8倍。🐉', timestamp: '12:40', isVIP: true },
    { id: 'cn2', username: 'CN_Highroller', avatar: '⭐', country: 'CN', message: '提款非常顺畅，两分钟就到账了。', timestamp: '12:41', isVIP: false },
    { id: 'cn3', username: 'MinesMaster_CN', avatar: '⭐', country: 'CN', message: '推荐玩扫雷游戏，多放几个炸弹赔率极高。', timestamp: '12:42', isVIP: true },
    { id: 'cn4', username: 'GoldenGate', avatar: '⭐', country: 'CN', message: '这个平台真的很公平，哈希值可以自己验证。', timestamp: '12:43', isVIP: false },

    // Europe (EU)
    { id: 'eu1', username: 'EuroSpinner', avatar: '⭐', country: 'EU', message: 'Plinko is absolutely cooking today! Just got 10x! 🔵', timestamp: '12:40', isVIP: true },
    { id: 'eu2', username: 'AlphaBettor', avatar: '⭐', country: 'EU', message: 'Withdrawals are processed instantly on Damrubet, super reliable!', timestamp: '12:41', isVIP: false },
    { id: 'eu3', username: 'Minesweeper_EU', avatar: '⭐', country: 'EU', message: 'Always check the custom seeds, completely fair hashes.', timestamp: '12:42', isVIP: true },
    { id: 'eu4', username: 'LuckyCharm', avatar: '⭐', country: 'EU', message: 'Happy gaming from Germany! Best of luck!', timestamp: '12:43', isVIP: false }
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<LanguageChannel>({ code: 'IN', name: 'India', flag: '🇮🇳' });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Dynamic online count states bounded between 10387 and 40897
  const [onlineCount, setOnlineCount] = useState<number>(() => {
    const min = 10387;
    const max = 40897;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });

  // Automatically update the online count randomly within constraints
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const min = 10387;
        const max = 40897;
        // Natural fluctuation of -120 to +120
        const delta = Math.floor(Math.random() * 241) - 120;
        let updated = prev + delta;
        if (updated < min) updated = min + Math.floor(Math.random() * 100);
        if (updated > max) updated = max - Math.floor(Math.random() * 100);
        return updated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const channels: LanguageChannel[] = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'EU', name: 'Europe', flag: '🇪🇺' }
  ];

  const emojis = ['🔥', '🚀', '🤑', '💎', '🎉', '🍀', '👑', '😎', '🤩', '🎯', '🎰', '👀', '👍', '🙏', '😂', '🤦‍♂️', '🔥', '💖'];

  // Scroll to bottom whenever messages list grows, active channel switches, or opens
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, isOpen, currentChannel.code]);

  // Periodic simulated player chats coming in (tuned to current active channel for beautiful scroll action)
  useEffect(() => {
    const randomUsersByCountry: Record<string, { name: string; isVIP: boolean; msgs: string[] }[]> = {
      IN: [
        { name: 'Karan_Pro', isVIP: true, msgs: ['@AnuDarliing cover ho jayega bro, slow scale pe Khelo Mines low risk patterns ke sath', 'Nice game! Just hit 4.5x on Plinko 🔵', 'Mera deposit is totally instant'] },
        { name: 'RajaBet', isVIP: false, msgs: ['Mera withdrawal to 5 min me aa gya tha, automatic systems are super fast here', '@Gurimanu support ticket open krlo instantly solve ho jata hai', 'Any strategies for Limbo today?'] },
        { name: 'Soniya_99', isVIP: true, msgs: ['Mines me 3 bombs is my favourite pattern! 🔥', 'High roll bets are paying out great today', 'Damrubet is literally the smoothest site!'] },
        { name: 'Rahul_987', isVIP: false, msgs: ['Limbo me koi risk mat lo, auto cashout 1.5x rkho safe rhega', 'Dice roll multiplier script working fine!', 'Mera payout process ho gaya bss 10 min me'] },
        { name: 'DeepakS', isVIP: true, msgs: ['Withdrawal system is completely automatic in Damrubet, instant in bank account', 'Mera to 10k ka withdrawal instant aya tha subah 💎', 'I got $25 standard practice coins replenish'] }
      ],
      CA: [
        { name: 'AviatorKing', isVIP: false, msgs: ['Best casino platform by far! Lovin the instant CAD withdrawals 🇨🇦', 'Anyone playing Crash? High multipliers are hitting', 'Canada live support resolved my query in 1 min'] },
        { name: 'CryptoKing', isVIP: true, msgs: ['Just made a $50 profit with Limbo auto settings', 'The custom provably fair hash matches perfectly', 'Is anybody playing Plinko right now?'] },
        { name: 'MaplePro', isVIP: true, msgs: ['Mines is my absolute goldmine today', 'Just hit a clean 8.4x win! 🔥', 'Awesome design and UI!'] }
      ],
      PK: [
        { name: 'Ivan_RU', isVIP: false, msgs: ['Bhai log Plinko pe blue balls bohot de rha h win 🇵🇰', 'Mera deposit to easypaisa se instantly add ho gaya', 'Damrubet is really clean and super fast!'] },
        { name: 'Kashif_Pro', isVIP: true, msgs: ['Limbo low risk target is extremely safe', 'Mines 3 bombs pattern works like magic', 'Alhamdulillah big win on Plinko today!'] },
        { name: 'Zeeshan88', isVIP: false, msgs: ['Great gaming system, totally transparent', 'Support is active even at night', 'Will try high roll bets now'] }
      ],
      CN: [
        { name: 'Arda_TR', isVIP: true, msgs: ['这个平台提款秒到账，太牛了！🇨🇳', '扫雷游戏真的很好玩，推荐推荐！', '有谁一起玩极限骰子吗？'] },
        { name: 'Zhong_Bet', isVIP: false, msgs: ['完全公平的系统，哈希验证没有任何水分', '今天已经赢了三万 practice coins 了', '客服服务态度非常好，速度快'] },
        { name: 'ShaoLine', isVIP: true, msgs: ['Plinko 10x 达成！太开心了 🔵', '支持自主选择哈希种子，非常棒', '大家今天手气怎么样？'] }
      ],
      EU: [
        { name: 'MegaWin_BR', isVIP: true, msgs: ['Absolutely love the mines game here! 💣', 'Won 10x on Plinko just now, insane!', 'Instant SEPA withdrawals are so convenient!'] },
        { name: 'EuroElite', isVIP: true, msgs: ['Custom client seed is verified, completely transparent', 'Who is ready for a big session on Limbo?', 'The best provably fair engine online!'] },
        { name: 'Gunter_DE', isVIP: false, msgs: ['German support here is super helpful', 'Safe bets on Dice with auto roll script works perfectly', 'Highly recommend Damrubet to everyone'] }
      ]
    };

    const interval = setInterval(() => {
      if (!isOpen) return;
      
      const countryCodes = ['IN', 'CA', 'PK', 'CN', 'EU'];
      const activeCode = currentChannel.code;
      // 75% chance to generate for the active server so the active user experiences high-fidelity updates, 25% for other rooms
      const shouldGenerateActive = Math.random() < 0.75;
      const targetCountry = (shouldGenerateActive && activeCode) ? activeCode : countryCodes[Math.floor(Math.random() * countryCodes.length)];

      const pool = randomUsersByCountry[targetCountry] || randomUsersByCountry['IN'];
      const user = pool[Math.floor(Math.random() * pool.length)];
      const text = user.msgs[Math.floor(Math.random() * user.msgs.length)];

      const date = new Date();
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const newMessage: ChatMessage = {
        id: `m-sim-${Date.now()}`,
        username: user.name,
        avatar: '⭐',
        country: targetCountry,
        message: text,
        timestamp: timeStr,
        isVIP: user.isVIP,
      };

      setMessages((prev) => [...prev, newMessage]);
    }, 4000); // 4 seconds interval makes it highly dynamic and engaging!

    return () => clearInterval(interval);
  }, [isOpen, currentChannel.code]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    if (!isLoggedIn) {
      onOpenAuth('login');
      return;
    }

    const date = new Date();
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const myMessage: ChatMessage = {
      id: `m-user-${Date.now()}`,
      username: username,
      avatar: '⭐',
      country: currentChannel.code,
      message: inputMsg.trim().slice(0, 160),
      timestamp: timeStr,
      isVIP: true,
    };

    setMessages((prev) => [...prev, myMessage]);
    setInputMsg('');
    setShowEmojiPicker(false);
  };

  const handleUsernameClick = (username: string) => {
    if (!isLoggedIn) return;
    window.dispatchEvent(new CustomEvent('open_tip_user', { detail: username }));
  };

  const addEmoji = (emoji: string) => {
    if (inputMsg.length + emoji.length <= 160) {
      setInputMsg((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const getCountryFlag = (code: string) => {
    const ch = channels.find(c => c.code === code);
    return ch ? ch.flag : '🌐';
  };

  const formatMessageText = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-block bg-[#132d42] text-[#38bdf8] font-bold text-[11px] px-1.5 py-0.5 rounded mr-1 select-none"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      id="live-chat-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
      className="fixed top-[60px] md:top-[68px] bottom-[61px] md:bottom-0 right-0 z-[49] w-full sm:w-[340px] bg-[#08080a] border-l border-white/5 flex flex-col justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.8)] will-change-transform"
    >
      {/* Header with Server switch and Close Chat icon in Stake style */}
      <div className="relative px-4 py-3 bg-[#0d0c11] border-b border-white/5 flex items-center justify-between select-none z-30">
        <div className="relative">
          {/* Active Server dropdown trigger */}
          <button
            type="button"
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-xl transition duration-150 text-white font-bold text-xs tracking-wide bg-white/[0.02] border border-white/5 cursor-pointer"
          >
            <span className="text-sm leading-none">{currentChannel.flag}</span>
            <span className="uppercase text-white/90">{currentChannel.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#888] transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Language Channel dropdown popover */}
          <AnimatePresence>
            {showLangDropdown && (
              <>
                {/* Backdrop overlay to click outside and close */}
                <div 
                  className="fixed inset-0 z-10 cursor-default" 
                  onClick={() => setShowLangDropdown(false)} 
                />
                
                {/* Popover */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 mt-2.5 w-48 bg-[#131118] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-20 overflow-hidden"
                >
                  {/* Small upward arrow indicator */}
                  <div className="absolute top-0 left-6 -mt-1 w-2.5 h-2.5 bg-[#131118] border-t border-l border-white/10 rotate-45 transform origin-bottom-left" />
                  
                  <div className="relative z-10 space-y-1 mt-0.5">
                    <div className="text-[9px] font-black text-[#555] tracking-wider uppercase px-2 py-1">Select Server</div>
                    {channels.map((chan) => {
                      const isActive = currentChannel.code === chan.code;
                      return (
                        <button
                          key={chan.code}
                          type="button"
                          onClick={() => {
                            setCurrentChannel(chan);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all duration-150 group cursor-pointer ${
                            isActive 
                              ? 'bg-[#38bdf8]/10 text-[#38bdf8] font-bold border border-[#38bdf8]/10' 
                              : 'hover:bg-white/5 text-[#888] hover:text-white'
                          }`}
                        >
                          <span className="text-sm leading-none">{chan.flag}</span>
                          <span className="text-xs tracking-wide uppercase font-black">{chan.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#38bdf8] filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl text-[#888] hover:text-white transition duration-150 flex items-center justify-center border border-white/5"
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Feed Area (Scrollable with clean layout) */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#08080a] scrollbar-thin scrollbar-thumb-white/5"
      >
        {messages
          .filter((msg) => (msg.country || 'IN') === currentChannel.code)
          .map((msg) => (
            <div
              key={msg.id}
              className="p-3 bg-[#131118]/90 border border-white/5 rounded-2xl hover:border-white/10 transition-all duration-150 group"
            >
            <div className="flex items-start gap-1.5">
              {/* Star Badge */}
              <Star 
                className={`w-3.5 h-3.5 mt-[1px] shrink-0 ${
                  msg.isVIP 
                    ? 'text-[#eab308] fill-[#eab308] filter drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]' 
                    : 'text-white/40'
                }`} 
              />
              
              <div className="flex-1 min-w-0">
                {/* Header of message: Username & Server Badge */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span 
                    onClick={() => handleUsernameClick(msg.username)}
                    className="text-xs font-black text-white hover:text-[#dbfd4e] cursor-pointer tracking-wide select-none transition duration-150"
                    title={isLoggedIn ? `Click to tip @${msg.username}` : undefined}
                  >
                    {msg.username}
                  </span>
                  
                  {/* Small Server indicator badge */}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.03] border border-white/5 text-[9px] font-black text-[#666] group-hover:text-[#38bdf8] group-hover:border-[#38bdf8]/10 group-hover:bg-[#38bdf8]/5 rounded-md select-none transition duration-150">
                    <span className="text-[11px] leading-none">{getCountryFlag(msg.country || 'IN')}</span>
                    <span className="tracking-wide text-[8px] uppercase">{msg.country || 'IN'}</span>
                  </span>
                </div>
                
                {/* Message body with mention parsing */}
                <span className="text-xs text-white/95 leading-relaxed break-words block">
                  {formatMessageText(msg.message)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input panel precisely following reference screenshot */}
      <div className="p-3 bg-[#0d0c11] border-t border-white/5">
        {/* Emoji Selector Overlay pop up */}
        <AnimatePresence>
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-36 left-4 right-4 z-20 grid grid-cols-6 gap-1.5 p-2.5 bg-[#131118] border border-white/10 rounded-2xl shadow-2xl"
              >
                {emojis.map((em, idx) => (
                  <button
                    key={`${em}-${idx}`}
                    onClick={() => addEmoji(em)}
                    className="p-1.5 hover:bg-white/5 text-lg rounded-xl text-center transition duration-150 active:scale-95"
                  >
                    {em}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <form onSubmit={handleSendMessage} className="space-y-2.5">
          {/* Main typing container */}
          <div className="relative flex items-center bg-[#131118]/80 border border-white/5 hover:border-white/10 focus-within:border-[#38bdf8]/30 rounded-2xl transition">
            <input
              type="text"
              maxLength={160}
              placeholder={isLoggedIn ? "Type your message" : "Log in to join the chat"}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value.slice(0, 160))}
              disabled={!isLoggedIn}
              className="w-full pl-4 pr-11 py-3 bg-transparent text-xs text-white placeholder-[#555] focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            {/* Smile icon inside right corner */}
            <button
              type="button"
              onClick={() => isLoggedIn && setShowEmojiPicker(!showEmojiPicker)}
              disabled={!isLoggedIn}
              className="absolute right-3 p-1 text-[#bdbdbd] hover:text-[#eab308] transition duration-150 disabled:opacity-30"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Lower controls row */}
          <div className="flex items-center justify-between">
            {/* Online Indicator Status */}
            <div className="flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[11px] font-bold text-[#666]">Online:</span>
              <span className="text-[11px] font-black text-white/90">{onlineCount.toLocaleString()}</span>
            </div>

            {/* Right side tools + send button */}
            <div className="flex items-center gap-2">
              {/* Character Limit indicator */}
              <span className="text-[11px] font-mono font-bold text-[#555]">
                {160 - inputMsg.length}
              </span>

              {/* Chat Rules list button */}
              <button
                type="button"
                className="p-2 bg-[#1b1921] border border-white/5 hover:border-white/10 text-white/70 hover:text-white rounded-xl transition duration-150 active:scale-95"
                title="Community Guidelines"
                onClick={() => setShowRules(true)}
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Send message trigger */}
              <button
                type="submit"
                disabled={!isLoggedIn || !inputMsg.trim()}
                className="px-5 py-2 bg-[#1877F2] hover:bg-[#2f86f7] disabled:bg-[#1877F2]/40 disabled:pointer-events-none text-white font-bold text-xs rounded-xl transition duration-150 active:scale-95 shadow-lg"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Chat Rules Modal Overlay */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm z-30 p-3 flex flex-col justify-center"
          >
            <div className="bg-[#131118] border border-white/10 rounded-3xl p-5 space-y-4 max-w-[310px] w-full mx-auto shadow-2xl relative flex flex-col max-h-[90%]">
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-xl text-[#888] hover:text-white transition z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1 text-[#38bdf8] shrink-0">
                <ShieldAlert className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
                <h3 className="font-display font-black tracking-wider text-xs uppercase">CHAT RULES</h3>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/5 flex-1 max-h-[320px]">
                {[
                  "Do not spam or use excessive capital letters.",
                  "Do not harass, abuse, or insult other users or Stake staff.",
                  "Do not share personal information (including social media) of yourself or others.",
                  "Do not beg or request loans, rains, or tips.",
                  "Do not use alternate (alt) accounts in chat.",
                  "Do not engage in suspicious behaviour or potential scams.",
                  "Do not advertise, trade, sell, buy, or offer services.",
                  "Do not discuss streamers, Kick, or similar platforms.",
                  "Do not use URL shorteners, always share full links.",
                  "Do not share scripts, bots, or automation tools.",
                  "Only use the language designated for the chat channel.",
                  "Politics and religion are strictly prohibited in chat."
                ].map((rule, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-left">
                    <span className="text-[#38bdf8] text-[9px] font-black shrink-0 bg-[#38bdf8]/10 w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#38bdf8]/20">
                      {idx + 1}
                    </span>
                    <p className="text-[11px] text-white/80 leading-relaxed font-medium">{rule}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="w-full py-2.5 bg-[#38bdf8] hover:bg-[#5bcaff] text-black font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(56,189,248,0.2)] hover:scale-[1.01] active:scale-[0.99] shrink-0 mt-2"
              >
                I AGREE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
