/**
 * Types for Damrubet Online Gaming Platform
 */

export interface Game {
  id: string;
  name: string;
  category: 'original' | 'slots' | 'live' | 'table';
  provider: string;
  image?: string;
  icon?: string; // For original games
  playersOnline: number;
  rtp?: number;
  isFavorite?: boolean;
}

export interface LiveWinner {
  id: string;
  username: string;
  gameName: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  country: string; // ISO Code
  message: string;
  timestamp: string;
  isVIP?: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  badge: string;
  image: string; // Gradient color or vector path description
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  reward: string;
  badge: string;
  gradient: string;
}

export type ActiveGameType = 'limbo' | 'dice' | 'mines' | 'keno' | 'plinko' | 'coinflip' | null;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'promo' | 'win' | 'bonus' | 'security' | 'system';
  timestamp: string;
  isRead: boolean;
  rewardAmount?: number; // Optional practice balance amount user can claim!
  isClaimed?: boolean;   // Has the reward been claimed already
}

