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

  useEffect(() => {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  return { user, ready };
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut() {
  const { auth } = getFirebase();
  return fbSignOut(auth);
}
