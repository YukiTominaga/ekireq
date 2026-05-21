import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { beforeUserSignedIn } from "firebase-functions/v2/identity";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { isAdminEmail } from "./admins";

const SERVICE_ACCOUNT = "ekireq-fn@utaha-io.iam.gserviceaccount.com";
const DATABASE = "ekireq";

if (getApps().length === 0) {
  initializeApp();
}

function statsDoc(stationKey: string) {
  return getFirestore(DATABASE).doc(`stationStats/${stationKey}`);
}

export const setAdminClaim = beforeUserSignedIn(
  { serviceAccount: SERVICE_ACCOUNT },
  (event) => {
    const email = event.data?.email;
    const admin = isAdminEmail(email);

    const existing = event.data?.customClaims ?? {};
    const next = { ...existing, admin };

    return { customClaims: next };
  },
);

// posts への作成をトリガに stationStats.postCount を +1 する。
// クライアントの addPost は posts への単純な create のみで stationStats には触れない。
export const onPostCreated = onDocumentCreated(
  { document: "posts/{postId}", database: DATABASE },
  async (event) => {
    const post = event.data?.data();
    if (!post) return;
    const stationKey = post.stationKey as string | undefined;
    if (!stationKey) return;

    await statsDoc(stationKey).set(
      {
        stationKey,
        stationName: post.stationName ?? "",
        prefecture: post.prefecture ?? "",
        postCount: FieldValue.increment(1),
      },
      { merge: true },
    );
  },
);

// posts 削除時に stationStats.postCount を -1 する。
// 0 件以下にはしない (defensive: 同一 postId の重複イベントを許容)
export const onPostDeleted = onDocumentDeleted(
  { document: "posts/{postId}", database: DATABASE },
  async (event) => {
    const post = event.data?.data();
    if (!post) return;
    const stationKey = post.stationKey as string | undefined;
    if (!stationKey) return;

    const db = getFirestore(DATABASE);
    await db.runTransaction(async (tx) => {
      const ref = statsDoc(stationKey);
      const snap = await tx.get(ref);
      const current = (snap.data()?.postCount as number | undefined) ?? 0;
      if (current <= 0) {
        tx.set(ref, { postCount: 0 }, { merge: true });
      } else {
        tx.update(ref, { postCount: FieldValue.increment(-1) });
      }
    });
  },
);
