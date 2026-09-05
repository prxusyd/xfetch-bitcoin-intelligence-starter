// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
/** Optional per-request limit for /v1 reads; checked before any debit. */
export const CREDIT_BUDGET_HEADER = "x-xfetch-max-credits";
export const CREDIT_BUDGET_SUPPORT_HEADER = "x-xfetch-credit-budget";
export const CREDIT_BUDGET_VERSION = "v1";
export const MAX_REQUEST_CREDIT_BUDGET = 1_000_000;
export class CreditBudgetExceededError extends Error {
    constructor() {
        super("The response would exceed this request's credit budget.");
        this.name = "CreditBudgetExceededError";
    }
}
export function parseCreditBudget(value) {
    if (value === undefined)
        return undefined;
    if (typeof value !== "string" || !/^\d{1,7}$/.test(value)) {
        throw new Error("Invalid credit budget");
    }
    const credits = Number(value);
    if (credits > MAX_REQUEST_CREDIT_BUDGET)
        throw new Error("Invalid credit budget");
    return credits;
}
/** Public profile snapshots contain at most this many recent posts. */
export const PROFILE_SNAPSHOT_POST_LIMIT = 20;
