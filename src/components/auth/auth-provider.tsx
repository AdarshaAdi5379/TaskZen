
"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import type { AuthContextType, UserProfile } from './auth-context';
import { AuthContext } from './auth-context';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Listen for profile changes
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
             const data = docSnap.data();
             const profile = {
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                subscriptionEndsAt: data.subscriptionEndsAt?.toDate ? data.subscriptionEndsAt.toDate() : null,
             } as UserProfile;
            setUserProfile(profile);
          } else {
            // Create user profile if it doesn't exist
            const newUserProfile: Omit<UserProfile, 'createdAt'> & {createdAt: any} = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              role: 'user', // Default role
              status: 'active', // Default status
              subscriptionId: null,
              subscriptionStatus: null,
              subscriptionEndsAt: null,
            };
            if(user.email === 'adarshakk1234@gmail.com') {
              newUserProfile.role = 'admin'
            }
            setDoc(userRef, newUserProfile);
            setUserProfile({
                ...newUserProfile,
                createdAt: new Date(),
                subscriptionEndsAt: null
            } as UserProfile);
          }
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Sign-in Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      })
    } finally {
      // Loading state will be updated by onAuthStateChanged
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        title: "Sign-out Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive"
      })
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userProfile, isAdmin, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
