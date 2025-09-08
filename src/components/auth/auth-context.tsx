"use client";

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  // Razorpay subscription fields
  razorpayPlanId?: string;
  razorpaySubscriptionId?: string;
  subscriptionStatus?: 'created' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired' | null;
  subscriptionEndsAt?: Date | null;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
