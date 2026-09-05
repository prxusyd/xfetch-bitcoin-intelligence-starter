// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
import { calculateEndpointCost } from "../endpoint-pricing.js";
import { PROFILE_SNAPSHOT_POST_LIMIT } from "../request-budget.js";
import { createWorkflowCheckpoint } from "./checkpoint.js";
import { parseWorkflowConfig, workflowIdentity } from "./config.js";
import { WorkflowRequestError } from "./types.js";
const statusMessages = {
    running: "Collecting public data…",
    complete: "Reached the end of the available results.",
    post_limit: "Reached the post target. The complete final page is retained.",
    page_limit: "Reached the request limit. Collected results are ready to export.",
    budget_limit: "Stopped at the credit budget. Collected results are ready to export.",
    cancelled: "Stopped after the current request. Collected results are ready to export.",
    request_failed: "A request failed. Collected results and progress are preserved.",
    invalid_response: "The paid response could not be read. Export collected results and start a new run after checking the API response.",
    uncertain_request: "The last request may have been charged. Automatic retries are stopped; check usage before starting a new run.",
    repeated_cursor: "The API repeated a pagination token. Stopped to avoid repeated requests.",
    budget_unsupported: "Budget protection is not available from this API deployment. No paid request was sent."
};
function object(x) {
    if (!x || typeof x !== "object" || Array.isArray(x))
        throw new WorkflowRequestError("Unexpected API response shape.", "invalid_response", true);
    return x;
}
function posts(value) {
    if (!Array.isArray(value) ||
        value.length > 1_000 ||
        !value.every((p) => p &&
            typeof p === "object" &&
            typeof p.id === "string" &&
            /^\d{1,30}$/.test(p.id) &&
            typeof p.text === "string" &&
            typeof p.author_id === "string" &&
            /^\d{1,30}$/.test(p.author_id))) {
        throw new WorkflowRequestError("Unexpected post records.", "invalid_response", true);
    }
    return value;
}
function authors(value) {
    if (!Array.isArray(value) ||
        value.length > 1_000 ||
        !value.every((a) => a && typeof a === "object" && (typeof a.id === "string" || typeof a.username === "string"))) {
        throw new WorkflowRequestError("Unexpected author records.", "invalid_response", true);
    }
    return value;
}
export async function runWorkflow(input) {
    const config = parseWorkflowConfig(input.config);
    if (input.previous && input.previous.report.synthetic !== (input.synthetic === true)) {
        throw new Error("Demo and live runs must use separate progress files.");
    }
    const now = input.now ?? (() => new Date());
    if (input.resume && (!input.previous || input.previous.identity !== workflowIdentity(config))) {
        throw new Error("Use the same accounts, query and page size to resume this progress file.");
    }
    if (input.previous?.pendingCredits || input.previous?.report.creditsUncertain) {
        throw new Error(statusMessages.uncertain_request);
    }
    if (input.resume &&
        ["invalid_response", "repeated_cursor"].includes(input.previous.report.stopReason)) {
        throw new Error("This stopped run cannot safely resume. Export the results and start a new run.");
    }
    const c = input.resume && input.previous
        ? structuredClone(input.previous)
        : createWorkflowCheckpoint(config, input.previous, now());
    c.config = config;
    c.report.budgetCredits = config.budgetCredits;
    c.report.synthetic = input.synthetic === true;
    c.report.stopReason = "running";
    c.report.message = statusMessages.running;
    c.report.finishedAt = null;
    const started = now().getTime();
    const previousDuration = c.report.durationMs;
    const seenBefore = new Set(c.seenPostIds);
    const knownPosts = new Map(c.report.posts.map((p) => [p.id, p]));
    const knownAuthors = new Map(c.report.authors.map((a) => [a.id ?? `@${a.username}`, a]));
    const freshIds = new Set(c.report.newPostIds);
    let streamIds = new Set(c.streamPostIds);
    let retryCount = 0;
    async function save() {
        c.report.posts = [...knownPosts.values()];
        c.report.authors = [...knownAuthors.values()];
        c.report.newPostIds = [...freshIds];
        c.streamPostIds = [...streamIds];
        c.report.durationMs = previousDuration + Math.max(0, now().getTime() - started);
        await input.onCheckpoint?.(structuredClone(c));
    }
    async function finish(reason, message = statusMessages[reason]) {
        c.report.stopReason = reason;
        c.report.message = message;
        c.report.finishedAt = now().toISOString();
        await save();
        return c;
    }
    function advance() {
        if (config.template === "accounts")
            c.report.accountsCompleted.push(config.accounts[c.stream]);
        c.stream += 1;
        c.phase = config.template === "topic" ? "search" : "profile";
        c.accountId = null;
        c.nextToken = null;
        c.usedTokens = [];
        streamIds = new Set();
    }
    try {
        if (!(await input.transport.supportsBudget()))
            return finish("budget_unsupported");
    }
    catch {
        return finish("request_failed", "Could not verify API budget support. No paid request was sent.");
    }
    const streamCount = config.template === "topic" ? 1 : config.accounts.length;
    while (c.stream < streamCount) {
        if (input.shouldStop?.())
            return finish("cancelled");
        if (c.report.requests >= config.maxPages)
            return finish("page_limit");
        const remaining = config.budgetCredits - c.report.creditsCharged;
        if (remaining <= 0)
            return finish("budget_limit");
        let path;
        let requestBudget;
        if (c.phase === "search") {
            requestBudget = calculateEndpointCost("search.enriched", { itemCount: config.pageSize });
            if (remaining < requestBudget)
                return finish("budget_limit");
            const params = new URLSearchParams({ query: config.query, limit: String(config.pageSize) });
            if (c.nextToken)
                params.set("next_token", c.nextToken);
            path = `/v1/search/recent/enriched?${params}`;
        }
        else if (c.phase === "profile") {
            requestBudget = Math.min(remaining, calculateEndpointCost("profile.lookup", { itemCount: PROFILE_SNAPSHOT_POST_LIMIT }));
            path = `/v1/profiles/by-username/${encodeURIComponent(config.accounts[c.stream])}`;
        }
        else {
            if (!c.accountId || !/^\d{1,30}$/.test(c.accountId))
                return finish("request_failed", "Account ID is unavailable; the profile can still be exported.");
            requestBudget = remaining;
            const params = new URLSearchParams();
            if (c.nextToken)
                params.set("next_token", c.nextToken);
            path = `/v1/users/${c.accountId}/tweets${params.size ? `?${params}` : ""}`;
        }
        // Persist the reservation before sending: a crash cannot silently replay a paid read.
        c.pendingCredits = requestBudget;
        c.report.requests += 1;
        await save();
        let page;
        try {
            page = await input.transport.request(path, requestBudget);
        }
        catch (error) {
            if (!(error instanceof WorkflowRequestError) || error.uncertain) {
                c.report.creditsUncertain = c.pendingCredits;
                return finish("uncertain_request");
            }
            c.pendingCredits = 0;
            await save();
            if (error.code === "rate_limited" &&
                retryCount < 2 &&
                c.report.requests < config.maxPages &&
                !input.shouldStop?.()) {
                retryCount += 1;
                await (input.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(Math.min(30_000, Math.max(1_000, error.retryAfterMs || retryCount * 1_000)));
                continue;
            }
            return finish(error.code === "budget_exceeded" ? "budget_limit" : "request_failed", error.message);
        }
        if (!Number.isSafeInteger(page.charged) || page.charged < 0 || page.charged > requestBudget) {
            c.report.creditsUncertain = c.pendingCredits;
            return finish("uncertain_request", "Could not reconcile the API charge with the request budget. Check usage before running again.");
        }
        c.pendingCredits = 0;
        c.report.creditsCharged += page.charged;
        c.report.pages += 1;
        retryCount = 0;
        let batch;
        let people = [];
        try {
            if (c.phase === "search") {
                const data = object(page.data);
                batch = posts(data.tweets);
                people = authors(data.authors);
            }
            else if (c.phase === "profile") {
                const data = object(page.data);
                people = authors([data.user]);
                batch = posts(data.recent_tweets);
                const person = people[0];
                c.accountId = typeof person.id === "string" ? person.id : null;
            }
            else
                batch = posts(page.data);
        }
        catch {
            return finish("invalid_response", "The paid response had an unexpected data shape. Its confirmed charge is recorded; previous results are preserved.");
        }
        for (const person of people) {
            const key = person.id ?? `@${person.username}`;
            knownAuthors.set(key, { ...knownAuthors.get(key), ...person });
        }
        for (const post of batch) {
            if (knownPosts.has(post.id))
                c.report.duplicatesRemoved += 1;
            else if (!seenBefore.has(post.id))
                freshIds.add(post.id);
            knownPosts.set(post.id, post);
            streamIds.add(post.id);
        }
        const reachedTarget = streamIds.size >= config.maxPosts;
        if (c.phase === "profile") {
            if (people[0]?.status !== "active" || people[0]?.protected === true || reachedTarget) {
                c.reachedTarget ||= reachedTarget;
                advance();
            }
            else {
                c.phase = "timeline";
                c.nextToken = null;
            }
        }
        else if (reachedTarget || !page.nextToken) {
            c.reachedTarget ||= reachedTarget;
            advance();
        }
        else {
            if (page.nextToken === c.nextToken || c.usedTokens.includes(page.nextToken))
                return finish("repeated_cursor");
            if (c.nextToken)
                c.usedTokens.push(c.nextToken);
            c.nextToken = page.nextToken;
        }
        await save();
    }
    return finish(c.reachedTarget ? "post_limit" : "complete");
}
