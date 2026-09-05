// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
import { parseWorkflowConfig, workflowIdentity, WORKFLOW_LIMITS } from "./config.js";
export function createWorkflowCheckpoint(config, previous, now = new Date()) {
    const identity = workflowIdentity(config);
    const seen = previous?.identity === identity
        ? [...previous.seenPostIds, ...previous.report.posts.map((p) => p.id)]
        : [];
    const report = {
        version: 1,
        template: config.template,
        input: { query: config.query, accounts: [...config.accounts] },
        startedAt: now.toISOString(),
        finishedAt: null,
        durationMs: 0,
        synthetic: false,
        posts: [],
        authors: [],
        newPostIds: [],
        duplicatesRemoved: 0,
        requests: 0,
        pages: 0,
        creditsCharged: 0,
        creditsUncertain: 0,
        budgetCredits: config.budgetCredits,
        stopReason: "running",
        message: "",
        accountsCompleted: []
    };
    return {
        version: 1,
        identity,
        config,
        report,
        seenPostIds: [...new Set(seen)].slice(-WORKFLOW_LIMITS.seenIds),
        stream: 0,
        phase: config.template === "topic" ? "search" : "profile",
        accountId: null,
        nextToken: null,
        usedTokens: [],
        streamPostIds: [],
        pendingCredits: 0,
        reachedTarget: false
    };
}
/** Checkpoints are untrusted imports, never arbitrary request paths or credentials. */
export function parseWorkflowCheckpoint(raw) {
    if (raw.length > WORKFLOW_LIMITS.checkpointBytes)
        throw new Error("Progress file is too large.");
    const x = JSON.parse(raw);
    const config = parseWorkflowConfig(x?.config);
    const safeInteger = (n, max = 1_000_000) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
    const ids = (a, max) => Array.isArray(a) &&
        a.length <= max &&
        a.every((id) => typeof id === "string" && /^\d{1,30}$/.test(id));
    const token = (t) => t === null || (typeof t === "string" && t.length <= 16_384);
    const reasons = [
        "running",
        "complete",
        "post_limit",
        "page_limit",
        "budget_limit",
        "cancelled",
        "request_failed",
        "invalid_response",
        "uncertain_request",
        "repeated_cursor",
        "budget_unsupported"
    ];
    if (x.version !== 1 ||
        x.identity !== workflowIdentity(config) ||
        !x.report ||
        x.report.version !== 1 ||
        x.report.template !== config.template ||
        !safeInteger(x.stream, config.template === "topic" ? 1 : config.accounts.length) ||
        (config.template === "topic"
            ? x.phase !== "search"
            : !["profile", "timeline"].includes(x.phase)) ||
        !token(x.nextToken) ||
        !(x.accountId === null ||
            (typeof x.accountId === "string" && /^\d{1,30}$/.test(x.accountId))) ||
        typeof x.reachedTarget !== "boolean" ||
        !safeInteger(x.pendingCredits, WORKFLOW_LIMITS.credits) ||
        !ids(x.seenPostIds, WORKFLOW_LIMITS.seenIds) ||
        !ids(x.streamPostIds, 20_000) ||
        !Array.isArray(x.usedTokens) ||
        x.usedTokens.length > WORKFLOW_LIMITS.pages ||
        !x.usedTokens.every((t) => typeof t === "string" && token(t)) ||
        !Array.isArray(x.report.posts) ||
        x.report.posts.length > 20_000 ||
        !x.report.posts.every((p) => p &&
            typeof p.id === "string" &&
            /^\d{1,30}$/.test(p.id) &&
            typeof p.text === "string" &&
            typeof p.author_id === "string" &&
            /^\d{1,30}$/.test(p.author_id)) ||
        !Array.isArray(x.report.authors) ||
        x.report.authors.length > 20_000 ||
        !x.report.authors.every((a) => a && typeof a === "object" && (typeof a.id === "string" || typeof a.username === "string")) ||
        !ids(x.report.newPostIds, 20_000) ||
        !Array.isArray(x.report.accountsCompleted) ||
        !x.report.accountsCompleted.every((a) => config.accounts.includes(a)) ||
        !safeInteger(x.report.creditsCharged, WORKFLOW_LIMITS.credits) ||
        !safeInteger(x.report.creditsUncertain, WORKFLOW_LIMITS.credits) ||
        !safeInteger(x.report.requests, WORKFLOW_LIMITS.pages) ||
        !safeInteger(x.report.pages, WORKFLOW_LIMITS.pages) ||
        !safeInteger(x.report.duplicatesRemoved) ||
        !safeInteger(x.report.durationMs, Number.MAX_SAFE_INTEGER) ||
        !reasons.includes(x.report.stopReason) ||
        typeof x.report.message !== "string" ||
        x.report.message.length > 2_000 ||
        !safeInteger(x.report.budgetCredits, WORKFLOW_LIMITS.credits) ||
        !(x.report.finishedAt === null ||
            (typeof x.report.finishedAt === "string" && Number.isFinite(Date.parse(x.report.finishedAt)))) ||
        typeof x.report.startedAt !== "string" ||
        !Number.isFinite(Date.parse(x.report.startedAt))) {
        throw new Error("Progress file is invalid or from an unsupported version.");
    }
    const r = x.report;
    const report = {
        version: 1,
        template: config.template,
        input: { query: config.query, accounts: config.accounts },
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        durationMs: r.durationMs,
        synthetic: r.synthetic === true,
        posts: r.posts,
        authors: r.authors,
        newPostIds: r.newPostIds,
        duplicatesRemoved: r.duplicatesRemoved,
        requests: r.requests,
        pages: r.pages,
        creditsCharged: r.creditsCharged,
        creditsUncertain: r.creditsUncertain,
        budgetCredits: r.budgetCredits,
        stopReason: r.stopReason,
        message: r.message,
        accountsCompleted: r.accountsCompleted
    };
    return {
        version: 1,
        identity: x.identity,
        config,
        report,
        stream: x.stream,
        phase: x.phase,
        accountId: x.accountId,
        nextToken: x.nextToken,
        usedTokens: x.usedTokens,
        streamPostIds: x.streamPostIds,
        pendingCredits: x.pendingCredits,
        reachedTarget: x.reachedTarget,
        seenPostIds: x.seenPostIds
    };
}
