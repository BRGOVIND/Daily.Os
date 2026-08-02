/**
 * Workspace OS — public API.
 *
 * A self-contained, offline, UI-agnostic domain that turns a snapshot of the
 * user's data into workspace-scoped views: notes, journal, resources, a derived
 * timeline, universal search, a knowledge graph and statistics. It depends only
 * on `@/types`, `@/lib` leaf helpers, the Intelligence Engine's pure exports and
 * date-fns — never on React, Dexie or any component. The UI consumes these
 * outputs; it never reimplements them.
 *
 *   Module 2  Notes ............ makeBlock, notePlainText, noteChecklist
 *   Module 3  Resources ........ filterResources, allTags, parseTags
 *   Module 4  Search ........... universalSearch
 *   Module 5  Timeline ......... buildTimeline
 *   Module 6  Journal .......... journalStreak, moodAverage, sortJournal
 *   Module 8  Dashboard ........ buildDashboard
 *   Module 9  Graph ............ buildGraph
 *   Module 12 Statistics ....... computeWorkspaceStats
 */

// Types
export * from "./models/types";
export {
  DASHBOARD_RECENT,
  DASHBOARD_TIMELINE,
  SEARCH_TOTAL,
} from "./models/constants";

// Scoping
export { belongsTo, scopeSnapshot } from "./utils/scope";

// Notes
export {
  makeBlock,
  notePlainText,
  notePreview,
  noteWordCount,
  noteChecklist,
} from "./notes/notes";

// Journal
export { sortJournal, hasContent, journalStreak, moodAverage } from "./journal/journal";

// Resources
export {
  filterResources,
  allTags,
  parseTags,
  EMPTY_RESOURCE_FILTER,
  type ResourceFilter,
} from "./resources/resources";

// Timeline
export { buildTimeline } from "./timeline/timeline";

// Search
export { universalSearch } from "./search/search";

// Graph
export { buildGraph } from "./graph/graph";

// Statistics
export { computeWorkspaceStats } from "./stats/stats";

// Dashboard
export { buildDashboard } from "./dashboard/dashboard";
