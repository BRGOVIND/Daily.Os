/**
 * Workspace OS — tunable limits. Kept in one place so the domain has no magic
 * numbers scattered through it.
 */

/** How many recent items each dashboard strip surfaces. */
export const DASHBOARD_RECENT = 4;

/** How many timeline events the dashboard preview shows. */
export const DASHBOARD_TIMELINE = 6;

/** Hard cap on universal-search hits per category (keeps results snappy). */
export const SEARCH_PER_CATEGORY = 6;

/** Overall cap on search hits across all categories. */
export const SEARCH_TOTAL = 40;

/** Caps that keep the knowledge graph legible rather than a hairball. */
export const GRAPH_MAX_MISSIONS = 8;
export const GRAPH_MAX_LEAVES_PER_MISSION = 6;
export const GRAPH_MAX_LOOSE = 10;

/** Days of history the weekly-activity sparkline spans. */
export const WEEKLY_ACTIVITY_DAYS = 7;
