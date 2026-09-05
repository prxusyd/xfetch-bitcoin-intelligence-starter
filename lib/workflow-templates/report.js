// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function cell(value) {
    let text = value === undefined || value === null ? "" : String(value);
    // CSV is opened in spreadsheets: untrusted public text must not become a formula.
    if (/^[\s]*[=+@-]|^[\t\r]/.test(text))
        text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}
function csv(columns, rows) {
    return [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
function metric(record, field) {
    return typeof record[field] === "number" ? record[field] : undefined;
}
export function workflowPostsCsv(report, onlyNew = false) {
    const authors = new Map(report.authors.filter((a) => a.id).map((a) => [a.id, a]));
    const fresh = new Set(report.newPostIds);
    return csv([
        "id",
        "text",
        "author_id",
        "author_username",
        "created_at",
        "like_count",
        "retweet_count",
        "reply_count",
        "quote_count",
        "is_new",
        "record_json"
    ], report.posts
        .filter((p) => !onlyNew || fresh.has(p.id))
        .map((p) => [
        p.id,
        p.text,
        p.author_id,
        authors.get(p.author_id)?.username,
        p.created_at,
        metric(p, "like_count"),
        metric(p, "retweet_count"),
        metric(p, "reply_count"),
        metric(p, "quote_count"),
        fresh.has(p.id),
        JSON.stringify(p)
    ]));
}
export function workflowAuthorsCsv(report) {
    return csv(["id", "username", "name", "status", "description", "follower_count", "record_json"], report.authors.map((a) => [
        a.id,
        a.username,
        a.name,
        a.status,
        a.description,
        metric(a, "follower_count"),
        JSON.stringify(a)
    ]));
}
export const WORKFLOW_REPORT_CSS = `
.xf-report{--ink:#20282a;--ink-2:#596767;color:#20282a;font:15px/1.6 system-ui,sans-serif;max-width:1080px;margin:auto}.xf-report *{box-sizing:border-box}.xf-report h1{font-size:32px;line-height:1.15;letter-spacing:-1px}.xf-report h2{font-size:20px;margin-top:32px}.xf-report .xf-muted{color:#596767}.xf-report .xf-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:24px 0}.xf-report .xf-stat{padding:16px;background:#f1f6f3;border:1px solid #dce6df;border-radius:12px}.xf-report .xf-stat strong{display:block;font-size:26px}.xf-report .xf-note{padding:12px 16px;border-left:3px solid #368168;background:#f3f7f5}.xf-report .xf-post{border-top:1px solid #dce6df;padding:18px 0;overflow-wrap:anywhere}.xf-report .xf-text{white-space:pre-wrap;margin:10px 0}.xf-report a{color:#21604c;text-decoration:underline}.xf-report .xf-scroll{overflow:auto}.xf-report table{width:100%;border-collapse:collapse;text-align:left}.xf-report th,.xf-report td{padding:10px;border-bottom:1px solid #dce6df;vertical-align:top;overflow-wrap:anywhere}.xf-report th{font-size:12px;text-transform:uppercase;letter-spacing:.04em}.xf-report .xf-badge{font-size:12px;background:#e1ede5;border-radius:12px;padding:3px 8px;margin-left:8px}@media(max-width:600px){.xf-report .xf-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.xf-report h1{font-size:26px}}
`;
function authorLabel(author, id) {
    return author?.username ? `@${author.username}` : `Author ${id}`;
}
function postHtml(post, author, fresh, linkToPost) {
    const link = linkToPost && /^\d{1,30}$/.test(post.id)
        ? `<a href="https://x.com/i/status/${post.id}" target="_blank" rel="noopener noreferrer">View post ↗</a>`
        : "";
    return `<article class="xf-post"><strong>${escape(authorLabel(author, post.author_id))}</strong>${fresh ? '<span class="xf-badge">New this run</span>' : ""}<div class="xf-text">${escape(post.text)}</div><div class="xf-muted">${escape(post.created_at)} ${link}</div></article>`;
}
/** All imported or API text is escaped; no report content becomes executable markup. */
export function workflowReportBody(report, previewLimit = Number.MAX_SAFE_INTEGER) {
    const people = new Map(report.authors.filter((a) => a.id).map((a) => [a.id, a]));
    const fresh = new Set(report.newPostIds);
    const title = report.template === "topic" ? "Topic search & authors" : "Account profiles & activity";
    return `<div class="xf-report"><p class="xf-muted">xfetch · ${report.synthetic ? "Synthetic demo · no live data or credits" : "Public X/Twitter data"}</p><h1>${title}</h1><p>${escape(report.input.query || report.input.accounts.map((a) => `@${a}`).join(", "))}</p><div class="xf-stats">${[
        [report.posts.length, "unique posts"],
        [report.authors.length, "author records"],
        [report.newPostIds.length, "new posts"],
        [report.creditsCharged, report.synthetic ? "simulated credits" : "credits charged"]
    ]
        .map(([value, label]) => `<div class="xf-stat"><strong>${value}</strong>${label}</div>`)
        .join("")}</div><p class="xf-note">${escape(report.message)}${report.creditsUncertain ? ` Up to ${report.creditsUncertain} additional credits are unresolved.` : ""}</p><p class="xf-muted">${report.requests} requests · ${report.duplicatesRemoved} repeated records removed · ${(report.durationMs / 1000).toFixed(1)}s running · Started ${escape(report.startedAt)}</p><h2>People behind the posts</h2><div class="xf-scroll"><table><thead><tr><th>Account</th><th>Name</th><th>Status</th><th>Followers</th></tr></thead><tbody>${report.authors
        .slice(0, previewLimit)
        .map((a) => `<tr><td>${escape(a.username ? `@${a.username}` : a.id)}</td><td>${escape(a.name)}</td><td>${escape(a.status ?? "Unknown")}</td><td>${escape(metric(a, "follower_count") ?? "Unknown")}</td></tr>`)
        .join("")}</tbody></table></div><h2>Collected posts</h2>${report.posts
        .slice(0, previewLimit)
        .map((p) => postHtml(p, people.get(p.author_id), fresh.has(p.id), !report.synthetic))
        .join("")}${report.posts.length > previewLimit || report.authors.length > previewLimit ? `<p class="xf-muted">Preview shows up to ${previewLimit} posts and authors. Downloads include every collected record.</p>` : ""}</div>`;
}
export function workflowReportHtml(report) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>xfetch workflow report</title><style>body{margin:0;padding:32px 20px;background:#fff}${WORKFLOW_REPORT_CSS}</style></head><body>${workflowReportBody(report)}</body></html>`;
}
export function workflowFiles(report) {
    return {
        "report.json": JSON.stringify(report, null, 2) + "\n",
        "posts.csv": workflowPostsCsv(report),
        "new-posts.csv": workflowPostsCsv(report, true),
        "authors.csv": workflowAuthorsCsv(report),
        "report.html": workflowReportHtml(report)
    };
}
