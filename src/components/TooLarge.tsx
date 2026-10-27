import type { ReactNode } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MOVE_MEDIA_ITEM_LIMIT } from "@/lib/limits";

/**
 * One too-large treatment for every folder and gallery action that re-indexes
 * media (PORTAL-12837): the media count, the company's limit, and a way forward
 * that fits the action. Modals show TooLargeNotice and disable their button;
 * surfaces without a modal (drag, row menus) and server refusals open
 * TooLargeDialog instead of a toast.
 */

export type TooLargeAction =
  | "moveFolder"
  | "moveGalleries"
  | "createFolder"
  | "renameFolder"
  | "archiveFolder"
  | "unarchiveFolder"
  | "deleteFolder";

export interface TooLargeContext {
  count: number;
  /** Folder actions: whether there are subfolders to act on one at a time. */
  hasSubfolders?: boolean;
  /** Gallery moves: how many galleries are selected. */
  galleryCount?: number;
  /** Server refused after the pre-check passed: our count is stale, so don't quote it. */
  refused?: boolean;
}

const SUPPORT = "Contact support to raise your limit.";

const COPY: Record<TooLargeAction, { title: string; lead: string; subject: (c: TooLargeContext) => string; next: (c: TooLargeContext) => string }> = {
  moveFolder: {
    title: "Can't move folder",
    lead: "Too large to move.",
    subject: () => "This folder has",
    next: (c) => (c.hasSubfolders ? "Move its subfolders one at a time instead." : SUPPORT),
  },
  moveGalleries: {
    title: "Can't move galleries",
    lead: "Too large to move.",
    subject: (c) => (c.galleryCount === 1 ? "This gallery has" : "These galleries have"),
    next: (c) => (c.galleryCount === 1 ? SUPPORT : "Move fewer galleries at a time."),
  },
  createFolder: {
    title: "Can't create folder",
    lead: "Too many galleries.",
    subject: () => "The galleries you added have",
    next: () => "Remove some, then add them to the folder after it's created.",
  },
  renameFolder: {
    title: "Can't rename folder",
    lead: "Too large to rename.",
    subject: () => "This folder has",
    next: () => SUPPORT,
  },
  archiveFolder: {
    title: "Can't archive folder",
    lead: "Too large to archive.",
    subject: () => "This folder has",
    next: (c) => (c.hasSubfolders ? "Archive its subfolders one at a time first." : SUPPORT),
  },
  unarchiveFolder: {
    title: "Can't unarchive folder",
    lead: "Too large to unarchive.",
    subject: () => "This folder has",
    next: () => SUPPORT,
  },
  deleteFolder: {
    title: "Can't delete folder",
    lead: "Too large to delete.",
    subject: () => "This folder has",
    next: (c) => (c.hasSubfolders ? "Delete its subfolders one at a time first." : SUPPORT),
  },
};

export const isTooLarge = (count: number) => count > MOVE_MEDIA_ITEM_LIMIT;

/** "This folder has 12,450 media, more than your 5,000 limit for one action. <way forward>" */
function TooLargeText({ action, context, strongClassName }: { action: TooLargeAction; context: TooLargeContext; strongClassName?: string }) {
  const copy = COPY[action];
  if (context.refused) {
    return (
      <>
        <strong className={strongClassName ?? "font-semibold"}>{copy.lead}</strong> {copy.subject(context)} grown past your{" "}
        {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} limit for one action since you started, so nothing changed. {copy.next(context)}
      </>
    );
  }
  return (
    <>
      <strong className={strongClassName ?? "font-semibold"}>{copy.lead}</strong> {copy.subject(context)}{" "}
      <strong className={strongClassName ?? "font-semibold"}>{context.count.toLocaleString()} media</strong>, more than your{" "}
      {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} limit for one action. {copy.next(context)}
    </>
  );
}

/** In-modal notice. Stays up for as long as it applies; the modal disables its button. */
export function TooLargeNotice({ action, context }: { action: TooLargeAction; context: TooLargeContext }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-[#F6C343] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
      <i className="bi bi-info-circle flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
      <p>
        <TooLargeText action={action} context={context} />
      </p>
    </div>
  );
}

/** Shared blocked dialog: no-modal surfaces and server refusals. */
export function TooLargeDialog({
  action,
  context,
  onClose,
  children,
}: {
  /** Null keeps the dialog closed. */
  action: TooLargeAction | null;
  context: TooLargeContext | null;
  onClose: () => void;
  /** Extra line under the message, e.g. a server refusal after the pre-check passed. */
  children?: ReactNode;
}) {
  const open = action != null && context != null;
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent className="max-w-md">
        {open && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{COPY[action].title}</AlertDialogTitle>
              <AlertDialogDescription>
                <TooLargeText action={action} context={context} strongClassName="font-semibold text-foreground" />
                {children}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
