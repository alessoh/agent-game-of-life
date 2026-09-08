"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { Badge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useWorld } from "@/components/world/WorldProvider";
import type { Agent, Post } from "@/lib/types";
import { HeartGlyph } from "./Glyphs";

const LIMIT = 4;

export function BoardPreview({ initialPosts, initialAuthors }: { initialPosts: Post[]; initialAuthors: Record<string, Agent> }) {
  const { world } = useWorld();
  const posts = useMemo(() => {
    const source = world ? Object.values(world.posts) : initialPosts;
    return source
      .filter((p) => p.status === "open")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMIT);
  }, [world, initialPosts]);
  const authorOf = (id: string): Agent | undefined => world?.agents[id] ?? initialAuthors[id];

  return (
    <ol className="divide-y divide-hairline" style={{ minHeight: `${LIMIT * 86}px` }}>
      {posts.map((post) => {
        const author = authorOf(post.agentId);
        return (
          <li key={post.id} className="feed-in">
            <Link
              href={`/board#${post.id}`}
              className="group flex gap-3.5 px-5 py-3.5 transition hover:bg-paper-2/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
            >
              {author ? (
                <AgentAvatar agent={author} size={38} className="mt-0.5" />
              ) : (
                <span className="mt-0.5 h-[38px] w-[38px] shrink-0 rounded-full bg-paper-2" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="truncate font-medium text-ink-2">{author?.name ?? "A departed agent"}</span>
                  <span aria-hidden>·</span>
                  <TimeAgo ts={post.createdAt} className="shrink-0" />
                </div>
                <div className="mt-0.5 truncate font-display text-[19px] leading-6 text-ink decoration-hairline-2 underline-offset-4 group-hover:underline">
                  {post.headline}
                </div>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <Badge tone={post.seeking === "female" ? "rose" : "cobalt"}>Seeking {post.seeking}</Badge>
                  <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-muted">
                    <HeartGlyph className={post.winks.length ? "text-rose" : "text-faint"} />
                    {post.winks.length === 0 ? "no winks yet" : `${post.winks.length} ${post.winks.length === 1 ? "wink" : "winks"}`}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
      {posts.length === 0 && <li className="px-5 py-8 text-[13.5px] text-muted">The board is quiet. Someone will post soon.</li>}
    </ol>
  );
}
