/**
 * Max media one folder or gallery action may re-index (PORTAL-12837). Per company
 * in prod (portal-library-folders-max-media-per-operation flag); 5,000 is the
 * server default the prototype stands in with.
 */
export const MOVE_MEDIA_ITEM_LIMIT = 5_000;
