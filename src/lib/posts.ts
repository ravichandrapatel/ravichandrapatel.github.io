import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

/**
 * Live site / CI builds omit drafts and future `pubDate`s.
 * Local `astro dev` keeps future posts so you can preview before the cron deploy.
 * Set INCLUDE_FUTURE_POSTS=1 on a build to force-include scheduled posts.
 */
export function isPublished(post: PostEntry, now = new Date()): boolean {
  if (post.data.draft) return false;
  const includeFuture =
    import.meta.env.DEV || process.env.INCLUDE_FUTURE_POSTS === "1";
  if (includeFuture) return true;
  return post.data.pubDate.getTime() <= now.getTime();
}

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts", (post) => isPublished(post));
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
