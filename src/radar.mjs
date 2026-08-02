function count(value) {
  return Number.isFinite(value) ? value : 0;
}

function totalEngagement(tweet) {
  return (
    count(tweet.like_count) +
    count(tweet.retweet_count) +
    count(tweet.reply_count) +
    count(tweet.quote_count)
  );
}

function compactText(value, maxLength = 220) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function publicPostUrl(author, tweetId) {
  return author?.username ? `https://x.com/${author.username}/status/${tweetId}` : undefined;
}

export function buildRadar({ body, query, generatedAt = new Date().toISOString() }) {
  const authorsById = new Map(body.data.authors.map((author) => [author.id, author]));

  const topPosts = body.data.tweets
    .map((tweet) => {
      const author = authorsById.get(tweet.author_id);
      const url = publicPostUrl(author, tweet.id);
      return {
        tweet_id: tweet.id,
        author: author
          ? { id: author.id, username: author.username, name: author.name }
          : { id: tweet.author_id },
        created_at: tweet.created_at,
        text: compactText(tweet.text),
        ...(url ? { url } : {}),
        engagement: {
          likes: count(tweet.like_count),
          reposts: count(tweet.retweet_count),
          replies: count(tweet.reply_count),
          quotes: count(tweet.quote_count),
          total: totalEngagement(tweet)
        }
      };
    })
    .sort((a, b) => b.engagement.total - a.engagement.total)
    .slice(0, 5);

  const authorActivity = new Map();
  for (const tweet of body.data.tweets) {
    const current = authorActivity.get(tweet.author_id) ?? {
      post_count: 0,
      total_engagement: 0
    };
    current.post_count += 1;
    current.total_engagement += totalEngagement(tweet);
    authorActivity.set(tweet.author_id, current);
  }

  const activeAuthors = [...authorActivity.entries()]
    .map(([authorId, activity]) => {
      const author = authorsById.get(authorId);
      return {
        author_id: authorId,
        ...(author ? { username: author.username, name: author.name } : {}),
        ...activity
      };
    })
    .sort(
      (a, b) =>
        b.post_count - a.post_count || b.total_engagement - a.total_engagement
    )
    .slice(0, 5);

  return {
    generated_at: generatedAt,
    query,
    fetched_post_count: body.data.tweets.length,
    top_posts: topPosts,
    active_authors: activeAuthors,
    has_next_page: Boolean(body.meta.pagination?.next_token),
    usage: {
      credits_charged: body.meta.credits.charged,
      credits_remaining: body.meta.credits.remaining
    },
    note: "Public engagement counts are descriptive observations, not trading signals or investment advice."
  };
}

export function renderConsoleSummary(radar) {
  const lines = [
    "Bitcoin X/Twitter intelligence snapshot",
    `Query: ${radar.query}`,
    `Posts returned: ${radar.fetched_post_count}`,
    "",
    "Top posts by observed public engagement:"
  ];

  if (radar.top_posts.length === 0) {
    lines.push("No posts matched this page. Try a broader query.");
  } else {
    radar.top_posts.forEach((post, index) => {
      const handle = post.author.username ? `@${post.author.username}` : post.author.id;
      lines.push(`${index + 1}. ${handle} · ${post.engagement.total} interactions`);
      lines.push(`   ${post.text}`);
      if (post.url) lines.push(`   ${post.url}`);
    });
  }

  lines.push("");
  lines.push(`Credits charged: ${radar.usage.credits_charged}`);
  lines.push(`More results available: ${radar.has_next_page ? "yes" : "no"}`);
  lines.push(radar.note);
  return lines.join("\n");
}
