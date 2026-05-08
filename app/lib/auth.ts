"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirebase } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  return { user, ready, isAdmin };
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut() {
  const { auth } = getFirebase();
  return fbSignOut(auth);
}
