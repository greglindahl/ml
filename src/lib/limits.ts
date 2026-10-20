/**
 * Most media a folder move can reindex right away. Prod reads this per company
 * from LaunchDarkly (portal-library-folders-max-media-per-operation, default
 * 5,000); the prototype plays a company set to 10,000.
 */
export const MOVE_MEDIA_ITEM_LIMIT = 10_000;

/**
 * Proposed: bigger moves can still run, deferred to an overnight window so the
 * reindex doesn't slow search during the day. Past this, it's a support job
 * (scripted, white-glove). The number is a placeholder for the Paul/Sam call.
 */
export const OVERNIGHT_MOVE_MEDIA_LIMIT = 50_000;

/** When scheduled moves run (company local time). */
export const OVERNIGHT_WINDOW_LABEL = "11:00 PM";

export type MoveTier = "now" | "overnight" | "support";

export function moveTier(mediaCount: number): MoveTier {
  if (mediaCount <= MOVE_MEDIA_ITEM_LIMIT) return "now";
  if (mediaCount <= OVERNIGHT_MOVE_MEDIA_LIMIT) return "overnight";
  return "support";
}
