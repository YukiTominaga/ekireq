"use client";

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebase } from "./firebase";

export type Post = {
  id: string;
  stationKey: string;
  stationName: string;
  prefecture: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  text: string;
  categories: string[];
  likesCount: number;
  likedBy: string[];
  reportsCount: number;
  createdAt: Timestamp | null;
};

export const REPORT_REASONS = [
  { code: "spam", label: "スパム・宣伝" },
  { code: "harassment", label: "誹謗中傷・嫌がらせ" },
  { code: "inappropriate", label: "性的・暴力的な内容" },
  { code: "personal_info", label: "個人情報の掲載" },
  { code: "other", label: "その他" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["code"];

export function subscribePosts(
  stationKey: string,
  cb: (posts: Post[]) => void,
): () => void {
  const { db } = getFirebase();
  const q = query(
    collection(db, "posts"),
    where("stationKey", "==", stationKey),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          stationKey: data.stationKey,
          stationName: data.stationName,
          prefecture: data.prefecture,
          userId: data.userId,
          userName: data.userName,
          userPhotoURL: data.userPhotoURL ?? null,
          text: data.text,
          categories: data.categories ?? [],
          likesCount: data.likesCount ?? 0,
          likedBy: data.likedBy ?? [],
          reportsCount: data.reportsCount ?? 0,
          createdAt: data.createdAt ?? null,
        };
      }),
    );
  });
}

export async function addPost(args: {
  stationKey: string;
  stationName: string;
  prefecture: string;
  user: User;
  text: string;
  categories: string[];
}) {
  const { db } = getFirebase();
  const { stationKey, stationName, prefecture, user, text, categories } = args;
  const batch = writeBatch(db);
  const postRef = doc(collection(db, "posts"));
  batch.set(postRef, {
    stationKey,
    stationName,
    prefecture,
    userId: user.uid,
    userName: user.displayName || user.email?.split("@")[0] || "ゲスト",
    userPhotoURL: user.photoURL ?? null,
    text,
    categories,
    likesCount: 0,
    likedBy: [],
    reportsCount: 0,
    createdAt: serverTimestamp(),
  });
  const statsRef = doc(db, "stationStats", stationKey);
  batch.set(
    statsRef,
    {
      stationKey,
      stationName,
      prefecture,
      postCount: increment(1),
    },
    { merge: true },
  );
  await batch.commit();
}

export async function toggleLike(postId: string, userId: string) {
  const { db } = getFirebase();
  const ref = doc(db, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const likedBy: string[] = data.likedBy ?? [];
    const liked = likedBy.includes(userId);
    tx.update(ref, {
      likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
      likesCount: increment(liked ? -1 : 1),
    });
  });
}

export class AlreadyReportedError extends Error {
  constructor() {
    super("既に通報済みです");
    this.name = "AlreadyReportedError";
  }
}

export async function reportPost(args: {
  post: Post;
  user: User;
  reason: ReportReason;
}) {
  const { post, user, reason } = args;
  if (post.userId === user.uid) {
    throw new Error("自分の投稿は通報できません");
  }
  const { db } = getFirebase();
  const reportRef = doc(db, "reports", `${post.id}_${user.uid}`);
  const postRef = doc(db, "posts", post.id);
  await runTransaction(db, async (tx) => {
    const reportSnap = await tx.get(reportRef);
    if (reportSnap.exists()) {
      throw new AlreadyReportedError();
    }
    tx.set(reportRef, {
      postId: post.id,
      stationKey: post.stationKey,
      reporterId: user.uid,
      reason,
      createdAt: serverTimestamp(),
    });
    tx.update(postRef, { reportsCount: increment(1) });
  });
}

export function subscribeStationCounts(
  cb: (counts: Record<string, number>) => void,
): () => void {
  const { db } = getFirebase();
  return onSnapshot(collection(db, "stationStats"), (snap) => {
    const counts: Record<string, number> = {};
    snap.forEach((d) => {
      counts[d.id] = d.data().postCount ?? 0;
    });
    cb(counts);
  });
}

export async function getMyPostCount(userId: string): Promise<number> {
  const { db } = getFirebase();
  const q = query(collection(db, "posts"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
}
