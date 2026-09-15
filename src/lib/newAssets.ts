import type { ChunkedUpload } from "@/lib/mockUploadData";
import type { LibraryAsset } from "@/lib/mockLibraryData";

/**
 * Turns a finished upload into a library asset.
 *
 * `dateCreated` is keyed off `completedAt`, not `createdAt` — the fix Amber
 * logged after Randy and Kim reported large files getting buried on earlier
 * pages. Swap it to `createdAt` here to reproduce today's production ordering;
 * `capturedAt` is the third option we haven't costed.
 */
export function uploadToLibraryAsset(upload: ChunkedUpload): LibraryAsset {
  const completed = upload.completedAt ? new Date(upload.completedAt) : new Date();

  return {
    id: `upload_${upload.queueId}`,
    name: upload.filename,
    creator: "You",
    creatorId: "current-user",
    type: upload.kind,

    dateCreated: completed,
    captureDate: new Date(upload.capturedAt),

    aspectRatio: upload.kind === "video" ? "16:9" : "4:3",
    orientation: upload.kind === "video" ? "landscape" : "landscape",
    status: "pending",

    tags: [],
    tagInfo: [],
    fileSize: `${Math.round(upload.fileSize / (1024 * 1024))} MB`,

    // Freshly uploaded media hasn't been viewed by anyone yet.
    isUnviewed: true,
    isFavorite: false,
    isBranded: false,

    thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(upload.queueId)}/400/300`,

    downloads: 0,
    shares: 0,
    galleries: 0,
    viewers: 0,
    publicViews: 0,
    publicDownloads: 0,
    favorites: 0,
  } as LibraryAsset;
}
