export type DayStatus = "empty" | "none" | "partial" | "complete";

export interface DayProgress {
  status: DayStatus;
  ratio: number; // 0..1
  color: string;
}

const STATUS_COLOR: Record<DayStatus, string> = {
  empty: "#D9D9D9",
  none: "#E5484D", // nothing completed
  partial: "#F0B429", // some completed
  complete: "#3FA66B", // all completed
};

/**
 * Map a day's task tallies to a status + ring color.
 * grey = no tasks · green = all done · yellow = partial · red = none done.
 */
export function dayProgress(total: number, completed: number): DayProgress {
  let status: DayStatus;
  if (total === 0) status = "empty";
  else if (completed === total) status = "complete";
  else if (completed === 0) status = "none";
  else status = "partial";

  return {
    status,
    ratio: total === 0 ? 0 : completed / total,
    color: STATUS_COLOR[status],
  };
}
