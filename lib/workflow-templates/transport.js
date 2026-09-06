// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
import { WorkflowRequestError } from "./types.js";
export function decodeWorkflowResponse(input) {
    const body = input.body;
    if (input.status < 200 || input.status >= 300) {
        const code = body?.error?.code;
        const messages = {
            insufficient_credits: "Your account needs more credits. Collected results can still be exported.",
            invalid_api_key: "Check your xfetch API key.",
            revoked_api_key: "This API key has been revoked.",
            rate_limited: "Requests are temporarily rate limited.",
            invalid_request: "Check the query and saved pagination parameters.",
            resource_not_found: "The requested resource is unavailable.",
            service_unavailable: "The API is temporarily unavailable.",
            internal_error: "The API could not complete this request."
        };
        if (!code || !messages[code])
            throw new WorkflowRequestError("Could not determine whether this request was charged.", "unknown_response", true);
        const seconds = Number(input.retryAfter);
        const after = Number.isFinite(seconds)
            ? seconds * 1_000
            : Math.max(0, Date.parse(input.retryAfter ?? "") - Date.now());
        throw new WorkflowRequestError(messages[code], code, false, Number.isFinite(after) ? after : 0);
    }
    if (!body ||
        !("data" in body) ||
        !Number.isSafeInteger(body.meta?.credits?.charged) ||
        body.meta.credits.charged < 0) {
        throw new WorkflowRequestError("Could not verify the request's charge.", "invalid_response", true);
    }
    const token = body.meta?.pagination?.next_token;
    if (token !== undefined && (typeof token !== "string" || token.length > 16_384)) {
        throw new WorkflowRequestError("Unexpected pagination token.", "invalid_response", true);
    }
    return {
        data: body.data,
        charged: body.meta.credits.charged,
        ...(token ? { nextToken: token } : {})
    };
}
export function createWorkflowHttpTransport(input) {
    const base = new URL(input.baseUrl ?? "https://api.xfetch.io");
    if (base.username ||
        base.password ||
        (base.protocol !== "https:" &&
            !(base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))) {
        throw new Error("Use an HTTPS API URL, or localhost for local development.");
    }
    const fetchImpl = input.fetchImpl ?? globalThis.fetch;
    return {
        async request(path) {
            try {
                const response = await fetchImpl(new URL(path, base), {
                    redirect: "error",
                    signal: AbortSignal.timeout(15_000),
                    headers: {
                        authorization: `Bearer ${input.apiKey}`,
                        accept: "application/json"
                    }
                });
                const body = await response.json();
                return decodeWorkflowResponse({
                    status: response.status,
                    body,
                    retryAfter: response.headers.get("retry-after")
                });
            }
            catch (error) {
                if (error instanceof WorkflowRequestError)
                    throw error;
                throw new WorkflowRequestError("The response was interrupted. Check usage before trying again.", "transport_error", true);
            }
        }
    };
}
