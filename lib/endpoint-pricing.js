// Generated from @xfetch/shared. Edit its TypeScript source, then run pnpm build:starter.
export const phase5aOfficialEndpointKeys = [
    "trend.lookup",
    "search.recent",
    "user.lookup",
    "user.multi",
    "user.tweets",
    "user.followers",
    "user.following",
    "tweet.lookup",
    "tweet.multi",
    "tweet.retweeters",
    "tweet.quotes",
    "list.tweets",
    "list.members",
    "list.followers",
    "community.lookup",
    "community.search"
];
const lookupRule = {
    kind: "base_plus_item",
    baseCredits: 1,
    itemCredits: 0
};
const basePlusItemRule = {
    kind: "base_plus_item",
    baseCredits: 1,
    itemCredits: 1
};
const enrichedSearchRule = {
    kind: "base_plus_item",
    baseCredits: 1,
    itemCredits: 2
};
const idsBlockRule = {
    kind: "base_plus_item_block",
    baseCredits: 1,
    itemCredits: 1,
    blockSize: 50
};
function makePricing(endpointKey, rule) {
    return {
        endpointKey,
        active: true,
        rule
    };
}
export const endpointPricing = {
    "trend.lookup": makePricing("trend.lookup", basePlusItemRule),
    "user.lookup": makePricing("user.lookup", lookupRule),
    "tweet.lookup": makePricing("tweet.lookup", lookupRule),
    "user.tweets": makePricing("user.tweets", basePlusItemRule),
    "user.tweets.replies": makePricing("user.tweets.replies", basePlusItemRule),
    "user.media": makePricing("user.media", basePlusItemRule),
    "user.followers": makePricing("user.followers", basePlusItemRule),
    "user.followers.ids": makePricing("user.followers.ids", idsBlockRule),
    "user.followers.profiles": makePricing("user.followers.profiles", basePlusItemRule),
    "user.followers.verified": makePricing("user.followers.verified", basePlusItemRule),
    "user.following": makePricing("user.following", basePlusItemRule),
    "user.following.ids": makePricing("user.following.ids", idsBlockRule),
    "user.following.profiles": makePricing("user.following.profiles", basePlusItemRule),
    "user.relationship": makePricing("user.relationship", lookupRule),
    "search.recent": makePricing("search.recent", basePlusItemRule),
    "search.enriched": makePricing("search.enriched", enrichedSearchRule),
    "user.multi": makePricing("user.multi", basePlusItemRule),
    "tweet.multi": makePricing("tweet.multi", basePlusItemRule),
    "tweet.retweeters": makePricing("tweet.retweeters", basePlusItemRule),
    "tweet.quotes": makePricing("tweet.quotes", basePlusItemRule),
    "tweet.conversation": makePricing("tweet.conversation", basePlusItemRule),
    "tweet.thread": makePricing("tweet.thread", basePlusItemRule),
    "tweet.article": makePricing("tweet.article", lookupRule),
    "tweet.context": makePricing("tweet.context", basePlusItemRule),
    "list.tweets": makePricing("list.tweets", basePlusItemRule),
    "list.members": makePricing("list.members", basePlusItemRule),
    "list.followers": makePricing("list.followers", basePlusItemRule),
    "community.lookup": makePricing("community.lookup", lookupRule),
    "community.search": makePricing("community.search", basePlusItemRule),
    "community.tweets": makePricing("community.tweets", basePlusItemRule),
    "community.members": makePricing("community.members", basePlusItemRule),
    "community.moderators": makePricing("community.moderators", basePlusItemRule),
    "profile.lookup": makePricing("profile.lookup", basePlusItemRule)
};
export function calculateEndpointCost(endpointKey, input) {
    const pricing = endpointPricing[endpointKey];
    if (!pricing.active) {
        throw new Error(`Endpoint is not active: ${endpointKey}`);
    }
    validateItemCount(input.itemCount);
    if (pricing.rule.kind === "base_plus_item_block") {
        return (pricing.rule.baseCredits +
            pricing.rule.itemCredits * Math.ceil(input.itemCount / pricing.rule.blockSize));
    }
    return pricing.rule.baseCredits + pricing.rule.itemCredits * input.itemCount;
}
export function getMinimumEndpointCost(endpointKey) {
    const pricing = endpointPricing[endpointKey];
    if (!pricing.active) {
        throw new Error(`Endpoint is not active: ${endpointKey}`);
    }
    return getMinimumCreditsForRule(pricing.rule);
}
function validateItemCount(itemCount) {
    if (!Number.isInteger(itemCount) || itemCount < 0) {
        throw new Error("itemCount must be a non-negative integer");
    }
}
function getMinimumCreditsForRule(rule) {
    return rule.baseCredits;
}
