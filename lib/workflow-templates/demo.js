// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
import { calculateEndpointCost } from "../endpoint-pricing.js";
import { WorkflowRequestError } from "./types.js";
/** Handwritten fixtures; never presented as real people, posts or production timing. */
export function createWorkflowDemoTransport() {
    const people = [
        {
            id: "900000000000000001",
            username: "demo_research",
            name: "Demo Research",
            status: "active",
            description: "Synthetic account for the offline example.",
            follower_count: 120
        },
        {
            id: "900000000000000002",
            username: "demo_builder",
            name: "Demo Builder",
            status: "active",
            follower_count: 85
        }
    ];
    const posts = [
        {
            id: "900000000000000101",
            author_id: people[0].id,
            text: "Synthetic example: collect useful posts, then connect each post to its author.\nFull text survives the JSON and CSV export.",
            created_at: "2026-01-01T09:00:00.000Z",
            like_count: 4,
            retweet_count: 1
        },
        {
            id: "900000000000000102",
            author_id: people[1].id,
            text: "Synthetic example: page two repeats this post. The report keeps one copy.",
            created_at: "2026-01-01T10:00:00.000Z"
        },
        {
            id: "900000000000000103",
            author_id: "900000000000000003",
            text: "Synthetic example: author details can be unavailable. Keep the post and preserve its author ID.",
            created_at: "2026-01-01T11:00:00.000Z"
        }
    ];
    return {
        supportsBudget: async () => true,
        async request(path, budget) {
            const url = new URL(path, "https://demo.invalid");
            const second = url.searchParams.has("next_token");
            let data;
            let count;
            let nextToken;
            let key;
            if (url.pathname.includes("/search/")) {
                const batch = second ? posts.slice(1) : posts.slice(0, 2);
                data = {
                    tweets: batch,
                    authors: second ? [people[1], { id: posts[2].author_id, status: "not_found" }] : people
                };
                count = batch.length;
                key = "search.enriched";
                nextToken = second ? undefined : "demo-page-2";
            }
            else if (url.pathname.includes("/profiles/")) {
                const username = decodeURIComponent(url.pathname.split("/").at(-1));
                const person = people.find((p) => p.username === username);
                const recent = person ? posts.filter((p) => p.author_id === person.id) : [];
                data = { user: person ?? { username, status: "not_found" }, recent_tweets: recent };
                count = recent.length;
                key = "profile.lookup";
            }
            else {
                const id = url.pathname.split("/")[3];
                const batch = posts.filter((p) => p.author_id === id);
                data = batch;
                count = batch.length;
                key = "user.tweets";
            }
            const charged = calculateEndpointCost(key, { itemCount: count });
            if (charged > budget)
                throw new WorkflowRequestError("The demo page exceeds the remaining budget.", "budget_exceeded");
            return { data, charged, ...(nextToken ? { nextToken } : {}) };
        }
    };
}
