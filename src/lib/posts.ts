import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

/**
 * Live site / CI builds omit drafts and future `pubDate`s.
 * Local `astro dev` previews drafts + future posts.
 * Set INCLUDE_FUTURE_POSTS=1 on a build to force-include scheduled (non-draft) posts.
 */
export function isPublished(post: PostEntry, now = new Date()): boolean {
  if (post.data.draft && !import.meta.env.DEV) return false;
  if (import.meta.env.DEV || process.env.INCLUDE_FUTURE_POSTS === "1") {
    return true;
  }
  return post.data.pubDate.getTime() <= now.getTime();
}

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts", (post) => isPublished(post));
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
