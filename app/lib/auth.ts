"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebase } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // updateProfile() は auth.currentUser をその場で mutate するが
  // onAuthStateChanged は発火しないため、明示的に再レンダーを促すためのカウンタ
  const [, forceUpdate] = useReducer((s: number) => s + 1, 0);

  useEffect(() => {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const res = await u.getIdTokenResult();
          setIsAdmin(res.claims.admin === true);
        } catch (e) {
          console.error(e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setReady(true);
    });
  }, []);

  const refreshUser = useCallback(() => {
    forceUpdate();
  }, []);

  return { user, ready, isAdmin, refreshUser };
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut() {
  const { auth } = getFirebase();
  return fbSignOut(auth);
}

export async function updateUserDisplayName(displayName: string) {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    throw new Error("ログインしていません");
  }
  await updateProfile(auth.currentUser, { displayName });
}
