
"use client";

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { app, db } from '@/lib/firebase'; // Keep db, but getAuth will be handled differently
import { doc, setDoc, onSnapshot, serverTimestamp, getDoc, getFirestore } from 'firebase/firestore';
import type { AuthContextType, UserProfile } from './auth-context';
import { AuthContext } from './auth-context';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleUserProfile = useCallback((user: User | null) => {
    if (user) {
      const firestore = getFirestore(app);
      const userRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const profile: UserProfile = {
            ...data,
            uid: user.uid,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            subscriptionEndsAt: data.subscriptionEndsAt?.toDate ? data.subscriptionEndsAt.toDate() : null,
          } as UserProfile;
          setUserProfile(profile);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setUserProfile(null);
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const unsubscribeProfile = handleUserProfile(currentUser);
      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, [handleUserProfile]);

  const signInWithGoogle = async () => {
    setLoading(true);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const newUserProfile: Omit<UserProfile, 'createdAt'> & {createdAt: any} = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          role: 'user', // Default role
          status: 'active', // Default status
        };
        await setDoc(userRef, newUserProfile, { merge: true });
      }
      
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Sign-in Failed",
        description: error.code === 'auth/popup-closed-by-user' 
          ? 'Sign-in window closed before completion.'
          : error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
        // onAuthStateChanged will handle setting the user and loading states
    }
  };

  const signOut = async () => {
    const auth = getAuth(app);
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
