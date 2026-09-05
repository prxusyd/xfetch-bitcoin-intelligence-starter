// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
export class WorkflowRequestError extends Error {
    code;
    uncertain;
    retryAfterMs;
    constructor(message, code, uncertain = false, retryAfterMs = 0) {
        super(message);
        this.code = code;
        this.uncertain = uncertain;
        this.retryAfterMs = retryAfterMs;
        this.name = "WorkflowRequestError";
    }
}
