/**
 * Firestore セキュリティルールの allow/deny テスト (H-1 / H-3 を中心に)。
 *
 * 実行: `npm run test:rules`
 *   → firebase emulators:exec が firestore エミュレータを起動し、その中で vitest を走らせる。
 * 通常の `npm test` (vitest, app/**) には含めない (エミュレータ前提のため)。
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let testEnv: RulesTestEnvironment;

const OWNER = "owner-uid";
const ALICE = "alice-uid";
const BOB = "bob-uid";

/** 有効な投稿ドキュメント (H-3 の駅検証を満たす) */
function validPost(overrides: Record<string, unknown> = {}) {
  return {
    stationKey: "東京:渋谷",
    stationName: "渋谷",
    prefecture: "東京",
    userId: OWNER,
    userName: "Owner",
    userPhotoURL: null,
    text: "コーヒーが飲みたい",
    categories: ["飲食店"],
    likesCount: 0,
    likedBy: [] as string[],
    reportsCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

async function seedPost(id: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "posts", id), data);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-ekireq",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("posts create (H-3: 駅情報の検証)", () => {
  it("有効な駅情報なら作成できる", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(db, "posts", "p1"), validPost({ userId: ALICE })),
    );
  });

  it("都道府県がホワイトリスト外なら拒否", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "posts", "p1"),
        validPost({ userId: ALICE, prefecture: "大阪", stationKey: "大阪:渋谷" }),
      ),
    );
  });

  it("stationKey が {都道府県}:{駅名} と矛盾するなら拒否", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "posts", "p1"),
        validPost({ userId: ALICE, stationKey: "東京:新宿" }), // stationName は渋谷のまま
      ),
    );
  });

  it("stationKey が任意の偽文字列なら拒否 (stationStats 汚染の防止)", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "posts", "p1"),
        validPost({ userId: ALICE, stationKey: "fake-junk-key" }),
      ),
    );
  });

  it("stationName が空文字なら拒否", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "posts", "p1"),
        validPost({ userId: ALICE, stationName: "", stationKey: "東京:" }),
      ),
    );
  });

  it("reportsCount を 0 以外で作成しようとすると拒否 (既存仕様)", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "posts", "p1"), validPost({ userId: ALICE, reportsCount: 5 })),
    );
  });
});

describe("posts update (H-1: いいね/カウンタ改ざん防止)", () => {
  it("自分の uid を 1 件追加し likesCount を +1 できる", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "posts", "p1"), { likedBy: [ALICE], likesCount: 1 }),
    );
  });

  it("自分の uid を 1 件削除し likesCount を -1 できる", async () => {
    await seedPost("p1", validPost({ likedBy: [ALICE], likesCount: 1 }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "posts", "p1"), { likedBy: [], likesCount: 0 }),
    );
  });

  it("likedBy はそのままに likesCount だけ任意の値に水増しするのは拒否", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { likesCount: 999 }),
    );
  });

  it("likedBy を [自分] にしつつ likesCount を整合しない値にするのは拒否", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { likedBy: [ALICE], likesCount: 999 }),
    );
  });

  it("他人の uid を追加する (なりすまし like) のは拒否", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { likedBy: [BOB], likesCount: 1 }),
    );
  });

  it("他人の既存 like を削除するのは拒否", async () => {
    await seedPost("p1", validPost({ likedBy: [BOB], likesCount: 1 }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { likedBy: [], likesCount: 0 }),
    );
  });

  it("reportsCount をクライアントから更新するのは拒否", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { reportsCount: 99 }),
    );
  });

  it("like 操作に便乗して reportsCount も変えるのは拒否", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), {
        likedBy: [ALICE],
        likesCount: 1,
        reportsCount: 99,
      }),
    );
  });

  it("投稿者本人は userName を編集できる", async () => {
    await seedPost("p1", validPost({ userId: ALICE }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "posts", "p1"), { userName: "新しい名前" }),
    );
  });

  it("他人は userName を編集できない", async () => {
    await seedPost("p1", validPost({ userId: OWNER }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { userName: "乗っ取り" }),
    );
  });

  it("未認証ユーザーはいいねできない", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      updateDoc(doc(db, "posts", "p1"), { likedBy: ["anon"], likesCount: 1 }),
    );
  });
});

describe("posts read / delete (既存仕様の確認)", () => {
  it("未認証でも読める", async () => {
    await seedPost("p1", validPost());
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "posts", "p1")));
  });

  it("投稿者本人だけが削除できる", async () => {
    await seedPost("p1", validPost({ userId: OWNER }));
    const stranger = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(deleteDoc(doc(stranger, "posts", "p1")));
    const owner = testEnv.authenticatedContext(OWNER).firestore();
    await assertSucceeds(deleteDoc(doc(owner, "posts", "p1")));
  });
});

describe("reports create (既存仕様の確認)", () => {
  it("他人の投稿を 1 回通報できる", async () => {
    await seedPost("p1", validPost({ userId: OWNER }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(db, "reports", `p1_${ALICE}`), {
        postId: "p1",
        stationKey: "東京:渋谷",
        reporterId: ALICE,
        reason: "spam",
        createdAt: new Date(),
      }),
    );
  });

  it("自分の投稿は通報できない", async () => {
    await seedPost("p1", validPost({ userId: ALICE }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "reports", `p1_${ALICE}`), {
        postId: "p1",
        stationKey: "東京:渋谷",
        reporterId: ALICE,
        reason: "spam",
        createdAt: new Date(),
      }),
    );
  });

  it("reporterId を詐称した通報は拒否", async () => {
    await seedPost("p1", validPost({ userId: OWNER }));
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "reports", `p1_${ALICE}`), {
        postId: "p1",
        stationKey: "東京:渋谷",
        reporterId: BOB, // 自分以外
        reason: "spam",
        createdAt: new Date(),
      }),
    );
  });

  it("stationStats はクライアントから書けない", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "stationStats", "東京:渋谷"), { postCount: 100 }),
    );
  });
});

it("テストヘルパの健全性", () => {
  expect(validPost().stationKey).toBe("東京:渋谷");
});
