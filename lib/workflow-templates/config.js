// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
export const WORKFLOW_DEFAULTS = {
    pageSize: 20,
    maxPosts: 100,
    maxPages: 10,
    budgetCredits: 250
};
export const WORKFLOW_LIMITS = {
    posts: 1_000,
    pages: 100,
    accounts: 10,
    credits: 100_000,
    seenIds: 100_000,
    checkpointBytes: 12_000_000
};
function integer(value, fallback, maximum, name) {
    const number = value === undefined ? fallback : value;
    if (typeof number !== "number" || !Number.isInteger(number) || number < 1 || number > maximum) {
        throw new Error(`${name} must be an integer from 1 to ${maximum}.`);
    }
    return number;
}
export function parseWorkflowConfig(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Provide a template configuration.");
    const input = value;
    if (input.template !== "topic" && input.template !== "accounts")
        throw new Error("Choose a topic or accounts template.");
    const template = input.template;
    const query = typeof input.query === "string" ? input.query.trim() : "";
    if (template === "topic" && (!query || query.length > 512))
        throw new Error("Enter a search query of up to 512 characters.");
    const rawAccounts = Array.isArray(input.accounts) ? input.accounts : [];
    if (rawAccounts.some((a) => typeof a !== "string"))
        throw new Error("Accounts must be usernames.");
    const accounts = [
        ...new Set(rawAccounts.map((a) => a.trim().replace(/^@/, "").toLowerCase()))
    ];
    if (template === "accounts" &&
        (accounts.length < 1 ||
            accounts.length > WORKFLOW_LIMITS.accounts ||
            accounts.some((a) => !/^[a-z0-9_]{1,15}$/.test(a)))) {
        throw new Error(`Enter 1–${WORKFLOW_LIMITS.accounts} valid X/Twitter usernames.`);
    }
    return {
        template,
        query: template === "topic" ? query : "",
        accounts: template === "accounts" ? accounts : [],
        pageSize: integer(input.pageSize, WORKFLOW_DEFAULTS.pageSize, 20, "Page size"),
        maxPosts: integer(input.maxPosts, WORKFLOW_DEFAULTS.maxPosts, WORKFLOW_LIMITS.posts, "Post target"),
        maxPages: integer(input.maxPages, WORKFLOW_DEFAULTS.maxPages, WORKFLOW_LIMITS.pages, "Request limit"),
        budgetCredits: integer(input.budgetCredits, WORKFLOW_DEFAULTS.budgetCredits, WORKFLOW_LIMITS.credits, "Credit budget")
    };
}
/** Only parameters tied to the API cursor belong in this identity. */
export function workflowIdentity(config) {
    return JSON.stringify([config.template, config.query, config.accounts, config.pageSize]);
}
