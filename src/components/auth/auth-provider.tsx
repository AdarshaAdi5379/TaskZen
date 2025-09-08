"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AuthContext } from './auth-context';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          // Store user data in Firestore
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
          });
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
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
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
