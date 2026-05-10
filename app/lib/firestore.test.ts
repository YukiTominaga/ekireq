import { describe, expect, it } from "vitest";
import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { mapDocToPost, type Post } from "./firestore";

function fakeDoc(
  id: string,
  data: Record<string, unknown>,
): QueryDocumentSnapshot {
  return { id, data: () => data } as unknown as QueryDocumentSnapshot;
}

describe("mapDocToPost", () => {
  it("maps every populated field through unchanged", () => {
    const ts = { toMillis: () => 1_700_000_000_000 } as unknown as Timestamp;
    const doc = fakeDoc("post1", {
      stationKey: "東京:渋谷",
      stationName: "渋谷",
      prefecture: "東京",
      userId: "u1",
      userName: "Alice",
      userPhotoURL: "https://example.com/a.jpg",
      text: "コーヒーが欲しい",
      categories: ["飲食店"],
      likesCount: 3,
      likedBy: ["u2", "u3", "u4"],
      reportsCount: 1,
      createdAt: ts,
    });
    expect(mapDocToPost(doc)).toEqual<Post>({
      id: "post1",
      stationKey: "東京:渋谷",
      stationName: "渋谷",
      prefecture: "東京",
      userId: "u1",
      userName: "Alice",
      userPhotoURL: "https://example.com/a.jpg",
      text: "コーヒーが欲しい",
      categories: ["飲食店"],
      likesCount: 3,
      likedBy: ["u2", "u3", "u4"],
      reportsCount: 1,
      createdAt: ts,
    });
  });

  it("uses the doc id as the post id", () => {
    const doc = fakeDoc("custom-id", {
      stationKey: "東京:池袋",
      stationName: "池袋",
      prefecture: "東京",
      userId: "u1",
      userName: "Bob",
      text: "...",
    });
    expect(mapDocToPost(doc).id).toBe("custom-id");
  });

  it("falls back to safe defaults when optional fields are missing", () => {
    const doc = fakeDoc("post2", {
      stationKey: "東京:新宿",
      stationName: "新宿",
      prefecture: "東京",
      userId: "u9",
      userName: "Bob",
      text: "本屋が欲しい",
    });
    const post = mapDocToPost(doc);
    expect(post.userPhotoURL).toBeNull();
    expect(post.categories).toEqual([]);
    expect(post.likesCount).toBe(0);
    expect(post.likedBy).toEqual([]);
    expect(post.reportsCount).toBe(0);
    expect(post.createdAt).toBeNull();
  });

  it("normalizes an explicit null userPhotoURL to null", () => {
    const doc = fakeDoc("post3", {
      stationKey: "東京:池袋",
      stationName: "池袋",
      prefecture: "東京",
      userId: "u1",
      userName: "Bob",
      userPhotoURL: null,
      text: "...",
    });
    expect(mapDocToPost(doc).userPhotoURL).toBeNull();
  });
});
